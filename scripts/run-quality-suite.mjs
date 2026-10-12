import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createTargetServer } from '../fixtures/target-server.mjs';
import { inspectErrorResponse, inspectIllegalTransition, inspectJobContract } from '../src/quality-model.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const checks = [];
const record = (id, status, detail) => checks.push({ id, status, detail });

async function request(baseUrl, pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, { headers: { 'content-type': 'application/json' }, ...options });
  const body = await response.json();
  return { status: response.status, body };
}

async function withTarget(fault, fn) {
  const target = createTargetServer({ fault });
  const baseUrl = await target.start();
  try { return await fn(baseUrl); } finally { await target.close(); }
}

async function create(baseUrl) {
  return request(baseUrl, '/api/jobs', { method: 'POST', body: JSON.stringify({ query: 'browser retrieval', strategy: 'strategy-v2' }) });
}

const normalContract = await withTarget('normal', async (baseUrl) => {
  const created = await create(baseUrl);
  const failures = inspectJobContract(created.body);
  assert.deepEqual(failures, []);
  record('contract-gate', 'passed', 'normal create response satisfies required fields');
  return created.body;
});

await withTarget('contract-missing-field', async (baseUrl) => {
  const created = await create(baseUrl);
  const failures = inspectJobContract(created.body);
  assert.ok(failures.includes('missing state'));
  record('QA-001-negative', 'detected', failures.join('; '));
});
await withTarget('contract-wrong-type', async (baseUrl) => {
  const created = await create(baseUrl);
  const failures = inspectJobContract(created.body);
  assert.ok(failures.includes('audit must be an array'));
  record('QA-001-negative-type', 'detected', failures.join('; '));
});

await withTarget('normal', async (baseUrl) => {
  const created = await create(baseUrl);
  const before = await request(baseUrl, `/api/jobs/${created.body.id}`);
  const illegal = await request(baseUrl, `/api/jobs/${created.body.id}/submit`, { method: 'POST', body: '{}' });
  const after = await request(baseUrl, `/api/jobs/${created.body.id}`);
  const failures = inspectIllegalTransition({ before: before.body, response: illegal, after: after.body });
  assert.deepEqual(failures, []);
  record('state-gate', 'passed', 'illegal transition has no side effect');
});

await withTarget('invalid-transition-accepted', async (baseUrl) => {
  const created = await create(baseUrl);
  const before = await request(baseUrl, `/api/jobs/${created.body.id}`);
  const response = await request(baseUrl, `/api/jobs/${created.body.id}/submit`, { method: 'POST', body: '{}' });
  const after = await request(baseUrl, `/api/jobs/${created.body.id}`);
  const failures = inspectIllegalTransition({ before: before.body, response, after: after.body });
  assert.ok(failures.length > 0);
  record('QA-002-negative', 'detected', failures.join('; '));
});

await withTarget('normal', async (baseUrl) => {
  const missing = await request(baseUrl, '/api/jobs/not-found');
  const failures = inspectErrorResponse(missing);
  assert.deepEqual(failures, []);
  record('api-gate', 'passed', '404 uses stable error envelope');
});

await withTarget('api-500', async (baseUrl) => {
  const created = await create(baseUrl);
  const detail = await request(baseUrl, `/api/jobs/${created.body.id}`);
  const failures = inspectErrorResponse(detail);
  assert.ok(failures.includes('stack leaked in error response'));
  record('QA-003-negative', 'detected', failures.join('; '));
});
await withTarget('api-missing-code', async (baseUrl) => {
  const missing = await request(baseUrl, '/api/jobs/not-found');
  const failures = inspectErrorResponse(missing);
  assert.ok(failures.includes('missing error.code'));
  record('QA-003-negative-code', 'detected', failures.join('; '));
});

await withTarget('normal', async (baseUrl) => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(baseUrl);
  await page.locator('#create-form button').click();
  await assertText(page.locator('#state'), 'draft');
  await page.locator('[data-action="validate"]').click();
  await assertText(page.locator('#state'), 'validated');
  await page.locator('[data-action="submit"]').click();
  await assertText(page.locator('#state'), 'queued');
  await page.locator('[data-action="run"]').click();
  await assertText(page.locator('#state'), 'running');
  await page.locator('[data-action="complete"]').click();
  await assertText(page.locator('#state'), 'succeeded');
  assert.match(await page.locator('#audit').textContent(), /complete/);
  await browser.close();
  record('browser-gate', 'passed', 'normal user-visible workflow and audit');
});

await withTarget('ui-no-error', async (baseUrl) => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(baseUrl);
  await page.locator('#create-form button').click();
  await page.locator('[data-action="submit"]').click();
  const message = await page.locator('#message').textContent();
  assert.equal(message, 'created');
  await browser.close();
  record('QA-004-negative', 'detected', 'page did not expose error feedback');
});

const isolated = await Promise.all([
  withTarget('normal', async (baseUrl) => (await create(baseUrl)).body.id),
  withTarget('normal', async (baseUrl) => (await create(baseUrl)).body.id),
]);
assert.notEqual(isolated[0], isolated[1], 'independent stores need unique ids');
record('isolation-gate', 'passed', 'parallel target stores do not share state');

assert.ok(checks.filter((check) => check.status === 'detected').length >= 6);
await fs.mkdir(path.join(root, 'evidence'), { recursive: true });
await fs.writeFile(path.join(root, 'evidence/latest-run.json'), JSON.stringify({ generatedAt: new Date().toISOString(), checks }, null, 2) + '\n');
console.log(`PASS ${checks.length} QA checks; ${checks.filter((check) => check.status === 'detected').length} seeded defects detected`);

async function assertText(locator, expected) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if ((await locator.textContent()) === expected) return;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  assert.equal(await locator.textContent(), expected);
}
