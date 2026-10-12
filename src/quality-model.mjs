export const requiredJobFields = ['id', 'query', 'strategy', 'state', 'audit', 'error', 'createdAt', 'updatedAt'];

export function inspectJobContract(job) {
  const failures = [];
  if (!job || typeof job !== 'object') return ['response is not an object'];
  for (const field of requiredJobFields) {
    if (!(field in job)) failures.push(`missing ${field}`);
  }
  if ('audit' in job && !Array.isArray(job.audit)) failures.push('audit must be an array');
  if ('state' in job && !['draft', 'validated', 'queued', 'running', 'succeeded', 'failed'].includes(job.state)) failures.push('invalid state');
  return failures;
}

export function inspectErrorResponse({ status, body }) {
  const failures = [];
  if (status < 400) failures.push(`expected error status, got ${status}`);
  if (!body?.error?.code) failures.push('missing error.code');
  if (!body?.error?.message) failures.push('missing error.message');
  if (body?.error?.stack || JSON.stringify(body).includes(' at ')) failures.push('stack leaked in error response');
  return failures;
}

export function inspectIllegalTransition({ before, response, after }) {
  const failures = [];
  if (response.status !== 409) failures.push(`expected 409, got ${response.status}`);
  if (after.state !== before.state) failures.push(`state changed from ${before.state} to ${after.state}`);
  if (after.audit.length !== before.audit.length) failures.push('audit changed after illegal transition');
  if (response.body?.error?.code !== 'INVALID_TRANSITION') failures.push('missing INVALID_TRANSITION');
  return failures;
}
