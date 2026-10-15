import { test } from 'node:test';
import assert from 'node:assert/strict';
import { completeHosted, HostedAuthenticationError } from '../src/services/hostedInference.ts';

const payload = { prompt: 'What are significant transits?', systemInstruction: 'Use supplied facts.' };

test('client sends the session credential and returns the hosted answer unchanged', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async (_input, init) => {
    assert.equal((init?.headers as Record<string, string>).Authorization, 'Bearer session');
    assert.equal(JSON.parse(init?.body as string).prompt, payload.prompt);
    return new Response(JSON.stringify({ text: 'Actual model answer', model: 'glm-5.3-flash', source: 'hosted' }));
  };
  try {
    assert.deepEqual(await completeHosted(payload, 'session', 'https://example.test/chat'), { text: 'Actual model answer', model: 'glm-5.3-flash' });
  } finally { globalThis.fetch = original; }
});

test('client fails closed on network failure and never supplies local prose', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => { throw new TypeError('fetch failed'); };
  try {
    await assert.rejects(completeHosted(payload, 'session', 'https://example.test/chat'), /fetch failed/);
  } finally { globalThis.fetch = original; }
});

test('client rejects missing authentication before calling the backend', async () => {
  await assert.rejects(completeHosted(payload, '', 'https://example.test/chat'), error =>
    error instanceof HostedAuthenticationError && error.code === 'auth_required');
});

test('expired session exposes an actionable authentication error', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ error: 'Sign in again.' }), { status: 401 });
  try {
    await assert.rejects(completeHosted(payload, 'expired', 'https://example.test/chat'), error =>
      error instanceof HostedAuthenticationError && error.code === 'auth_required');
  } finally { globalThis.fetch = original; }
});

test('client rejects legacy fallback or malformed successful responses', async () => {
  const original = globalThis.fetch;
  try {
    for (const body of [{ text: 'Template', model: 'local', source: 'offline_calibration' }, { text: '', model: 'glm-5.3-flash', source: 'hosted' }]) {
      globalThis.fetch = async () => new Response(JSON.stringify(body));
      await assert.rejects(completeHosted(payload, 'session', 'https://example.test/chat'), /no verified model response/);
    }
  } finally { globalThis.fetch = original; }
});

test('client exposes provider failures for retry instead of creating a reply', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ error: 'Model unavailable' }), { status: 502 });
  try {
    await assert.rejects(completeHosted(payload, 'session', 'https://example.test/chat'), /Model unavailable/);
  } finally { globalThis.fetch = original; }
});
