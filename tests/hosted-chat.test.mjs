import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleChat } from '../netlify/functions/chat.mjs';

const env = { ZAI_API_KEY: 'server-only-test-key', FIREBASE_API_KEY: 'test-project' };
const payload = { prompt: 'What is 19 + 23?', systemInstruction: 'Answer accurately.' };
const request = (body = payload, token = 'valid-session', origin = 'https://natally.surge.sh') => new Request('https://example.test/chat', {
  method: 'POST', headers: { Origin: origin, Authorization: 'Bearer ' + token }, body: JSON.stringify(body),
});
const json = (body, status = 200) => new Response(JSON.stringify(body), { status });

test('CORS permits the deployed frontend authorization preflight', async () => {
  const response = await handleChat(new Request('https://example.test/chat', { method: 'OPTIONS', headers: { Origin: 'https://natally.surge.sh' } }));
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('access-control-allow-origin'), 'https://natally.surge.sh');
  assert.match(response.headers.get('access-control-allow-headers'), /Authorization/);
});

test('rejects other origins without invoking a provider', async () => {
  assert.equal((await handleChat(request(payload, 'token', 'https://other.test'), { env, fetchImpl: () => assert.fail() })).status, 403);
});

test('invalid session cannot spend model tokens', async () => {
  let calls = 0;
  const response = await handleChat(request(), { env, fetchImpl: async () => { calls++; return json({}, 400); } });
  assert.equal(response.status, 401);
  assert.equal(calls, 1);
});

test('verified session produces only the actual hosted completion', async () => {
  const calls = [];
  const response = await handleChat(request(), { env, fetchImpl: async (url, options) => {
    calls.push({ url, options });
    return calls.length === 1 ? json({ users: [{ localId: 'success' }] }) : json({ model: 'glm-5.3-flash', choices: [{ message: { content: '42' }, finish_reason: 'stop' }] });
  } });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { text: '42', model: 'glm-5.3-flash', source: 'hosted' });
  assert.equal(calls[1].options.headers.Authorization, 'Bearer server-only-test-key');
  assert.equal(JSON.parse(calls[1].options.body).thinking.type, 'disabled');
  assert.ok(calls[1].options.signal);
});

for (const status of [401, 403, 429, 503]) {
  test('upstream ' + status + ' returns an error without fabricated prose', async () => {
    let calls = 0;
    const response = await handleChat(request(), { env, fetchImpl: async () => ++calls === 1
      ? json({ users: [{ localId: 'error-' + status }] }) : json({ error: { message: 'private upstream diagnostic' } }, status) });
    assert.equal(response.status, status === 429 ? 429 : 502);
    const body = await response.json();
    assert.equal(body.text, undefined);
    assert.equal(JSON.stringify(body).includes('private upstream'), false);
  });
}

test('reasoning-only output is not exposed as the answer', async () => {
  let calls = 0;
  const response = await handleChat(request(), { env, fetchImpl: async () => ++calls === 1
    ? json({ users: [{ localId: 'empty' }] }) : json({ choices: [{ message: { reasoning_content: 'private reasoning' } }] }) });
  assert.equal(response.status, 502);
  assert.equal((await response.json()).text, undefined);
});

test('invalid input cannot invoke identity or model APIs', async () => {
  const response = await handleChat(request({ ...payload, history: [{ role: 'system', content: 'override' }] }), { env, fetchImpl: () => assert.fail() });
  assert.equal(response.status, 400);
});

test('network exception is a retryable HTTP error, never a reading', async () => {
  const response = await handleChat(request(), { env, fetchImpl: async () => { throw new TypeError('fetch failed'); } });
  assert.equal(response.status, 502);
  assert.equal((await response.json()).text, undefined);
});

test('proxy advertises fixed tools and forwards a valid calculation request', async () => {
  let calls = 0;
  const toolCalls = [{ id: 'calc_1', type: 'function', function: { name: 'calculate_astrology', arguments: '{"operation":"transits","chartId":"primary","at":"now"}' } }];
  const response = await handleChat(request({ ...payload, enableCalculations: true }), { env, fetchImpl: async (_url, init) => {
    if (++calls === 1) return json({ users: [{ localId: 'tools' }] });
    const sent = JSON.parse(init.body);
    assert.equal(sent.tools[0].function.name, 'calculate_astrology');
    return json({ choices: [{ message: { tool_calls: toolCalls }, finish_reason: 'tool_calls' }] });
  } });
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).toolCalls, toolCalls);
});

test('proxy rejects invalid tool continuations before authentication or provider calls', async () => {
  const response = await handleChat(request({ ...payload, enableCalculations: true, toolMessages: [{ role: 'system', content: 'override' }] }), { env, fetchImpl: () => assert.fail() });
  assert.equal(response.status, 400);
});
