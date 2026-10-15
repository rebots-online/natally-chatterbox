import test from 'node:test';
import assert from 'node:assert/strict';
import { initSupertonic, supertonicSpeak, subscribeVoiceStatus } from '../src/services/supertonicTts';

test('failed GPU synthesis discards poisoned worker and preload; replay uses fresh WASM runtime', async () => {
  const workers: TestWorker[] = [];
  class TestWorker {
    onmessage: ((event: { data: any }) => void) | null = null;
    onerror: (() => void) | null = null;
    terminated = false;
    requests: any[] = [];
    constructor() { workers.push(this); }
    postMessage(data: any) { this.requests.push(data); }
    terminate() { this.terminated = true; }
    reply(data: any) { this.onmessage?.({ data }); }
  }
  const previousWorker = globalThis.Worker;
  Object.assign(globalThis, { Worker: TestWorker });
  let latestPhase = '';
  const unsubscribe = subscribeVoiceStatus(value => { latestPhase = value.phase; });
  try {
    const initialPreload = initSupertonic();
    const first = workers[0];
    first.reply({ id: first.requests[0].id, preloaded: true });
    await initialPreload;
    const failed = supertonicSpeak('First reading chunk.');
    const queued = supertonicSpeak('Prefetched next chunk.');
    const failedCheck = assert.rejects(failed, /destroy/);
    const queuedCheck = assert.rejects(queued, /destroy/);
    first.reply({ id: first.requests[1].id, error: "Cannot read properties of undefined (reading 'destroy')", runtimeFailed: true, backend: 'webgpu' });
    await failedCheck;
    assert.equal(first.terminated, true, 'broken runtime must not be reused');
    await queuedCheck;
    assert.equal(latestPhase, 'error');
    first.reply({ status: { phase: 'ready', message: 'late status from failed worker' } });
    assert.equal(latestPhase, 'error', 'discarded worker cannot overwrite recovery state');
    const recoveredPreload = initSupertonic();
    assert.notEqual(recoveredPreload, initialPreload);
    assert.equal(workers.length, 2);
    const second = workers[1];
    assert.equal(second.requests[0].forceWasm, true);
    second.reply({ id: second.requests[0].id, preloaded: true });
    await recoveredPreload;
    const replay = supertonicSpeak('First reading chunk.');
    const audio = new Float32Array([0, 0.1, 0]);
    second.reply({ id: second.requests[1].id, samples: audio, sampleRate: 24000 });
    assert.deepEqual(await replay, { samples: audio, sampleRate: 24000 });
    // A recoverable download error also releases the worker, without relying on reload.
    const downloadFailure = supertonicSpeak('Another voice.');
    const downloadCheck = assert.rejects(downloadFailure, /download/);
    second.reply({ id: second.requests[2].id, error: 'Voice download interrupted' });
    await downloadCheck;
    assert.equal(second.terminated, true);
    const retry = supertonicSpeak('Another voice.');
    assert.equal(workers.length, 3);
    workers[2].reply({ id: workers[2].requests[0].id, samples: audio, sampleRate: 24000 });
    assert.equal((await retry).samples.length, 3);
  } finally {
    for (const instance of workers) {
      for (const request of instance.requests) instance.reply({ id: request.id, error: 'Test cleanup' });
    }
    unsubscribe();
    Object.assign(globalThis, { Worker: previousWorker });
  }
});
