import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { splitSpeechText, initSupertonic } from '../src/services/supertonicTts';
import { SupertonicDownloadProgress, SUPERTONIC_MODEL_FILES } from '../src/services/supertonicDownload';
import { DEFAULT_VOICE_SETTINGS, getVoicePreset, loadVoiceSettings, saveVoiceSettings, speakNatallyText, stopSpeaking, getSpeechPolicy, isSpeechBusy } from '../src/services/voiceService';

test('speech chunking preserves the full reading and bounds every chunk', () => {
  const text = ('A complete sentence with stars and planets. Another thought follows! ').repeat(100).trim();
  const chunks = splitSpeechText(text);
  assert.equal(chunks.join(' '), text);
  assert.ok(chunks.every(chunk => chunk.length <= 300));
  assert.equal(splitSpeechText('a'.repeat(901)).join(''), 'a'.repeat(901));
  assert.deepEqual(splitSpeechText('   '), []);
  assert.throws(() => splitSpeechText('hello', 0));
  const longSentence = ('One longer thought with meaningful detail ').repeat(15).trim() + '.';
  assert.equal(splitSpeechText(longSentence, 300).join(' '), longSentence);
  assert.ok(splitSpeechText(longSentence, 300).every(chunk => chunk.length <= 300));
  const oversized = splitSpeechText('a'.repeat(2101), 450);
  assert.ok(oversized.every(chunk => chunk.length <= 450));
  assert.equal(oversized.join(''), 'a'.repeat(2101));
});

test('old saved Gemini and persona names migrate to the actual local engine', () => {
  Object.assign(globalThis, { localStorage: { getItem: () => JSON.stringify({ ttsModel: 'gemini-3.8-flash-tts', aiVoiceName: 'The Cheeky Sidekick 2', rate: 1.1 }) } });
  const settings = loadVoiceSettings();
  assert.equal(settings.ttsModel, 'supertonic-onnx');
  assert.equal(settings.aiVoiceName, 'F4');
  assert.equal(settings.pitch, 1.15);
  assert.equal(settings.rate, 0.9);
});

test('Kawaii preset reads validated environment configuration', () => {
  assert.deepEqual(getVoicePreset({}), { aiVoiceName: 'F4', pitch: 1.15, rate: 0.9 });
  assert.deepEqual(getVoicePreset({ VITE_NATALLY_VOICE: 'F5', VITE_NATALLY_VOICE_PITCH: '1.2', VITE_NATALLY_VOICE_RATE: '0.9' }),
    { aiVoiceName: 'F5', pitch: 1.2, rate: 0.9 });
  assert.deepEqual(getVoicePreset({ VITE_NATALLY_VOICE: 'invalid', VITE_NATALLY_VOICE_PITCH: 'Infinity', VITE_NATALLY_VOICE_RATE: '0' }),
    { aiVoiceName: 'F4', pitch: 1.15, rate: 0.9 });
});

test('preset migration preserves unrelated settings and versioned custom choices', () => {
  let stored = JSON.stringify({ aiVoiceName: 'F1', pitch: 1, rate: 1.05, readingAloud: false, spriteMode: 'docked', customAvatarUrl: 'saved-avatar' });
  Object.assign(globalThis, { localStorage: { getItem: () => stored, setItem: (_key: string, value: string) => { stored = value; } } });
  const migrated = loadVoiceSettings();
  assert.equal(migrated.aiVoiceName, 'F4');
  assert.equal(migrated.readingAloud, false);
  assert.equal(migrated.spriteMode, 'docked');
  assert.equal(migrated.customAvatarUrl, 'saved-avatar');
  saveVoiceSettings({ ...migrated, aiVoiceName: 'F3', pitch: 1.1, rate: 1.2 });
  assert.equal(loadVoiceSettings().aiVoiceName, 'F3');
  assert.equal(loadVoiceSettings().pitch, 1.1);
  assert.equal(loadVoiceSettings().rate, 1.2);
  saveVoiceSettings({ ...migrated, pitch: NaN, rate: 100, aiVoiceName: 'invalid' });
  assert.equal(loadVoiceSettings().pitch, 1.15);
  assert.equal(loadVoiceSettings().rate, 0.9);
  assert.equal(loadVoiceSettings().aiVoiceName, 'F4');
  stored = stored.replace(/"voicePresetVersion":"[^"]+"/, '"voicePresetVersion":"previous-config"');
  assert.equal(loadVoiceSettings().aiVoiceName, 'F4');
});

test('stop during synthesis prevents late playback and ends callbacks once', async () => {
  let worker: any;
  let played = 0;
  let ended = 0;
  let request: any;
  let playbackPitch = 0;
  let holdPlayback = false;
  let resumeGate: Promise<void> | null = null;
  const playingSources: any[] = [];
  class TestWorker {
    onmessage: any;
    constructor() { worker = this; }
    postMessage(data: any) { request = data; }
    terminate() {}
  }
  class TestContext {
    state = 'running';
    resume() { return resumeGate ?? Promise.resolve(); }
    createBuffer(_channels: number, length: number) { played++; return { duration: 0.01, getChannelData: () => new Float32Array(length) }; }
    createGain() { return { gain: { value: 1 }, connect() {}, disconnect() {} }; }
    createBiquadFilter() { return { type: '', frequency: { value: 0 }, gain: { value: 0 }, connect() {}, disconnect() {} }; }
    createBufferSource() {
      return {
        playbackRate: { value: 1 }, onended: null as any, connect() {}, disconnect() {}, stop() {},
        start() { playbackPitch = this.playbackRate.value; if (holdPlayback) playingSources.push(this); else setImmediate(() => this.onended?.()); },
      };
    }
  }
  Object.assign(globalThis, { Worker: TestWorker, window: { AudioContext: TestContext } });
  const result = speakNatallyText('Hello from Natally.', DEFAULT_VOICE_SETTINGS, undefined, () => ended++);
  await new Promise(resolve => setImmediate(resolve));
  assert.ok(request);
  assert.equal(isSpeechBusy(), true);
  assert.equal(request.voice, 'F4');
  assert.equal(request.speed, 0.9);
  stopSpeaking();
  worker.onmessage({ data: { id: request.id, samples: new Float32Array(441), sampleRate: 44100 } });
  assert.equal(await result, false);
  assert.equal(played, 0);
  assert.equal(ended, 1);
  assert.equal(isSpeechBusy(), false);
  let started = 0;
  const successful = speakNatallyText('This is a fresh utterance.', DEFAULT_VOICE_SETTINGS, () => started++, () => ended++);
  await new Promise(resolve => setImmediate(resolve));
  worker.onmessage({ data: { id: request.id, samples: new Float32Array(441), sampleRate: 44100 } });
  assert.equal(await successful, true);
  assert.equal(played, 1);
  assert.equal(playbackPitch, 1.15);
  assert.equal(started, 1);
  assert.equal(ended, 2);
  holdPlayback = true;
  const firstChunk = 'A short complete sentence.';
  const secondChunk = 'The next sentence keeps every single word and waits until the preceding audio has finished playing.';
  const thirdChunk = 'Finally we reach the last sentence, keeping the whole reading intact, without losing its tail.';
  const pipelined = speakNatallyText([firstChunk, secondChunk, thirdChunk].join(' '), { ...DEFAULT_VOICE_SETTINGS, resourceMode: 'gentle' });
  await new Promise(resolve => setImmediate(resolve));
  const firstRequest = request;
  worker.onmessage({ data: { id: request.id, samples: new Float32Array(441), sampleRate: 44100 } });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(playingSources.length, 1);
  assert.equal(request, firstRequest, 'gentle mode performs no inference during playback');
  playingSources[0].onended();
  await new Promise(resolve => setImmediate(resolve));
  assert.notEqual(request, firstRequest);
  assert.equal(request.text, thirdChunk);
  worker.onmessage({ data: { id: request.id, samples: new Float32Array(441), sampleRate: 44100 } });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(playingSources.length, 2);
  playingSources[1].onended();
  assert.equal(await pipelined, true);
  assert.equal(played, 3);
  const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { hardwareConcurrency: 16, deviceMemory: 8 } });
  const sentences = ['Alpha', 'Bravo', 'Charlie'].map(word => (word + ' ').repeat(21).trim() + '.');
  const adaptive = speakNatallyText(sentences.join(' '), DEFAULT_VOICE_SETTINGS);
  await new Promise(resolve => setImmediate(resolve));
  worker.onmessage({ data: { id: request.id, samples: new Float32Array(44100), sampleRate: 44100, generationMs: 20, clipReuse: false } });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(request.text, sentences[1], 'measured fast generation enables one-ahead preparation');
  const secondRequest = request;
  worker.onmessage({ data: { id: request.id, samples: new Float32Array(44100), sampleRate: 44100, generationMs: 2000, clipReuse: false } });
  playingSources[2].onended();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(request, secondRequest, 'slowdown disables overlap before another chunk is generated');
  playingSources[3].onended();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(request.text, sentences[2]);
  worker.onmessage({ data: { id: request.id, samples: new Float32Array(44100), sampleRate: 44100, generationMs: 1000, clipReuse: false } });
  await new Promise(resolve => setImmediate(resolve));
  playingSources[4].onended();
  assert.equal(await adaptive, true);
  const replay = speakNatallyText(sentences.join(' '), DEFAULT_VOICE_SETTINGS);
  await new Promise(resolve => setImmediate(resolve));
  const cachedRequest = request;
  worker.onmessage({ data: { id: request.id, samples: new Float32Array(44100), sampleRate: 44100, generationMs: 1, clipReuse: true } });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(request, cachedRequest, 'cache replay must not calibrate CPU speed');
  stopSpeaking();
  assert.equal(await replay, false);
  assert.equal(request, cachedRequest, 'stopping playback does not start the next chunk');
  let releaseResume!: () => void;
  resumeGate = new Promise(resolve => { releaseResume = resolve; });
  const interruptedResume = speakNatallyText('Do not generate after stop.', DEFAULT_VOICE_SETTINGS);
  stopSpeaking();
  releaseResume();
  assert.equal(await interruptedResume, false);
  assert.equal(request, cachedRequest, 'cancellation while resuming cannot enqueue synthesis');
  resumeGate = null;
  if (originalNavigator) Object.defineProperty(globalThis, 'navigator', originalNavigator);
  else Reflect.deleteProperty(globalThis, 'navigator');
  const firstPreload = initSupertonic();
  assert.equal(initSupertonic(), firstPreload);
  worker.onmessage({ data: { id: request.id, error: 'Download interrupted' } });
  await assert.rejects(firstPreload, /interrupted/);
  const retryPreload = initSupertonic();
  assert.notEqual(retryPreload, firstPreload);
  assert.equal(request.preload, true);
  worker.onmessage({ data: { id: request.id, preloaded: true } });
  await retryPreload;
  assert.equal(played, 7);
});

test('byte progress uses the whole pinned model, not per-file percentages', () => {
  const progress = new SupertonicDownloadProgress();
  const halfFile = Math.floor(SUPERTONIC_MODEL_FILES['onnx/text_encoder.onnx_data'] / 2);
  const partial = progress.update({ file: 'onnx/text_encoder.onnx_data', loaded: halfFile, status: 'progress' });
  assert.equal(partial.loadedBytes, halfFile);
  assert.ok(partial.loadedBytes / partial.totalBytes < 0.1);
  assert.deepEqual(progress.update({ file: 'onnx/text_encoder.onnx_data', loaded: halfFile }), partial);
  assert.deepEqual(progress.update({ file: 'onnx/text_encoder.onnx_data', loaded: 1 }), partial);
  assert.deepEqual(progress.update({ file: 'unrelated-file', loaded: 1000000000 }), partial);
  progress.update({ file: 'onnx/text_encoder.onnx_data', status: 'done' });
  assert.equal(progress.update({}).loadedBytes, halfFile, 'a stream ending cannot manufacture missing bytes');
  for (const [file, loaded] of Object.entries(SUPERTONIC_MODEL_FILES)) progress.update({ file, status: 'done', loaded });
  const complete = progress.update({});
  assert.equal(complete.loadedBytes, complete.totalBytes);
  const reread = 'onnx/text_encoder.onnx_data';
  progress.update({ file: reread, status: 'download' });
  progress.update({ file: reread, status: 'progress', loaded: 10 });
  progress.update({ file: reread, status: 'done' });
  assert.equal(progress.lastReadBytes(reread), 10, 'per-attempt measurements cannot reuse an earlier successful byte count');
});

test('active voice path contains no hosted or system speech fallback', () => {
  const source = readFileSync(new URL('../src/services/voiceService.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /generativelanguage|\/api\/tts|speechSynthesis|VITE_GEMINI_API_KEY/);
  assert.match(source, /supertonicSpeak\(chunk/);
});


test('resource policy requires both measured headroom and device capacity', () => {
  const capable = { hardwareConcurrency: 16, deviceMemory: 8 };
  assert.deepEqual(getSpeechPolicy('auto', capable), { chunkChars: 240, prefetch: false });
  assert.deepEqual(getSpeechPolicy('auto', capable, 0.2), { chunkChars: 240, prefetch: true });
  assert.deepEqual(getSpeechPolicy('auto', capable, 0.8), { chunkChars: 180, prefetch: false });
  assert.deepEqual(getSpeechPolicy('gentle', capable, 0.1), { chunkChars: 180, prefetch: false });
  for (const hints of [{}, { hardwareConcurrency: 8, deviceMemory: 4 }, { hardwareConcurrency: 2, deviceMemory: 8 }]) {
    assert.deepEqual(getSpeechPolicy('auto', hints, 0.1), { chunkChars: 180, prefetch: false });
  }
  assert.equal(getSpeechPolicy('auto', capable, NaN).prefetch, false);
});

test('hard chunks conserve punctuation, long clauses, Unicode and every final word', () => {
  const text = 'Mercury, Venus and Mars; ' + 'a long clause with ordinary words '.repeat(40) + 'and the final word.';
  for (const limit of [100, 180, 240]) {
    const chunks = splitSpeechText(text, limit);
    assert.equal(chunks.join(' '), text);
    assert.ok(chunks.every(chunk => chunk.length <= limit));
  }
  const unicodeWord = 'a' + '🌟'.repeat(200);
  const chunks = splitSpeechText(unicodeWord, 100);
  assert.equal(chunks.join(''), unicodeWord);
  assert.ok(chunks.every(chunk => chunk.length <= 100 && !/[\uD800-\uDBFF]$/.test(chunk)));
});

test('resource and tone settings survive saved preference migration and validate corrupt data', () => {
  let stored = JSON.stringify({ resourceMode: 'gentle', tone: 'warm' });
  Object.assign(globalThis, { localStorage: { getItem: () => stored, setItem: (_key: string, value: string) => { stored = value; } } });
  assert.equal(loadVoiceSettings().resourceMode, 'gentle');
  assert.equal(loadVoiceSettings().tone, 'warm');
  stored = JSON.stringify({ resourceMode: 'unbounded', tone: 'invalid' });
  assert.equal(loadVoiceSettings().resourceMode, 'auto');
  assert.equal(loadVoiceSettings().tone, 'soft');
});
