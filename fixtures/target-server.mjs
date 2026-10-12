import http from 'node:http';
import { randomUUID } from 'node:crypto';

const transitions = {
  validate: { draft: 'validated' },
  submit: { validated: 'queued' },
  run: { queued: 'running' },
  complete: { running: 'succeeded' },
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function pageHtml(fault) {
  const encodedFault = JSON.stringify(fault);
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><title>QA Target Fixture</title></head>
<body>
  <main>
    <h1>QA Target Fixture</h1>
    <form id="create-form"><label>Query <input id="query" value="browser retrieval" required></label><button type="submit">Create</button></form>
    <p id="message" aria-live="polite">ready</p>
    <p>Job: <code id="job-id">none</code></p>
    <p>State: <strong id="state">none</strong></p>
    <div id="actions">
      <button data-action="validate" disabled>Validate</button>
      <button data-action="submit" disabled>Submit</button>
      <button data-action="run" disabled>Run</button>
      <button data-action="complete" disabled>Complete</button>
    </div>
    <ol id="audit"><li>none</li></ol>
  </main>
  <script>window.__TARGET_FAULT__=${encodedFault};</script>
  <script>
    const fault = window.__TARGET_FAULT__;
    const form = document.querySelector('#create-form');
    const message = document.querySelector('#message');
    const jobId = document.querySelector('#job-id');
    const state = document.querySelector('#state');
    const audit = document.querySelector('#audit');
    const buttons = [...document.querySelectorAll('[data-action]')];
    let currentId = null;
    function setMessage(text) { message.textContent = text; }
    function render(job) {
      currentId = job.id;
      jobId.textContent = job.id;
      state.textContent = job.state || 'missing';
      audit.replaceChildren();
      for (const event of (job.audit || [])) audit.append(Object.assign(document.createElement('li'), { textContent: event.action + ': ' + event.from + ' -> ' + event.to }));
      const allowed = fault === 'ui-no-error' ? ['submit'] : ({draft:['validate'], validated:['submit'], queued:['run'], running:['complete']}[job.state] || []);
      for (const button of buttons) button.disabled = !allowed.includes(button.dataset.action);
    }
    async function api(path, options = {}) {
      const response = await fetch(path, { headers: {'content-type':'application/json'}, ...options });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ? body.error.code + ': ' + body.error.message : 'HTTP ' + response.status);
      return body;
    }
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      try { render(await api('/api/jobs', {method:'POST', body: JSON.stringify({query: document.querySelector('#query').value, strategy:'strategy-v2'})})); setMessage('created'); }
      catch (error) { setMessage(error.message); }
    });
    for (const button of buttons) button.addEventListener('click', async () => {
      try { render(await api('/api/jobs/' + encodeURIComponent(currentId) + '/' + button.dataset.action, {method:'POST', body:'{}'})); setMessage(button.dataset.action + ' ok'); }
      catch (error) { if (fault !== 'ui-no-error') setMessage(error.message); }
    });
  </script>
</body></html>`;
}

export function createTargetServer({ port = 0, fault = 'normal' } = {}) {
  const jobs = new Map();
  let sequence = 0;
  function createJob(input) {
    sequence += 1;
    const now = new Date().toISOString();
    const job = {
      id: `job-${sequence}-${randomUUID().slice(0, 6)}`,
      query: input.query,
      strategy: input.strategy,
      state: 'draft',
      audit: [],
      error: null,
      createdAt: now,
      updatedAt: now,
    };
    jobs.set(job.id, job);
    return clone(job);
  }
  function responseJob(job) {
    const value = clone(job);
    if (fault === 'contract-missing-field') delete value.state;
    if (fault === 'contract-wrong-type') value.audit = {};
    return value;
  }
  function normalTransition(job, action) {
    const next = transitions[action]?.[job.state];
    if (!next) return { status: 409, body: { error: { code: 'INVALID_TRANSITION', message: 'invalid transition', details: { state: job.state, action } } } };
    const now = new Date().toISOString();
    job.audit.push({ action, from: job.state, to: next, at: now });
    job.state = next;
    job.updatedAt = now;
    return { status: 200, body: responseJob(job) };
  }

  const server = http.createServer(async (request, response) => {
    const url = new URL(request.url, 'http://127.0.0.1');
    const send = (status, body, type = 'application/json') => {
      response.writeHead(status, { 'content-type': `${type}; charset=utf-8` });
      response.end(type === 'application/json' ? JSON.stringify(body) : body);
    };
    if (request.method === 'GET' && url.pathname === '/') {
      send(200, pageHtml(fault), 'text/html');
      return;
    }
    if (request.method === 'GET' && url.pathname === '/api/health') {
      send(200, { ok: true, fault });
      return;
    }
    if (request.method === 'POST' && url.pathname === '/api/jobs') {
      let raw = '';
      for await (const chunk of request) raw += chunk;
      let input;
      try { input = JSON.parse(raw || '{}'); } catch { send(400, { error: { code: 'INVALID_JSON', message: 'invalid json' } }); return; }
      if (typeof input.query !== 'string' || input.query.trim().length < 2) {
        send(422, { error: { code: 'INVALID_JOB_INPUT', message: 'query is required' } });
        return;
      }
      send(201, responseJob(createJob({ query: input.query.trim(), strategy: input.strategy || 'strategy-v2' })));
      return;
    }
    const match = url.pathname.match(/^\/api\/jobs\/([^/]+)(?:\/(validate|submit|run|complete))?$/);
    if (match) {
      const job = jobs.get(decodeURIComponent(match[1]));
      if (!job) {
        if (fault === 'api-missing-code') send(404, { error: { message: 'job not found' } });
        else send(404, { error: { code: 'JOB_NOT_FOUND', message: 'job not found' } });
        return;
      }
      if (request.method === 'GET' && !match[2]) {
        if (fault === 'api-500') {
          send(500, { error: { code: 'INTERNAL_ERROR', message: 'fixture detail failure', stack: 'Error: fixture detail failure at target-server.mjs:1:1' } });
        } else send(200, responseJob(job));
        return;
      }
      if (request.method === 'POST' && match[2]) {
        if (fault === 'invalid-transition-accepted' && match[2] === 'submit' && job.state === 'draft') {
          const now = new Date().toISOString();
          job.audit.push({ action: 'submit', from: 'draft', to: 'queued', at: now });
          job.state = 'queued';
          job.updatedAt = now;
          send(200, responseJob(job));
          return;
        }
        const result = normalTransition(job, match[2]);
        send(result.status, result.body);
        return;
      }
    }
    send(404, { error: { code: 'NOT_FOUND', message: 'route not found' } });
  });

  return {
    server,
    fault,
    async start() {
      await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));
      return `http://127.0.0.1:${server.address().port}`;
    },
    async close() {
      if (!server.listening) return;
      await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    },
  };
}
