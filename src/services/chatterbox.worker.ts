import * as ort from 'onnxruntime-web/webgpu';
import { AutoTokenizer, env } from '@huggingface/transformers';
import { CHATTERBOX_MODEL, CHATTERBOX_REVISION, CHATTERBOX_FILES } from './chatterboxModel';
import { planSpeechChunks } from './speechUnits';
import { chooseSpeechToken, assertFinishedGeneration, START_SPEECH_TOKEN, STOP_SPEECH_TOKEN, SILENCE_TOKEN } from './chatterboxGeneration';
import type { VoiceStatus, VoiceGraphProgress } from './chatterboxTts';
import type { VoiceMeasurement } from './voiceMeasurements';

type Role = 'embed_tokens' | 'speech_encoder' | 'language_model' | 'conditional_decoder';
type Sessions = Record<Role, ort.InferenceSession>;
type Request = { id: number; text?: string; preload?: boolean; voice?: string; speed?: number; forceWasm?: boolean };
const paths: Record<Role, keyof typeof CHATTERBOX_FILES> = {
  embed_tokens: 'onnx/embed_tokens_fp16.onnx', speech_encoder: 'onnx/speech_encoder_q4f16.onnx',
  language_model: 'onnx/language_model_q4f16.onnx', conditional_decoder: 'onnx/conditional_decoder_q4.onnx',
};
const cacheName = 'natally-chatterbox-' + CHATTERBOX_REVISION;
env.remotePathTemplate = '{model}/resolve/' + CHATTERBOX_REVISION + '/';
env.allowLocalModels = false;
env.useBrowserCache = true;
env.cacheKey = cacheName;
ort.env.wasm.numThreads = 1;
let backend = 'wasm';
let engine: Promise<{ sessions: Sessions; tokenizer: any }> | null = null;
let queue = Promise.resolve();
let current: VoiceStatus = { phase: 'idle', message: '' };
let request = { runId: '', started: 0, workload: 'preload' };
const graphs = new Map<string, VoiceGraphProgress>();
const files = new Map<string, { file: string; loadedBytes: number; totalBytes: number; source: 'cache' | 'network' | 'unknown' }>();
const references = new Map<string, Record<string, ort.Tensor>>();
const clips = new Map<string, Float32Array>();
let clipBytes = 0;
let runtimeFailure = false;

function measure(event: Omit<VoiceMeasurement, 'runId' | 'revision'>) {
  self.postMessage({ measurement: { ...event, runId: request.runId, revision: CHATTERBOX_REVISION,
    atMs: performance.now() - request.started, workload: request.workload } });
}
function status(phase: VoiceStatus['phase'], message: string, extra: Partial<VoiceStatus> = {}) {
  current = { ...current, phase, message, ...extra };
  self.postMessage({ status: current });
}
async function observe<T>(role: Role, operation: 'session' | 'run', action: () => Promise<T>): Promise<T> {
  const file = paths[role]; const key = operation + file;
  const started = performance.now();
  const previous = graphs.get(key);
  const graph: VoiceGraphProgress = { file, backend, operation, state: 'start', completed: previous?.completed || 0,
    startedAt: Date.now(), ...(operation === 'session' ? { expected: 1 } : {}) };
  graphs.set(key, graph);
  measure({ file, backend, operation, state: 'start' });
  status(operation === 'session' ? 'preparing' : 'synthesizing', `${operation === 'session' ? 'Initializing' : 'Executing'} ${file}`, { file, graphs: [...graphs.values()] });
  try {
    const value = await action();
    graph.state = 'complete'; graph.completed++; graph.durationMs = performance.now() - started;
    measure({ file, backend, operation, state: 'complete', durationMs: graph.durationMs });
    status(current.phase, `${file} · operation completed`, { graphs: [...graphs.values()], confirmedAt: Date.now() });
    return value;
  } catch (error) {
    runtimeFailure = true;
    graph.state = 'error'; graph.durationMs = performance.now() - started;
    measure({ file, backend, operation, state: 'error', durationMs: graph.durationMs });
    status('error', `${file} failed`, { graphs: [...graphs.values()] });
    throw error;
  }
}
async function loadBytes(file: keyof typeof CHATTERBOX_FILES): Promise<Uint8Array> {
  const expected = CHATTERBOX_FILES[file];
  const url = `https://huggingface.co/${CHATTERBOX_MODEL}/resolve/${CHATTERBOX_REVISION}/${file}`;
  const cache = typeof caches === 'undefined' ? null : await caches.open(cacheName).catch(() => null);
  const cached = await cache?.match(url);
  const response = cached || await fetch(url);
  if (!response?.ok || !response.body) throw new Error(`${file}: model download failed (${response?.status}).`);
  const source = cached ? 'cache' : 'network';
  const entry = { file, loadedBytes: 0, totalBytes: expected.bytes, source } as const;
  files.set(file, entry);
  const started = performance.now(); measure({ operation: 'file', state: 'start', file, backend, source });
  const reader = response.body.getReader(); const bytes = new Uint8Array(expected.bytes);
  let loaded = 0; let last = 0;
  const progress = () => {
    files.set(file, { ...entry, loadedBytes: loaded });
    status('loading', `Reading ${file} · ${source}`, { file, files: [...files.values()],
      loadedBytes: [...files.values()].reduce((sum, item) => sum + item.loadedBytes, 0),
      totalBytes: Object.values(CHATTERBOX_FILES).reduce((sum, item) => sum + item.bytes, 0), confirmedAt: Date.now() });
  };
  progress();
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    if (loaded + value.length > bytes.length) { await reader.cancel(); throw new Error(`${file}: wrong model file length.`); }
    bytes.set(value, loaded); loaded += value.length;
    if (performance.now() - last > 120) { progress(); last = performance.now(); }
  }
  if (loaded !== expected.bytes) throw new Error(`${file}: incomplete model file.`);
  const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), value => value.toString(16).padStart(2, '0')).join('');
  if (digest !== expected.sha256) { await cache?.delete(url); throw new Error(`${file}: model checksum mismatch.`); }
  if (!cached) await cache?.put(url, new Response(bytes)).catch(() => {});
  progress(); measure({ operation: 'file', state: 'complete', file, backend, source, bytes: loaded, durationMs: performance.now() - started });
  return bytes;
}
async function loadEngine(forceWasm = false) {
  if (!engine) engine = (async () => {
    const started = performance.now(); measure({ operation: 'load', state: 'start', backend });
    const adapter = forceWasm ? null : await (navigator as any).gpu?.requestAdapter().catch(() => null);
    backend = adapter?.features.has('shader-f16') ? 'webgpu' : 'wasm';
    const sessions = {} as Sessions;
    try {
      for (const role of Object.keys(paths) as Role[]) {
        const file = paths[role];
        const dataFile = (file + '_data') as keyof typeof CHATTERBOX_FILES;
        const model = await loadBytes(file); const data = await loadBytes(dataFile);
        sessions[role] = await observe(role, 'session', () => ort.InferenceSession.create(model, {
          executionProviders: [backend], externalData: [{ path: file.split('/').at(-1)! + '_data', data }],
        }));
      }
      for (const file of Object.keys(CHATTERBOX_FILES).filter(file => !file.startsWith('onnx/')) as (keyof typeof CHATTERBOX_FILES)[]) await loadBytes(file);
      const tokenizer = await AutoTokenizer.from_pretrained(CHATTERBOX_MODEL, { revision: CHATTERBOX_REVISION });
      measure({ operation: 'load', state: 'complete', backend, durationMs: performance.now() - started });
      return { sessions, tokenizer };
    } catch (error) {
      await Promise.allSettled(Object.values(sessions).map(session => session.release()));
      measure({ operation: 'load', state: 'error', backend, durationMs: performance.now() - started });
      throw error;
    }
  })().catch(error => { engine = null; throw error; });
  return engine;
}
const int64 = (values: readonly number[], dims: number[]) => new ort.Tensor('int64', BigInt64Array.from(values, BigInt), dims);
function dispose(values: Record<string, ort.Tensor>) { for (const tensor of Object.values(values)) tensor.dispose(); }
async function run(sessions: Sessions, role: Role, inputs: Record<string, ort.Tensor>) {
  return observe(role, 'run', () => sessions[role].run(inputs)) as Promise<Record<string, ort.Tensor>>;
}
async function reference(sessions: Sessions, voice: string) {
  if (!references.has(voice)) {
    const response = await fetch(`${import.meta.env.BASE_URL}voices/chatterbox/${voice}.wav`);
    if (!response.ok) throw new Error('The Natally reference voice is unavailable.');
    const wav = new DataView(await response.arrayBuffer());
    if (wav.getUint32(24, true) !== 24000 || wav.getUint16(22, true) !== 1 || wav.getUint16(34, true) !== 16) throw new Error('Invalid Natally reference voice.');
    const count = Math.min((wav.byteLength - 44) / 2, 240000);
    const audio = Float32Array.from({ length: count }, (_, index) => wav.getInt16(44 + index * 2, true) / 32768);
    const tensor = new ort.Tensor('float32', audio, [1, count]);
    try { references.set(voice, await run(sessions, 'speech_encoder', { audio_values: tensor })); }
    finally { tensor.dispose(); }
  }
  return references.get(voice)!;
}
async function generate(sessions: Sessions, tokenizer: any, text: string, voice: string): Promise<Float32Array> {
  const conditioning = Object.values(await reference(sessions, voice));
  const [audioFeatures, audioTokens, speakerEmbeddings, speakerFeatures] = conditioning;
  const tokens = tokenizer(text, { truncation: false, padding: false }).input_ids;
  let input = new ort.Tensor('int64', BigInt64Array.from(tokens.data), [...tokens.dims]);
  let cache: Record<string, ort.Tensor> = {};
  for (const meta of sessions.language_model.inputMetadata) {
    if (!meta.name.startsWith('past_key_values.')) continue;
    if (!meta.isTensor || meta.type !== 'float16') throw new Error('Unexpected Nano KV-cache profile.');
    cache[meta.name] = new ort.Tensor('float16', new Uint16Array(0), [1, 12, 0, 64]);
  }
  if (Object.keys(cache).length !== 24) throw new Error('Unexpected Nano KV-cache input count.');
  let sequenceLength = 0; let first = true; let reachedEos = false;
  const generated: number[] = [START_SPEECH_TOKEN];
  try {
    for (let step = 0; step < 4096; step++) {
      const embedded = await run(sessions, 'embed_tokens', { input_ids: input }); input.dispose();
      let embeds = Object.values(embedded)[0];
      if (first) {
        if (embeds.type !== audioFeatures.type) throw new Error('Nano conditioning and embedding types differ.');
        const data = new Float32Array(audioFeatures.size + embeds.size);
        data.set(audioFeatures.data as Float32Array); data.set(embeds.data as Float32Array, audioFeatures.size);
        const length = audioFeatures.dims[1] + embeds.dims[1]; embeds.dispose();
        embeds = new ort.Tensor('float32', data, [1, length, 768]); sequenceLength = length;
      } else sequenceLength++;
      if (sequenceLength >= 8196) { embeds.dispose(); break; }
      const mask = int64(Array(sequenceLength).fill(1), [1, sequenceLength]);
      const positions = int64(first ? Array.from({ length: sequenceLength }, (_, i) => i) : [sequenceLength - 1], [1, first ? sequenceLength : 1]);
      let output: Record<string, ort.Tensor>;
      try { output = await run(sessions, 'language_model', { inputs_embeds: embeds, attention_mask: mask, position_ids: positions, ...cache }); }
      finally { embeds.dispose(); mask.dispose(); positions.dispose(); }
      const values = Object.values(output); const logits = values[0];
      const raw = await logits.getData();
      const float = logits.type === 'float16' ? Float32Array.from(raw as Uint16Array, halfToFloat) : Float32Array.from(raw as Float32Array);
      const token = chooseSpeechToken(float.slice(-6563), generated);
      logits.dispose(); dispose(cache); cache = {};
      Object.keys(output).slice(1).forEach((name, i) => { cache[sessions.language_model.inputNames.filter(name => name.startsWith('past_key_values.'))[i]] = output[name]; });
      if (token === STOP_SPEECH_TOKEN) { reachedEos = true; break; }
      generated.push(token); input = int64([token], [1, 1]); first = false;
    }
    const speech = generated.slice(1); assertFinishedGeneration(speech, reachedEos);
    const all = [...Array.from(audioTokens.data as BigInt64Array, Number), ...speech, SILENCE_TOKEN, SILENCE_TOKEN, SILENCE_TOKEN];
    const speechTokens = int64(all, [1, all.length]);
    try {
      const decoded = await run(sessions, 'conditional_decoder', { speech_tokens: speechTokens, speaker_embeddings: speakerEmbeddings, speaker_features: speakerFeatures });
      try {
        const waveform = Object.values(decoded)[0];
        const data = await waveform.getData();
        const samples = waveform.type === 'float16' ? Float32Array.from(data as Uint16Array, halfToFloat) : new Float32Array(data as Float32Array);
        if (!samples.length || !samples.every(Number.isFinite)) throw new Error('The local voice returned invalid audio.');
        return samples;
      } finally { dispose(decoded); }
    } finally { speechTokens.dispose(); }
  } finally { input.dispose(); dispose(cache); }
}
function halfToFloat(bits: number) {
  const sign = bits & 0x8000 ? -1 : 1; const exponent = bits >> 10 & 31; const mantissa = bits & 1023;
  return sign * (exponent === 0 ? mantissa * 2 ** -24 : exponent === 31 ? mantissa ? NaN : Infinity : (1 + mantissa / 1024) * 2 ** (exponent - 15));
}
async function synthesize(data: Request) {
  runtimeFailure = false;
  let inputRejected = false;
  request = { runId: Date.now().toString(36) + '-' + data.id, started: performance.now(), workload: data.preload ? 'preload' : data.text!.length <= 100 ? '1-100' : data.text!.length <= 300 ? '101-300' : '301-1000' };
  graphs.clear();
  current = { phase: 'preparing', message: 'Starting Chatterbox Nano', startedAt: Date.now(), confirmedAt: Date.now() };
  measure({ operation: 'request', state: 'start', backend });
  const heartbeat = setInterval(() => self.postMessage({ heartbeat: Date.now() }), 1000);
  try {
    const { sessions, tokenizer } = await loadEngine(data.forceWasm);
    if (data.preload) { status('ready', 'Chatterbox Nano ready · ' + backend); self.postMessage({ id: data.id, preloaded: true }); return; }
    const voice = ['F1', 'F2', 'F3', 'F4', 'F5', 'M1', 'M2'].includes(data.voice || '') ? data.voice! : 'F4';
    const key = JSON.stringify([voice, data.text]);
    const started = performance.now(); const clipReuse = clips.has(key);
    let samples = clips.get(key);
    if (!samples) {
      let chunks: string[];
      try { chunks = planSpeechChunks(data.text!, text => Number(tokenizer(text, { truncation: false, padding: false }).input_ids.dims.at(-1)), 768); }
      catch (error) { inputRejected = true; throw error; }
      const parts: Float32Array[] = [];
      for (const chunk of chunks) parts.push(await generate(sessions, tokenizer, chunk, voice));
      samples = new Float32Array(parts.reduce((sum, part) => sum + part.length, 0));
      let offset = 0; for (const part of parts) { samples.set(part, offset); offset += part.length; }
      while (clipBytes + samples.byteLength > 16000000 && clips.size) { const oldest = clips.keys().next().value!; clipBytes -= clips.get(oldest)!.byteLength; clips.delete(oldest); }
      if (samples.byteLength <= 16000000) { clips.set(key, samples); clipBytes += samples.byteLength; }
    }
    const copy = samples.slice();
    const speed = Number.isFinite(data.speed) ? Math.max(0.8, Math.min(1.4, data.speed!)) : 1;
    status('ready', 'Chatterbox Nano ready · ' + backend);
    measure({ operation: 'request', state: 'complete', backend, durationMs: performance.now() - request.started, clipReuse });
    self.postMessage({ id: data.id, samples: copy, sampleRate: 24000 * speed, generationMs: performance.now() - started, backend, clipReuse }, { transfer: [copy.buffer] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Chatterbox Nano failed.';
    status('error', message);
    measure({ operation: 'request', state: 'error', backend, durationMs: performance.now() - request.started });
    self.postMessage({ id: data.id, error: message, runtimeFailed: runtimeFailure, inputRejected, backend });
  } finally { clearInterval(heartbeat); }
}
self.onmessage = ({ data }) => { queue = queue.then(() => synthesize(data)); };
