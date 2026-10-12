import { createTargetServer } from '../fixtures/target-server.mjs';
import { inspectJobContract, inspectErrorResponse, inspectIllegalTransition } from '../src/quality-model.mjs';

async function request(baseUrl, pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, { headers: { 'content-type': 'application/json' }, ...options });
  return { status: response.status, body: await response.json() };
}

const target = createTargetServer({ fault: 'normal' });
const baseUrl = await target.start();
try {
  const created = await request(baseUrl, '/api/jobs', { method: 'POST', body: JSON.stringify({ query: 'browser retrieval', strategy: 'strategy-v2' }) });
  const before = await request(baseUrl, `/api/jobs/${created.body.id}`);
  const illegal = await request(baseUrl, `/api/jobs/${created.body.id}/submit`, { method: 'POST', body: '{}' });
  const after = await request(baseUrl, `/api/jobs/${created.body.id}`);
  console.log(JSON.stringify({
    contractFailures: inspectJobContract(created.body),
    illegalTransitionFailures: inspectIllegalTransition({ before: before.body, response: illegal, after: after.body }),
    missingJobErrorFailures: inspectErrorResponse(await request(baseUrl, '/api/jobs/missing')),
  }, null, 2));
} finally {
  await target.close();
}
