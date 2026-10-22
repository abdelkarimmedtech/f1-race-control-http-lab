import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { app } from './server.js';
test('real HTTP scenarios, dashboard endpoints and successful controls', async () => {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const auth = { Authorization: 'Bearer race-control-token' };
  try {
    for (const [path, method, status, headers] of [
      ['/race', 'GET', 200], ['/drivers/abc', 'GET', 400],
      ['/race-control/private', 'GET', 401],
      ['/stewards/red-flag', 'POST', 403, { ...auth, 'x-role': 'viewer' }],
      ['/drivers/1/pit', 'DELETE', 405],
      ['/race-control/private', 'GET', 200, auth],
      ['/stewards/red-flag', 'POST', 200, { ...auth, 'x-role': 'steward' }],
      ['/drivers/1/pit', 'POST', 200],
      ['/drivers', 'GET', 200], ['/drivers/1', 'GET', 200], ['/laps', 'GET', 200],
      ['/weather', 'GET', 200], ['/race-control/messages', 'GET', 200],
      ['/drivers/999', 'GET', 404], ['/drivers/-1', 'GET', 400]
    ]) {
      const res = await fetch(base + path, { method, headers });
      assert.equal(res.status, status, `${method} ${path}`);
      assert.equal((await res.json()).status, status);
      if (status === 405) assert.equal(res.headers.get('allow'), 'POST');
      assert.equal(res.headers.get('access-control-allow-origin'), '*');
    }
    const flag = await fetch(base + '/race/flag', { method: 'POST', headers: { ...auth, 'x-role': 'steward', 'Content-Type': 'application/json' }, body: JSON.stringify({ flag: 'GREEN' }) });
    assert.equal(flag.status, 200);
    assert.equal((await flag.json()).race.flag, 'GREEN');
    const malformed = await fetch(base + '/race/flag', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
    assert.equal(malformed.status, 400);
    const preflight = await fetch(base + '/drivers/1/pit', { method: 'OPTIONS', headers: { Origin: 'http://192.168.100.101:5173', 'Access-Control-Request-Method': 'DELETE' } });
    assert.equal(preflight.status, 204);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
