import { voiceMeasurements, type VoiceMeasurement } from './voiceMeasurements';
import { CHATTERBOX_REVISION as VOICE_REVISION } from './chatterboxModel';
export interface LocalSpeech { samples: Float32Array; sampleRate: number; generationMs?: number; backend?: string; clipReuse?: boolean }
export interface VoiceGraphProgress { file: string; backend: string; operation: 'session' | 'run'; state: 'start' | 'complete' | 'error'; completed: number; expected?: number; startedAt: number; durationMs?: number }
export interface VoiceStatus {
  phase: 'idle' | 'loading' | 'preparing' | 'ready' | 'synthesizing' | 'error';
  message: string;
  loadedBytes?: number;
  totalBytes?: number;
  file?: string;
  files?: { file: string; loadedBytes: number; totalBytes: number; source: 'cache' | 'network' | 'unknown' }[];
  graphs?: VoiceGraphProgress[];
  startedAt?: number;
  confirmedAt?: number;
  runtimeEvent?: boolean;
  heartbeatAt?: number;
}
let status: VoiceStatus = { phase: 'idle', message: 'Chatterbox local voice · downloads on first use' };
const listeners = new Set<(value: VoiceStatus) => void>();
let worker: Worker | null = null;
let nextId = 0;
const pending = new Map<number, { resolve: (audio: LocalSpeech | null) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout>; speech: boolean }>();
let lastAcknowledgedAt = 0;
let preload: Promise<void> | null = null;
// A failed GPU runtime is unsafe to reuse. The next explicit retry stays local
// but uses WASM for the rest of this page session.
let forceWasm = false;

export function reportVoiceStatus(value: VoiceStatus) {
  status = value.phase === 'error' ? { ...status, ...value } : { heartbeatAt: status.heartbeatAt, ...value };
  for (const listener of listeners) listener(status);
}
export function subscribeVoiceStatus(listener: (value: VoiceStatus) => void) {
  listeners.add(listener);
  listener(status);
  return () => { listeners.delete(listener); };
}
function resetWorker(message: string, recordInterruption = true) {
  if (pending.size && recordInterruption) voiceMeasurements.record({ operation: 'request', state: 'error', runId: 'worker-interruption-' + nextId, revision: VOICE_REVISION });
  worker?.terminate();
  worker = null;
  preload = null;
  for (const request of pending.values()) {
    clearTimeout(request.timer);
    request.reject(new Error(message));
  }
  pending.clear();
  reportVoiceStatus({ phase: 'error', message });
}
/** Stop obsolete inference immediately; a later request reloads from the saved cache. */
export function cancelChatterbox(): void {
  if (![...pending.values()].some(request => request.speech)) return;
  resetWorker('Speech cancelled.', false);
  reportVoiceStatus({ phase: 'idle', message: 'Speech stopped.' });
}
function idleTimeout() {
  return setTimeout(() => resetWorker('Local voice stopped reporting measured work. Retry voice preview.'), 300000);
}
function requestWorker(payload: { text?: string; preload?: boolean; voice?: string; speed?: number }): Promise<LocalSpeech | null> {
  if (!worker) {
    try {
      worker = new Worker(new URL('./chatterbox.worker.ts', import.meta.url), { type: 'module' });
      const activeWorker = worker;
      worker.onmessage = ({ data }) => {
        if (worker !== activeWorker) return;
        if (data.measurement) {
          if (data.measurement.operation === 'request' && data.measurement.state === 'start') reportVoiceStatus({ ...status, heartbeatAt: undefined });
          voiceMeasurements.record(data.measurement as VoiceMeasurement);
        }
        if (data.heartbeat) reportVoiceStatus({ ...status, heartbeatAt: data.heartbeat });
        if (data.status) {
          if (Number.isFinite(data.status.confirmedAt) && data.status.confirmedAt > lastAcknowledgedAt) {
            lastAcknowledgedAt = data.status.confirmedAt;
            for (const request of pending.values()) { clearTimeout(request.timer); request.timer = idleTimeout(); }
          }
          reportVoiceStatus(data.status);
        }
        if (!data.id) return;
        const request = pending.get(data.id);
        if (!request) return;
        if (data.error) {
          if (data.inputRejected) {
            clearTimeout(request.timer); pending.delete(data.id); request.reject(new Error(data.error)); return;
          }
          if (data.runtimeFailed && data.backend === 'webgpu') forceWasm = true;
          resetWorker(data.error, false);
          return;
        }
        clearTimeout(request.timer);
        pending.delete(data.id);
        request.resolve(data.preloaded ? null : {
          samples: data.samples, sampleRate: data.sampleRate,
          ...(Number.isFinite(data.generationMs) ? { generationMs: data.generationMs } : {}),
          ...(['wasm', 'webgpu'].includes(data.backend) ? { backend: data.backend } : {}),
          ...(typeof data.clipReuse === 'boolean' ? { clipReuse: data.clipReuse } : {}),
        });
      };
      worker.onerror = () => {
        if (worker === activeWorker) resetWorker('Local voice could not start. Retry voice preview.');
      };
      worker.onmessageerror = () => {
        if (worker === activeWorker) resetWorker('Local voice returned unreadable data. Retry voice preview.');
      };
    } catch {
      return Promise.reject(new Error('This browser cannot start local voice.'));
    }
  }
  return new Promise((resolve, reject) => {
    const id = ++nextId;
    const timer = idleTimeout();
    pending.set(id, { resolve, reject, timer, speech: !!payload.text });
    try {
      worker!.postMessage({ id, ...payload, forceWasm });
    } catch {
      resetWorker('Local voice could not receive this request. Retry voice preview.');
    }
  });
}

export function initChatterbox(): Promise<void> {
  preload ??= requestWorker({ preload: true }).then(() => {}).catch(error => {
    preload = null;
    throw error;
  });
  return preload;
}

export function scheduleChatterboxPreload(): () => void {
  if (typeof window === 'undefined') return () => {};
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (connection?.saveData) return () => {};
  const start = () => { void initChatterbox().catch(() => {}); };
  if ('requestIdleCallback' in window) {
    const id = window.requestIdleCallback(start, { timeout: 4000 });
    return () => window.cancelIdleCallback(id);
  }
  const timer = setTimeout(start, 1500);
  return () => clearTimeout(timer);
}

export async function chatterboxSpeak(text: string, options: { voice?: string; speed?: number } = {}): Promise<LocalSpeech> {
  if (!text.trim()) throw new Error('No text to speak.');
  if (text.length > 20000) throw new Error('Speech chunk is too long.');
  const result = await requestWorker({ text, ...options });
  if (!result?.samples?.length || !Number.isFinite(result.sampleRate) || result.sampleRate <= 0) throw new Error('Local voice returned invalid audio.');
  return result;
}
