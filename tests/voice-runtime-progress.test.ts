import test from 'node:test';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import configure from '../vite.config';

async function instrument(source: string) {
  source += '\nfunction unusedReadLandmark() { return {status: "download",\n    name: path_or_repo_id,\n    file: filename}; return {status: "done",\n    name: path_or_repo_id,\n    file: filename}; }';
  const config = configure({ command: 'build', mode: 'production' });
  const plugins = (config.worker?.plugins?.() ?? config.plugins ?? []) as any[];
  const plugin = plugins.find(value => value.name === 'natally-onnx-progress');
  if (!plugin) return source;
  const result = await plugin.transform(source, '/node_modules/@huggingface/transformers/dist/transformers.web.js');
  return result.code;
}

test('runtime reports actual pending session creation and graph execution, preserving native results', async () => {
  const events: any[] = [];
  let finishCreate!: (session: any) => void;
  let finishRun!: (result: any) => void;
  const nativeSession = { run: (..._inputs: any[]) => new Promise(resolve => { finishRun = resolve; }), inputNames: ['input_ids'], outputNames: ['audio'] };
  let now = 0;
  const context: any = {
    performance: { now: () => now }, Symbol,
    ONNX: { InferenceSession: { create: () => new Promise(resolve => { finishCreate = resolve; }) } },
  };
  context[Symbol.for('natally.onnx.progress')] = (event: any) => events.push(event);
  const source = 'var InferenceSession = ONNX.InferenceSession; globalThis.pending = InferenceSession.create(new Uint8Array(1), {externalData:[{path:"text_encoder.onnx_data"}], executionProviders:["wasm"]});';
  runInNewContext(await instrument(source), context);
  assert.equal(events[0]?.operation, 'session');
  assert.equal(events[0]?.state, 'start');
  assert.equal(events[0]?.file, 'text_encoder.onnx_data');
  assert.equal(events.length, 1, 'pending work must not be reported complete');
  now = 1200;
  finishCreate(nativeSession);
  const session = await context.pending;
  assert.equal(session, nativeSession);
  assert.equal(events[1].state, 'complete');
  assert.equal(events[1].durationMs, 1200);
  const pendingRun = session.run({ input_ids: [1] });
  assert.equal(events[2].operation, 'run');
  assert.equal(events[2].state, 'start');
  now = 1500;
  const audio = { audio: new Float32Array([0, 0.5, 0]) };
  finishRun(audio);
  assert.equal(await pendingRun, audio);
  assert.equal(events[3].state, 'complete');
  assert.equal(events[3].durationMs, 300);
});

test('runtime failure names the actual graph and preserves the original rejection', async () => {
  const events: any[] = [];
  const error = new Error('native session crashed');
  const context: any = { Symbol, performance: { now: () => 0 },
    ONNX: { InferenceSession: { create: async () => { throw error; } } } };
  context[Symbol.for('natally.onnx.progress')] = (event: any) => events.push(event);
  const source = 'var InferenceSession = ONNX.InferenceSession; globalThis.pending = InferenceSession.create(new Uint8Array(1), {externalData:[{path:"voice_decoder.onnx_data"}],executionProviders:["webgpu"]});';
  runInNewContext(await instrument(source), context);
  await assert.rejects(context.pending, value => value === error);
  assert.equal(events.at(-1)?.state, 'error');
  assert.equal(events.at(-1)?.file, 'voice_decoder.onnx_data');
  assert.equal(events.at(-1)?.error, 'native session crashed');
});
