import test from 'node:test';
import assert from 'node:assert/strict';
import { accountStorageKey, loadAccountValue, saveAccountValue } from '../src/services/accountStorage';
import { getPersistedVantageLocation, savePersistedVantageLocation } from '../src/services/locations';
import { completeHosted, requestHostedInference, HostedAuthenticationError } from '../src/services/hostedInference';

const storage = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
} });

for (const key of ['astrosphere_natally_chat_history_v3', 'astrosphere_user_lore_v1']) {
  test(`${key}: A → signed out → B → A isolates data and preserves legacy bytes`, () => {
    storage.clear();
    storage.set(key, '["unowned private history"]');
    assert.deepEqual(loadAccountValue(key, 'A', []), []);
    saveAccountValue(key, 'A', ['A private']);
    assert.deepEqual(loadAccountValue(key, null, []), []);
    saveAccountValue(key, null, ['must not write']);
    assert.deepEqual(loadAccountValue(key, 'B', []), []);
    saveAccountValue(key, 'B', ['B private']);
    assert.deepEqual(loadAccountValue(key, 'A', []), ['A private']);
    assert.deepEqual(loadAccountValue(key, 'B', []), ['B private']);
    saveAccountValue(key, 'B', []);
    assert.deepEqual(loadAccountValue(key, 'A', []), ['A private']);
    assert.equal(storage.get(key), '["unowned private history"]');
  });
}

test('empty identities fail closed and invalid JSON never falls back to legacy', () => {
  assert.equal(accountStorageKey('history', ''), null);
  assert.equal(accountStorageKey('history', ' '), null);
  assert.notEqual(accountStorageKey('history', 'a:b'), accountStorageKey('history', 'a%3Ab'));
  storage.set('history:A', '{bad');
  storage.set('history', '["private"]');
  assert.deepEqual(loadAccountValue('history', 'A', []), []);
});

test('personal location persistence is account scoped', () => {
  const location = { name: 'A place', country: 'CA', latitude: 1, longitude: 2, timezoneOffset: 0, label: 'A place' };
  savePersistedVantageLocation(location, 'A');
  assert.equal(getPersistedVantageLocation('B'), null);
  assert.deepEqual(getPersistedVantageLocation('A'), location);
  assert.equal(getPersistedVantageLocation(''), null);
});

test('obsolete session is rejected before Firebase import or any network request', async () => {
  await assert.rejects(requestHostedInference({ prompt: 'private', systemInstruction: '' }, undefined, () => false), HostedAuthenticationError);
});

test('late hosted result is rejected after account switch', async () => {
  const original = globalThis.fetch;
  let active = true;
  let release!: (response: Response) => void;
  globalThis.fetch = () => new Promise(resolve => { release = resolve; });
  try {
    const pending = completeHosted({ prompt: 'A private', systemInstruction: '' }, 'A-token', 'https://test.invalid', undefined, () => active);
    active = false;
    release(new Response(JSON.stringify({ source: 'hosted', model: 'test', text: 'A answer' })));
    await assert.rejects(pending, HostedAuthenticationError);
  } finally { globalThis.fetch = original; }
});

test('account switch during calculation prevents a subsequent hosted tool round', async () => {
  const original = globalThis.fetch;
  let active = true;
  let requests = 0;
  globalThis.fetch = async () => {
    requests++;
    return new Response(JSON.stringify({ source: 'hosted', model: 'test', toolCalls: [{
      id: 'call-1', type: 'function', function: { name: 'calculate_astrology', arguments: '{"operation":"lookup_place","query":"London"}' },
    }] }));
  };
  try {
    await assert.rejects(completeHosted({ prompt: 'private', systemInstruction: '' }, 'A-token', 'https://test.invalid',
      async () => { active = false; return 'calculated'; }, () => active), HostedAuthenticationError);
    assert.equal(requests, 1);
  } finally { globalThis.fetch = original; }
});
