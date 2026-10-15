import test from 'node:test';
import assert from 'node:assert/strict';
import { createSessionProfileLoader, getEntryStage, type SessionProfileState } from '../src/services/sessionProfile';

const ready = (uid: string | null, profile: string | null = null): SessionProfileState<string> => ({ uid, profile, status: 'ready', error: null });
function deferred<Value>() {
  let resolve!: (value: Value) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<Value>((resolveValue, rejectValue) => { resolve = resolveValue; reject = rejectValue; });
  return { promise, resolve, reject };
}

test('login precedes onboarding even with a device chart and profile loading precedes either app route', () => {
  assert.equal(getEntryStage(false, null, ready(null), true), 'session-loading');
  assert.equal(getEntryStage(true, null, ready(null), false), 'login');
  assert.equal(getEntryStage(true, null, ready(null), true), 'login');
  assert.equal(getEntryStage(true, 'new', ready('old', 'old chart'), true), 'profile-loading');
  assert.equal(getEntryStage(true, 'new', { ...ready('new'), status: 'loading' }, false), 'profile-loading');
  assert.equal(getEntryStage(true, 'new', ready('new'), false), 'onboarding');
  assert.equal(getEntryStage(true, 'returning', ready('returning', 'chart'), true), 'workspace');
  assert.equal(getEntryStage(true, 'new', { ...ready('new'), status: 'error', error: 'offline' }, false), 'profile-error');
});

test('pending lookup cannot render onboarding; returning and new profiles resolve distinctly', async () => {
  const request = deferred<string | null>();
  const states: SessionProfileState<string>[] = [];
  const loader = createSessionProfileLoader(() => request.promise, state => states.push(state));
  const loading = loader.load('account');
  assert.equal(states.length, 1);
  assert.deepEqual(states.at(-1), { uid: 'account', status: 'loading', profile: null, error: null });
  request.resolve('saved chart');
  await loading;
  assert.deepEqual(states.at(-1), ready('account', 'saved chart'));
  const fresh = createSessionProfileLoader<string>(async () => null, state => states.push(state));
  await fresh.load('new');
  assert.deepEqual(states.at(-1), ready('new'));
});

test('late profile success cannot overwrite a different account', async () => {
  const first = deferred<string | null>();
  const second = deferred<string | null>();
  const states: SessionProfileState<string>[] = [];
  const loader = createSessionProfileLoader(uid => uid === 'first' ? first.promise : second.promise, state => states.push(state));
  const firstLoad = loader.load('first');
  const secondLoad = loader.load('second');
  second.resolve('second chart');
  await secondLoad;
  first.resolve('first chart');
  await firstLoad;
  assert.deepEqual(states.at(-1), ready('second', 'second chart'));
  assert.equal(states.filter(state => state.profile === 'first chart').length, 0);
});

test('sign out invalidates both late success and late error', async () => {
  for (const rejects of [false, true]) {
    const request = deferred<string | null>();
    const states: SessionProfileState<string>[] = [];
    const loader = createSessionProfileLoader(() => request.promise, state => states.push(state));
    const pending = loader.load('account');
    await loader.load(null);
    if (rejects) request.reject(new Error('late error'));
    else request.resolve('late chart');
    await pending;
    assert.deepEqual(states.at(-1), ready(null));
    assert.equal(states.length, 2);
  }
});

test('errors are not empty profiles and a retry can recover', async () => {
  let attempts = 0;
  const states: SessionProfileState<string>[] = [];
  const loader = createSessionProfileLoader(async () => {
    if (++attempts === 1) throw new Error('permission denied');
    return 'saved chart';
  }, state => states.push(state));
  await loader.load('account');
  assert.deepEqual(states.at(-1), { uid: 'account', status: 'error', profile: null, error: 'permission denied' });
  await loader.load('account');
  assert.deepEqual(states.at(-1), ready('account', 'saved chart'));
});

test('disposed profile loaders cannot write or restart', async () => {
  const request = deferred<string | null>();
  const states: SessionProfileState<string>[] = [];
  const loader = createSessionProfileLoader(() => request.promise, state => states.push(state));
  const pending = loader.load('account');
  loader.dispose();
  request.resolve('late chart');
  await pending;
  await loader.load('other');
  assert.equal(states.length, 1);
});
