import { BACKCHANNEL_PALETTES, BACKCHANNEL_POOL_VERSION, BACKCHANNEL_TARGET, CHATTERBOX_REVISION, VOICE_REFERENCES } from './chatterboxModel';
import { cancelChatterbox, chatterboxSpeak, initChatterbox } from './chatterboxTts';
import type { BackchannelStage, LocalSpeech, VoiceId } from './chatterboxTypes';

export interface PoolSnapshot { ready: number; total: number; message: string; error: string | null }

export class BackchannelPool {
  private voice: VoiceId = 'F4';
  private epoch = 0;
  private busy = false;
  private running = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private idleId: number | null = null;
  private clips = new Map<string, LocalSpeech>();
  private lastUsed = new Map<BackchannelStage, string>();
  private refresh = new Set<string>();
  private failed = new Set<string>();
  private listeners = new Set<(snapshot: PoolSnapshot) => void>();
  private error: string | null = null;
  private lastActivity = 0;

  snapshot(): PoolSnapshot {
    return { ready: this.clips.size, total: Object.keys(BACKCHANNEL_PALETTES).length * BACKCHANNEL_TARGET, error: this.error,
      message: this.running ? 'Preparing conversational cues during idle time' : this.clips.size === Object.keys(BACKCHANNEL_PALETTES).length * BACKCHANNEL_TARGET ? 'Conversational cues ready' : 'Conversational cues prepare when idle' };
  }
  subscribe(listener: (snapshot: PoolSnapshot) => void): () => void {
    this.listeners.add(listener); listener(this.snapshot());
    return () => { this.listeners.delete(listener); };
  }
  private notify(): void { for (const listener of this.listeners) listener(this.snapshot()); }

  async configure(voice: VoiceId): Promise<void> {
    if (this.epoch && voice === this.voice) { this.schedule(); return; }
    this.pause(); this.voice = voice;
    const epoch = ++this.epoch;
    this.clips.clear(); this.lastUsed.clear(); this.refresh.clear(); this.failed.clear(); this.error = null;
    this.notify();
    try {
      const cache = await caches.open('natally-chatterbox-backchannels-v' + BACKCHANNEL_POOL_VERSION);
      const prefix = `${location.origin}/__voice_pool/${CHATTERBOX_REVISION}/${VOICE_REFERENCES[voice].gitBlob}/${voice}/`;
      for (const request of await cache.keys()) {
        if (epoch !== this.epoch) return;
        if (!request.url.startsWith(prefix)) continue;
        const key = request.url.slice(prefix.length);
        const [stage, index] = key.split(':');
        if (!(stage in BACKCHANNEL_PALETTES) || !/^\d$/.test(index) || !BACKCHANNEL_PALETTES[stage as BackchannelStage][Number(index)]) continue;
        const response = await cache.match(request);
        const bytes = await response!.arrayBuffer();
        const backend = response!.headers.get('X-Voice-Backend');
        if (!bytes.byteLength || bytes.byteLength % 4 || bytes.byteLength > 24000 * 10 * 4 || response!.headers.get('X-Sample-Rate') !== '24000' || !['webgpu', 'wasm'].includes(backend!)) {
          await cache.delete(request); this.error = 'A saved acknowledgement was invalid and will be prepared again when idle.'; continue;
        }
        const samples = new Float32Array(bytes);
        if (!samples.every(Number.isFinite)) { await cache.delete(request); this.error = 'A saved acknowledgement contained invalid audio.'; continue; }
        if (epoch !== this.epoch) return;
        const sameStage = [...this.clips.keys()].filter(value => value.startsWith(stage + ':'));
        if (sameStage.length >= BACKCHANNEL_TARGET) this.clips.delete(sameStage[0]);
        this.clips.set(key, { samples, sampleRate: 24000, generationMs: 0, backend: backend as LocalSpeech['backend'], clipReuse: true });
      }
    } catch (error) { if (epoch === this.epoch) this.error = 'Acknowledgement cache: ' + (error instanceof Error ? error.message : String(error)); }
    if (epoch === this.epoch) { this.notify(); this.schedule(); }
  }

  setBusy(busy: boolean): void {
    this.busy = busy;
    if (busy) this.pause();
    else { this.lastActivity = performance.now(); this.schedule(); }
  }
  pause(): void {
    this.lastActivity = performance.now();
    if (this.timer !== null) clearTimeout(this.timer);
    if (this.idleId !== null) window.cancelIdleCallback?.(this.idleId);
    this.timer = null; this.idleId = null;
    cancelChatterbox('idle');
    this.schedule();
  }
  take(stage: BackchannelStage): LocalSpeech | null {
    const keys = [...this.clips.keys()].filter(key => key.startsWith(stage + ':'));
    const choices = keys.filter(key => key !== this.lastUsed.get(stage));
    const key = (choices.length ? choices : keys)[Math.floor(Math.random() * (choices.length || keys.length))];
    if (!key) return null;
    this.lastUsed.set(stage, key); this.refresh.add(key);
    return this.clips.get(key)!;
  }
  private schedule(): void {
    if (typeof window === 'undefined' || !this.epoch || this.busy || this.running || this.timer !== null || this.idleId !== null) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      if (this.busy) return;
      if ('requestIdleCallback' in window) this.idleId = window.requestIdleCallback(() => { this.idleId = null; void this.replenish(); });
      else void this.replenish();
    }, Math.max(0, 2000 - (performance.now() - this.lastActivity)));
  }
  private async replenish(): Promise<void> {
    if (this.busy || this.running || !this.epoch) return;
    const epoch = this.epoch;
    const voice = this.voice;
    let candidate: { stage: BackchannelStage; index: number; replace?: string } | null = null;
    // Fill one of every semantic stage before making the second variants.
    for (let level = 0; level < BACKCHANNEL_TARGET && !candidate; level++) {
      for (const stage of ['interrupt', 'receipt', 'answer', 'continuation'] as BackchannelStage[]) {
        if ([...this.clips.keys()].filter(key => key.startsWith(stage + ':')).length > level) continue;
        const index = BACKCHANNEL_PALETTES[stage].findIndex((_, index) => !this.clips.has(`${stage}:${index}`) && !this.failed.has(`${stage}:${index}`));
        if (index >= 0) { candidate = { stage, index }; break; }
      }
    }
    if (!candidate) for (const key of this.refresh) {
      const stage = key.split(':')[0] as BackchannelStage;
      const index = BACKCHANNEL_PALETTES[stage].findIndex((_, index) => !this.clips.has(`${stage}:${index}`) && !this.failed.has(`${stage}:${index}`));
      if (index >= 0) { candidate = { stage, index, replace: key }; break; }
    }
    if (!candidate) return;
    const key = `${candidate.stage}:${candidate.index}`;
    this.running = true; this.notify();
    try {
      await initChatterbox(voice);
      if (this.busy || epoch !== this.epoch || performance.now() - this.lastActivity < 2000) return;
      const audio = await chatterboxSpeak(BACKCHANNEL_PALETTES[candidate.stage][candidate.index], { voice, speed: 1, priority: 'idle' });
      if (this.busy || epoch !== this.epoch || performance.now() - this.lastActivity < 2000) return;
      if (audio.samples.length > 24000 * 10) throw new Error('An acknowledgement exceeded the short-clip limit.');
      if (candidate.replace) { this.clips.delete(candidate.replace); this.refresh.delete(candidate.replace); }
      this.clips.set(key, audio); this.notify();
      const cache = await caches.open('natally-chatterbox-backchannels-v' + BACKCHANNEL_POOL_VERSION);
      const url = `${location.origin}/__voice_pool/${CHATTERBOX_REVISION}/${VOICE_REFERENCES[voice].gitBlob}/${voice}/${key}`;
      await cache.put(url, new Response(audio.samples.slice().buffer as ArrayBuffer, { headers: { 'Content-Type': 'application/octet-stream', 'Content-Length': String(audio.samples.byteLength), 'X-Sample-Rate': '24000', 'X-Voice-Backend': audio.backend } }));
      const entries = [...await cache.keys()];
      let bytes = 0;
      for (const entry of entries) bytes += Number((await cache.match(entry))?.headers.get('Content-Length') || 0);
      while (bytes > 16000000 && entries.length) {
        const entry = entries.shift()!;
        bytes -= Number((await cache.match(entry))?.headers.get('Content-Length') || 0); await cache.delete(entry);
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError') && epoch === this.epoch) {
        this.failed.add(key); this.error = 'Idle acknowledgement preparation: ' + (error instanceof Error ? error.message : String(error));
      }
    } finally { this.running = false; this.notify(); this.schedule(); }
  }
}

export const backchannelPool = new BackchannelPool();
if (typeof window !== 'undefined') for (const event of ['pointerdown', 'keydown', 'touchstart']) {
  window.addEventListener(event, () => backchannelPool.pause(), { capture: true, passive: true });
}
