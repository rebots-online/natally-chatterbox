import { supertonicSpeak, splitSpeechText, reportVoiceStatus } from './supertonicTts';

export const NATALLY_VOICE_SAMPLE = "Okay, tiny cosmic plot twist. Your psychic is still figuring things out too. Let's take it one thing at a time. Honestly, the planets can wait. Let’s make this make sense.";

export interface VoiceSettings {
  resourceMode: 'auto' | 'gentle';
  tone: 'natural' | 'soft' | 'warm';
  readingAloud: boolean; // Default true (reading aloud by default)
  language: string; // 'ro-MD' | 'mo-MD' | 'ro-RO' | 'ru' | 'uk' | 'en-US'
  accentMode: 'moldavian' | 'slavic' | 'standard';
  rate: number; // 0.8 - 1.4
  pitch: number; // 0.8 - 1.4
  ttsModel: 'supertonic-onnx';
  aiVoiceName: string; // 'The Cheeky Sidekick 2'
  kawaiiMode: 'cheeky_sidekick' | 'kawaii_chibi' | 'moldavian_confidante' | 'celestial_oracle' | 'natural_companion';
  kawaiiIntensity: number; // 0 - 100
  spriteMode: 'wander' | 'follow' | 'docked';
  customAvatarUrl?: string | null;
}

const STORAGE_KEY = 'astrosphere_natally_voice_config_v3';
const SUPPORTED_VOICES = ['F1', 'F2', 'F3', 'F4', 'F5', 'M1', 'M2'];

export function getVoicePreset(env: Record<string, string | undefined>) {
  const pitch = Number(env.VITE_NATALLY_VOICE_PITCH);
  const rate = Number(env.VITE_NATALLY_VOICE_RATE);
  return {
    aiVoiceName: SUPPORTED_VOICES.includes(env.VITE_NATALLY_VOICE ?? '') ? env.VITE_NATALLY_VOICE! : 'F4',
    pitch: Number.isFinite(pitch) && pitch >= 0.8 && pitch <= 1.4 ? pitch : 1.15,
    rate: Number.isFinite(rate) && rate >= 0.8 && rate <= 1.4 ? rate : 0.9,
  };
}

const voicePreset = getVoicePreset(import.meta.env ?? {});
const voicePresetVersion = `${voicePreset.aiVoiceName}:${voicePreset.pitch}:${voicePreset.rate}`;
const configuredChunkSize = Number(import.meta.env?.VITE_NATALLY_SPEECH_CHUNK_CHARS);
const speechChunkSize = Number.isInteger(configuredChunkSize) && configuredChunkSize >= 100 && configuredChunkSize <= 800 ? configuredChunkSize : 240;

// Capability hints are only conservative starting bounds, never CPU benchmarks.
export function getSpeechPolicy(
  mode: VoiceSettings['resourceMode'],
  capabilities: { hardwareConcurrency?: number; deviceMemory?: number },
  realTimeFactor?: number,
): { chunkChars: number; prefetch: boolean } {
  const limited = mode === 'gentle' || !Number.isFinite(capabilities.deviceMemory) ||
    capabilities.deviceMemory! <= 4 || !Number.isFinite(capabilities.hardwareConcurrency) || capabilities.hardwareConcurrency! <= 4;
  const slow = Number.isFinite(realTimeFactor) && realTimeFactor! >= 0.7;
  return {
    chunkChars: Math.min(speechChunkSize, limited || slow ? 180 : 240),
    prefetch: mode !== 'gentle' && capabilities.hardwareConcurrency! >= 8 && capabilities.deviceMemory! >= 8 &&
      Number.isFinite(realTimeFactor) && realTimeFactor! < 0.35,
  };
}

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  resourceMode: 'auto',
  tone: 'soft',
  readingAloud: true, // Enabled by default
  language: 'en-US',
  accentMode: 'standard',
  ...voicePreset,
  ttsModel: 'supertonic-onnx',
  kawaiiMode: 'kawaii_chibi',
  kawaiiIntensity: 85,
  spriteMode: 'wander',
  customAvatarUrl: null,
};

export function loadVoiceSettings(): VoiceSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { ...DEFAULT_VOICE_SETTINGS };
      const currentPreset = parsed.voicePresetVersion === voicePresetVersion;
      return {
        ...DEFAULT_VOICE_SETTINGS, ...parsed,
        resourceMode: parsed.resourceMode === 'gentle' ? 'gentle' : 'auto',
        tone: ['natural', 'soft', 'warm'].includes(parsed.tone) ? parsed.tone : DEFAULT_VOICE_SETTINGS.tone,
        ttsModel: 'supertonic-onnx', language: 'en-US', accentMode: 'standard',
        aiVoiceName: currentPreset && SUPPORTED_VOICES.includes(parsed.aiVoiceName) ? parsed.aiVoiceName : voicePreset.aiVoiceName,
        pitch: currentPreset && Number.isFinite(parsed.pitch) && parsed.pitch >= 0.8 && parsed.pitch <= 1.4 ? parsed.pitch : voicePreset.pitch,
        rate: currentPreset && Number.isFinite(parsed.rate) && parsed.rate >= 0.8 && parsed.rate <= 1.4 ? parsed.rate : voicePreset.rate,
        kawaiiMode: currentPreset ? parsed.kawaiiMode ?? DEFAULT_VOICE_SETTINGS.kawaiiMode : DEFAULT_VOICE_SETTINGS.kawaiiMode,
      };
    }
  } catch (e) {
    console.warn('Could not load voice settings from localStorage:', e);
  }
  return { ...DEFAULT_VOICE_SETTINGS };
}

export function saveVoiceSettings(settings: VoiceSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...settings, voicePresetVersion }));
  } catch (e) {
    console.warn('Could not save voice settings to localStorage:', e);
  }
}

// Clean text for speech synthesis so raw markdown symbols and provenance aren't read out literally
export function prepareSpeechText(rawText: string): string {
  return prepareSpeechWithOffsets(rawText).text;
}

export function prepareSpeechWithOffsets(rawText: string): { text: string; sourceOffsets: number[] } {
  const end = rawText.indexOf('---ASTROLOGICAL PROVENANCE---');
  let characters = rawText.slice(0, end < 0 ? rawText.length : end).split('').map((char, index) => ({ char, index }));
  characters = characters.filter(({ char }) => !/[*#_~`>☉☽♂☿♀♃♄♅♆♇⚷☊♈♉♊♋♌♍♎♏♐♑♒♓]/.test(char));
  const intermediate = characters.map(({ char }) => char).join('');
  const excluded = new Set<number>();
  for (const match of intermediate.matchAll(/\[([^\]]+)\]\([^)]+\)/g)) {
    excluded.add(match.index!);
    for (let index = match.index! + 1 + match[1].length; index < match.index! + match[0].length; index++) excluded.add(index);
  }
  characters = characters.filter((_, index) => !excluded.has(index));
  const compact: typeof characters = [];
  for (const item of characters) {
    if (/\s/.test(item.char)) {
      if (compact.length && compact[compact.length - 1].char !== ' ') compact.push({ char: ' ', index: item.index });
    } else compact.push(item);
  }
  if (compact[compact.length - 1]?.char === ' ') compact.pop();
  return { text: compact.map(item => item.char).join(''), sourceOffsets: compact.map(item => item.index) };
}

let sharedAudioContext: AudioContext | null = null;
let currentBufferSource: AudioBufferSourceNode | null = null;
let generation = 0;
let finishPlayback: (() => void) | null = null;
let finishUtterance: (() => void) | null = null;
export function isSpeechBusy(): boolean { return finishUtterance !== null; }

export function getSharedAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!sharedAudioContext && AudioContextClass) sharedAudioContext = new AudioContextClass({ latencyHint: 'playback' });
    return sharedAudioContext;
  } catch { return null; }
}
export function unlockAudio(): void {
  const context = getSharedAudioContext();
  if (context?.state === 'suspended') context.resume().catch(() => {});
}
if (typeof window !== 'undefined') {
  for (const event of ['pointerdown', 'keydown', 'touchstart']) {
    window.addEventListener(event, unlockAudio, { capture: true, passive: true });
  }
}
export function stopSpeaking(): void {
  generation++;
  if (currentBufferSource) {
    try { currentBufferSource.stop(); currentBufferSource.disconnect(); } catch {}
    currentBufferSource = null;
  }
  finishPlayback?.();
  finishPlayback = null;
  finishUtterance?.();
  finishUtterance = null;
}
export async function speakNatallyText(
  text: string,
  settings: VoiceSettings,
  onStart?: () => void,
  onEnd?: () => void,
  onWordBoundary?: (charIndex: number, charLength?: number) => void
): Promise<boolean> {
  stopSpeaking();
  if (!settings.readingAloud) { onEnd?.(); return false; }
  const prepared = prepareSpeechWithOffsets(text);
  const clean = prepared.text;
  if (!clean) { onEnd?.(); return false; }
  const requestGeneration = generation;
  let ended = false;
  const end = () => {
    if (ended) return;
    ended = true;
    if (finishUtterance === end) finishUtterance = null;
    onEnd?.();
  };
  finishUtterance = end;
  try {
    const context = getSharedAudioContext();
    if (!context) throw new Error('Web Audio is unavailable in this browser.');
    await context.resume();
    if (context.state !== 'running') throw new Error('Tap voice preview to enable audio playback.');
    if (requestGeneration !== generation) return false;
    const capabilities = typeof navigator === 'undefined' ? {} : navigator;
    let realTimeFactor: number | undefined;
    let policy = getSpeechPolicy(settings.resourceMode, capabilities, realTimeFactor);
    let offset = 0;
    let started = false;
    const pitch = Number.isFinite(settings.pitch) ? Math.max(0.8, Math.min(1.4, settings.pitch)) : 1;
    const synthesize = (chunk: string) => supertonicSpeak(chunk, { voice: settings.aiVoiceName, speed: settings.rate })
      .then(audio => ({ audio, error: null }), error => ({ audio: null, error }));
    let chunk = splitSpeechText(clean, policy.chunkChars)[0];
    let pendingAudio = synthesize(chunk);
    while (chunk) {
      if (requestGeneration !== generation) return false;
      const result = await pendingAudio;
      if (requestGeneration !== generation) return false;
      if (result.error) throw result.error;
      const audio = result.audio!;
      const durationMs = audio.samples.length / audio.sampleRate / pitch * 1000;
      if (!audio.clipReuse && Number.isFinite(audio.generationMs) && audio.generationMs! > 0) {
        const observed = audio.generationMs! / durationMs;
        // React to a slowdown immediately; recover conservatively after it.
        realTimeFactor = realTimeFactor === undefined ? observed : Math.max(observed, realTimeFactor * 0.75 + observed * 0.25);
      }
      policy = getSpeechPolicy(settings.resourceMode, capabilities, realTimeFactor);
      const chunkOffset = clean.indexOf(chunk, offset);
      offset = chunkOffset + chunk.length;
      const nextChunk = splitSpeechText(clean.slice(offset), policy.chunkChars)[0];
      const prefetch = !!nextChunk && policy.prefetch;
      if (prefetch) pendingAudio = synthesize(nextChunk);
      await context.resume();
      if (requestGeneration !== generation) return false;
      if (context.state !== 'running') throw new Error('Audio is paused. Tap replay to resume speech.');
      const buffer = context.createBuffer(1, audio.samples.length, audio.sampleRate);
      buffer.getChannelData(0).set(audio.samples);
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = pitch;
      const filters: AudioNode[] = [];
      if (settings.tone === 'soft' || settings.tone === 'warm') {
        const low = context.createBiquadFilter();
        low.type = 'lowshelf'; low.frequency.value = 220;
        low.gain.value = settings.tone === 'warm' ? 2 : 0;
        const high = context.createBiquadFilter();
        high.type = 'highshelf'; high.frequency.value = 4000;
        high.gain.value = settings.tone === 'warm' ? -1 : -2;
        const headroom = context.createGain();
        headroom.gain.value = settings.tone === 'warm' ? 0.79 : 1;
        source.connect(low); low.connect(high); high.connect(headroom); headroom.connect(context.destination);
        filters.push(low, high, headroom);
      } else source.connect(context.destination);
      currentBufferSource = source;
      const words = [...chunk.matchAll(/\S+/g)];
      await new Promise<void>((resolve, reject) => {
        let wordIndex = 0;
        let finished = false;
        const emitWord = () => {
          const word = words[wordIndex++];
          if (word) {
            const position = chunkOffset + word.index!;
            const rawStart = prepared.sourceOffsets[position];
            const rawEnd = prepared.sourceOffsets[position + word[0].length - 1] + 1;
            onWordBoundary?.(rawStart, rawEnd - rawStart);
          }
        };
        const timer = setInterval(emitWord, Math.max(20, durationMs / Math.max(1, words.length)));
        const finish = () => {
          if (finished) return;
          finished = true;
          clearInterval(timer);
          source.onended = null;
          if (currentBufferSource === source) currentBufferSource = null;
          if (finishPlayback === finish) finishPlayback = null;
          source.disconnect();
          filters.forEach(filter => filter.disconnect());
          resolve();
        };
        finishPlayback = finish;
        source.onended = finish;
        try { source.start(); } catch (error) { reject(error); finish(); return; }
        emitWord();
        if (!started) { started = true; onStart?.(); }
      });
      if (requestGeneration !== generation) return false;
      chunk = nextChunk;
      if (chunk && !prefetch) pendingAudio = synthesize(chunk);
    }
    return requestGeneration === generation;
  } catch (error) {
    if (requestGeneration === generation) reportVoiceStatus({
      phase: 'error',
      message: (error instanceof Error ? error.message : 'Local voice failed.') + ' Retry voice preview; no hosted fallback.',
    });
    return false;
  } finally { end(); }
}
