import { chatterboxSpeak, planChatterboxSpeech, initChatterbox, cancelChatterbox, reportVoiceStatus } from './chatterboxTts';
import type { BackchannelStage, LocalSpeech, SpeechCallbacks, SpeechProgress, SpeechSegment, SpeechTurn, VoiceId } from './chatterboxTypes';
import { segmentSpeechText } from './speechUnits';
import { backchannelPool } from './speechBackchannels';

export const NATALLY_VOICE_SAMPLE = "Okay, tiny cosmic plot twist. Your psychic is still figuring things out too. Let's take it one thing at a time. Honestly, the planets can wait. Let’s make this make sense.";

export interface VoiceSettings {
  resourceMode: 'auto' | 'gentle';
  tone: 'natural' | 'soft' | 'warm';
  readingAloud: boolean; // Default true (reading aloud by default)
  language: string; // 'ro-MD' | 'mo-MD' | 'ro-RO' | 'ru' | 'uk' | 'en-US'
  accentMode: 'moldavian' | 'slavic' | 'standard';
  rate: number; // 0.8 - 1.4
  pitch: number; // 0.8 - 1.4
  ttsModel: 'chatterbox-nano-onnx';
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
  ttsModel: 'chatterbox-nano-onnx',
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
        ttsModel: 'chatterbox-nano-onnx', language: 'en-US', accentMode: 'standard',
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
  void initChatterbox(settings.aiVoiceName as VoiceId).catch(() => {});
  void backchannelPool.configure(settings.aiVoiceName as VoiceId);
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
      const separator = /[\r\n]/.test(item.char) ? '\n' : ' ';
      if (compact.length && !/\s/.test(compact[compact.length - 1].char)) compact.push({ char: separator, index: item.index });
      else if (compact.length && separator === '\n') compact[compact.length - 1].char = '\n';
    } else compact.push(item);
  }
  if (/\s/.test(compact[compact.length - 1]?.char || '')) compact.pop();
  return { text: compact.map(item => item.char).join(''), sourceOffsets: compact.map(item => item.index) };
}

let sharedAudioContext: AudioContext | null = null;
let currentBufferSource: AudioBufferSourceNode | null = null;
let generation = 0;
let finishPlayback: ((completed?: boolean) => void) | null = null;
let finishUtterance: ((completed?: boolean) => void) | null = null;
let speechProgress: SpeechProgress = { phase: 'idle', message: '', turnId: 0, totalUnits: 0, readyUnits: 0, playedUnits: 0, startedAt: 0, confirmedAt: 0, maxGapMs: 0, final: false, playingUnit: null, generatingUnit: null };
const speechListeners = new Set<(progress: SpeechProgress) => void>();
export function publishSpeechProgress(update: Partial<SpeechProgress>): void {
  speechProgress = { ...speechProgress, ...update };
  for (const listener of speechListeners) listener(speechProgress);
}
export function subscribeSpeechProgress(listener: (progress: SpeechProgress) => void): () => void {
  speechListeners.add(listener); listener(speechProgress);
  return () => { speechListeners.delete(listener); };
}
export function isSpeechBusy(): boolean { return finishUtterance !== null; }

export function getSharedAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!sharedAudioContext && AudioContextClass) sharedAudioContext = new AudioContextClass({ latencyHint: 'interactive' });
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
function stopPlayback(): void {
  if (currentBufferSource) {
    try { currentBufferSource.stop(); currentBufferSource.disconnect(); } catch {}
    currentBufferSource = null;
  }
  finishPlayback?.(false);
  finishPlayback = null;
}
export function stopSpeaking(): void {
  generation++;
  cancelChatterbox();
  stopPlayback();
  finishUtterance?.(false);
  finishUtterance = null;
}
async function playAudio(audio: LocalSpeech, settings: VoiceSettings, current: () => boolean, onStart?: () => void,
  onWord?: (position: number, length: number) => void, text = ''): Promise<boolean> {
  const context = getSharedAudioContext();
  if (!context) throw new Error('Web Audio is unavailable in this browser.');
  await context.resume();
  if (!current()) return false;
  if (context.state !== 'running') throw new Error('Tap voice preview to enable audio playback.');
  stopPlayback();
  const pitch = Number.isFinite(settings.pitch) ? Math.max(0.8, Math.min(1.4, settings.pitch)) : 1;
  const buffer = context.createBuffer(1, audio.samples.length, audio.sampleRate);
  buffer.getChannelData(0).set(audio.samples);
  const source = context.createBufferSource(); source.buffer = buffer; source.playbackRate.value = pitch;
  const filters: AudioNode[] = [];
  if (settings.tone === 'soft' || settings.tone === 'warm') {
    const low = context.createBiquadFilter(); low.type = 'lowshelf'; low.frequency.value = 220; low.gain.value = settings.tone === 'warm' ? 2 : 0;
    const high = context.createBiquadFilter(); high.type = 'highshelf'; high.frequency.value = 4000; high.gain.value = settings.tone === 'warm' ? -1 : -2;
    const headroom = context.createGain(); headroom.gain.value = settings.tone === 'warm' ? 0.79 : 1;
    source.connect(low); low.connect(high); high.connect(headroom); headroom.connect(context.destination); filters.push(low, high, headroom);
  } else source.connect(context.destination);
  currentBufferSource = source;
  const words = [...text.matchAll(/\S+/g)];
  return new Promise<boolean>((resolve, reject) => {
    let wordIndex = 0; let finished = false;
    const emitWord = () => { const word = words[wordIndex++]; if (current() && word) onWord?.(word.index!, word[0].length); };
    const timer = words.length ? setInterval(emitWord, Math.max(20, audio.samples.length / audio.sampleRate / pitch * 1000 / words.length)) : null;
    const finish = (completed = false) => {
      if (finished) return; finished = true;
      if (timer !== null) clearInterval(timer);
      source.onended = null;
      if (currentBufferSource === source) currentBufferSource = null;
      if (finishPlayback === finish) finishPlayback = null;
      source.disconnect(); filters.forEach(filter => filter.disconnect()); resolve(completed && current());
    };
    finishPlayback = finish; source.onended = () => finish(true);
    try { source.start(); emitWord(); onStart?.(); } catch (error) { reject(error); finish(false); }
  });
}

export function beginSpeechTurn(settings: VoiceSettings, callbacks: SpeechCallbacks = {}, acknowledgement?: BackchannelStage): SpeechTurn {
  stopSpeaking();
  const requestGeneration = generation;
  backchannelPool.setBusy(true); void backchannelPool.configure(settings.aiVoiceName as VoiceId);
  let ended = false; let final = false; let started = false; let pumping = false; let playing = false; let bridgeChosen = false;
  let prepared = { text: '', sourceOffsets: [] as number[] };
  let sourceText = '';
  const units: { unit: SpeechSegment; offsets: number[] }[] = [];
  let unitIndex = 0;
  let waiting: (() => void) | null = null;
  let complete!: (success: boolean) => void;
  const completion = new Promise<boolean>(resolve => { complete = resolve; });
  let pending: { index: number; promise: Promise<{ audio: LocalSpeech | null; error: unknown }> } | null = null;
  const current = () => requestGeneration === generation && !ended;
  const notify = () => { const wake = waiting; waiting = null; wake?.(); };
  const end = (success = false) => {
    if (ended) return;
    ended = true; notify();
    if (finishUtterance === end) {
      finishUtterance = null; backchannelPool.setBusy(false);
      if (speechProgress.phase !== 'error') publishSpeechProgress({ phase: success ? 'complete' : 'interrupted', message: success ? 'Voice finished' : 'Voice interrupted', playingUnit: null, generatingUnit: null, confirmedAt: Date.now() });
    }
    callbacks.onPlaybackState?.(false); callbacks.onEnd?.(); complete(success);
  };
  const fail = (error: unknown) => {
    if (!current()) return;
    stopPlayback(); cancelChatterbox();
    const message = error instanceof Error ? error.message : String(error);
    publishSpeechProgress({ phase: 'error', message, confirmedAt: Date.now() });
    reportVoiceStatus({ phase: 'error', message }); end(false);
  };
  finishUtterance = end;
  publishSpeechProgress({ phase: acknowledgement ? 'thinking' : 'preparing', message: acknowledgement === 'interrupt' ? 'Interruption received · preparing your new reply' : acknowledgement ? 'Message received · preparing your reply' : 'Preparing voice',
    turnId: requestGeneration, totalUnits: 0, readyUnits: 0, playedUnits: 0, startedAt: Date.now(), submittedAt: acknowledgement ? Date.now() : undefined,
    confirmedAt: Date.now(), final: false, playingUnit: null, generatingUnit: null, maxGapMs: 0,
    ackStartedAt: undefined, firstTextAt: undefined, firstAudioAt: undefined, lastAudioEndAt: undefined });
  const acknowledge = async (stage: BackchannelStage, scheduled?: () => void): Promise<boolean> => {
    const audio = settings.readingAloud && current() ? backchannelPool.take(stage) : null;
    if (!audio) { scheduled?.(); return false; }
    try {
      return await playAudio({ ...audio, sampleRate: audio.sampleRate * settings.rate }, settings, current, () => {
        if (stage !== 'answer') publishSpeechProgress({ ackStartedAt: Date.now() });
        scheduled?.();
      });
    } catch (error) {
      if (current()) publishSpeechProgress({ message: 'Acknowledgement playback: ' + (error instanceof Error ? error.message : String(error)) });
      return false;
    } finally { scheduled?.(); }
  };
  let ackScheduled!: () => void;
  const acknowledged = new Promise<void>(resolve => { ackScheduled = resolve; });
  const acknowledgementPlayback = acknowledgement ? acknowledge(acknowledgement, ackScheduled) : (ackScheduled(), Promise.resolve(false));
  const synthesize = (index: number) => {
    publishSpeechProgress({ generatingUnit: index + 1, confirmedAt: Date.now() });
    return chatterboxSpeak(units[index].unit.text, { voice: settings.aiVoiceName as VoiceId, speed: settings.rate }).then(audio => {
      if (current()) publishSpeechProgress({ readyUnits: speechProgress.readyUnits + 1, generatingUnit: null, confirmedAt: Date.now() });
      return { audio, error: null };
    }, error => ({ audio: null, error }));
  };
  const prefetch = () => {
    if (current() && playing && !pending && units[unitIndex + 1]) pending = { index: unitIndex + 1, promise: synthesize(unitIndex + 1) };
  };
  const pump = async () => {
    if (pumping || !current()) return; pumping = true;
    try {
      while (current()) {
        if (!settings.readingAloud) { if (final) end(false); return; }
        if (unitIndex >= units.length) {
          if (final) { end(true); return; }
          publishSpeechProgress({ phase: 'thinking', message: 'Waiting for the next complete sentence', playingUnit: null });
          await new Promise<void>(resolve => { waiting = resolve; }); continue;
        }
        const entry = units[unitIndex];
        if (!pending) pending = { index: unitIndex, promise: synthesize(unitIndex) };
        if (pending.index !== unitIndex) throw new Error('Speech queue lost its beginning or ordering.');
        if (!playing) publishSpeechProgress({ phase: 'preparing', message: `Preparing sentence ${unitIndex + 1}`, playingUnit: null });
        const result = await pending.promise;
        if (!current()) return;
        pending = null;
        if (result.error) throw result.error;
        playing = true; prefetch();
        const played = await playAudio(result.audio!, settings, current, () => {
          const now = Date.now();
          publishSpeechProgress({ phase: 'speaking', message: `Speaking sentence ${unitIndex + 1}`, playingUnit: unitIndex + 1,
            firstAudioAt: speechProgress.firstAudioAt ?? now,
            maxGapMs: Math.max(speechProgress.maxGapMs, speechProgress.lastAudioEndAt ? now - speechProgress.lastAudioEndAt : 0), confirmedAt: now });
          if (!started) { started = true; callbacks.onStart?.(); }
          callbacks.onPlaybackState?.(true);
        }, (position, length) => {
          const start = entry.offsets[position]; const end = entry.offsets[position + length - 1] + 1;
          callbacks.onWordBoundary?.(start, end - start);
        }, entry.unit.text);
        playing = false;
        if (!current()) return;
        callbacks.onPlaybackState?.(false);
        if (!played) { end(false); return; }
        unitIndex++;
        publishSpeechProgress({ playedUnits: unitIndex, playingUnit: null, lastAudioEndAt: Date.now(), confirmedAt: Date.now() });
      }
    } catch (error) { if (current()) fail(error); }
    finally { pumping = false; }
  };
  const update = (text: string, closed = false) => {
    if (!current()) return;
    try {
      const next = prepareSpeechWithOffsets(text);
      const committedEnd = units.at(-1)?.unit.end || 0;
      if (next.text.slice(0, committedEnd) !== prepared.text.slice(0, committedEnd)) throw new Error('The reply changed an already committed speech prefix.');
      prepared = next; sourceText = text; final ||= closed;
      const segments = segmentSpeechText(prepared.text, final);
      for (const unit of segments.slice(units.length)) units.push({ unit, offsets: prepared.sourceOffsets.slice(unit.start, unit.end) });
      publishSpeechProgress({ totalUnits: units.length, final, firstTextAt: speechProgress.firstTextAt ?? (units.length ? Date.now() : undefined), confirmedAt: Date.now() });
      if (acknowledgement && units.length && !bridgeChosen) {
        bridgeChosen = true;
        void acknowledgementPlayback.then(() => { if (current() && !started) void acknowledge('answer'); });
      }
      prefetch(); notify(); void pump();
    } catch (error) { fail(error); }
  };
  return { id: requestGeneration, acknowledged, update, fail,
    done: () => { if (current()) { if (!final) update(sourceText, true); notify(); void pump(); } return completion; },
    cancel: () => { if (current()) stopSpeaking(); },
  };
}

export async function speakNatallyText(text: string, settings: VoiceSettings, onStart?: () => void, onEnd?: () => void,
  onWordBoundary?: (charIndex: number, charLength?: number) => void, onPlaybackState?: (playing: boolean) => void): Promise<boolean> {
  if (!settings.readingAloud || !prepareSpeechText(text)) { stopSpeaking(); onEnd?.(); return false; }
  const turn = beginSpeechTurn(settings, { onStart, onEnd, onWordBoundary, onPlaybackState });
  try {
    await planChatterboxSpeech(prepareSpeechText(text), settings.aiVoiceName as VoiceId);
    if (turn.id === generation) turn.update(text, true);
  } catch (error) { turn.fail(error); }
  return turn.done();
}
