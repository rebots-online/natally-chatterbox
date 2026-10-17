import { useEffect, useState } from 'react';
import { subscribeVoiceStatus, type VoiceStatus } from '../services/chatterboxTts';
import { stopSpeaking, subscribeSpeechProgress } from '../services/voiceService';
import type { SpeechProgress } from '../services/chatterboxTypes';
import { backchannelPool } from '../services/speechBackchannels';

export function ConversationVoiceStatus() {
  const [speech, setSpeech] = useState<SpeechProgress | null>(null);
  const [pool, setPool] = useState(() => backchannelPool.snapshot());
  const [engine, setEngine] = useState<VoiceStatus>({ phase: 'idle', message: '' });
  const [now, setNow] = useState(Date.now());
  useEffect(() => subscribeSpeechProgress(setSpeech), []);
  useEffect(() => backchannelPool.subscribe(setPool), []);
  useEffect(() => subscribeVoiceStatus(value => setEngine(previous => {
    if (value.phase === previous.phase && !['loading', 'error'].includes(value.phase)) return previous;
    return value;
  })), []);
  const active = !!speech && ['thinking', 'preparing', 'speaking'].includes(speech.phase);
  const working = active || pool.message.startsWith('Preparing') || ['loading', 'preparing'].includes(engine.phase);
  useEffect(() => {
    if (!working) return;
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, [working]);
  const hasUnits = !!speech?.totalUnits;
  const loading = !hasUnits && ['loading', 'preparing'].includes(engine.phase);
  return <section aria-label="Conversation voice status" className="mb-2 rounded-xl border border-[#d4af37]/35 bg-[#130c20] px-3 py-2 text-[11px] text-[#e6d8be]"
    data-phase={speech?.phase} data-turn-id={speech?.turnId} data-submitted-at={speech?.submittedAt}
    data-ack-started-at={speech?.ackStartedAt} data-ack-ended-at={speech?.ackEndedAt}
    data-bridge-started-at={speech?.bridgeStartedAt} data-bridge-ended-at={speech?.bridgeEndedAt}
    data-first-unit-text-at={speech?.firstTextAt} data-first-audio-at={speech?.firstAudioAt}
    data-last-audio-end-at={speech?.lastAudioEndAt} data-max-gap-ms={speech?.maxGapMs}
    data-total-units={speech?.totalUnits} data-ready-units={speech?.readyUnits} data-played-units={speech?.playedUnits} data-final={speech?.final}>
    <div className="flex items-center justify-between gap-2">
      <span role="status" aria-live="polite" className={speech?.phase === 'error' ? 'text-amber-200' : 'text-[#f2ca50]'}>
        {active || speech?.phase === 'error' || speech?.phase === 'interrupted' ? speech.message : loading ? 'Preparing local voice' : speech?.phase === 'complete' ? 'Voice finished' : pool.message}
      </span>
      {active && <button type="button" onClick={stopSpeaking} className="cursor-pointer rounded border border-[#d4af37]/50 px-2 py-1" aria-label="Stop current voice">Stop</button>}
    </div>
    {hasUnits && <>
      <p className="mt-1 tabular-nums">{speech!.readyUnits} / {speech!.totalUnits} {speech!.final ? 'sentences' : 'received sentences'} ready · {speech!.playedUnits} / {speech!.totalUnits} played{!speech!.final && ' · reply still arriving'}</p>
      <progress aria-label={speech!.final ? 'Reply sentences played' : 'Received sentences played; reply length not yet final'} max={speech!.totalUnits} value={speech!.playedUnits} className="mt-1 block h-1 w-full accent-[#d4af37]" />
    </>}
    {active && !hasUnits && <p className="mt-1 text-[#bdb0c5]">Reply length is not known yet.</p>}
    {active && speech?.phase !== 'speaking' && <p className="mt-1 tabular-nums text-[#bdb0c5]">{(Math.max(0, now - speech!.startedAt) / 1000).toFixed(1)}s since this voice turn began · {(Math.max(0, now - speech!.confirmedAt) / 1000).toFixed(1)}s since the last reply or audio boundary</p>}
    {loading && !!engine.totalBytes && <p className="mt-1 tabular-nums">Voice files: {((engine.loadedBytes || 0) / 1000000).toFixed(1)} / {(engine.totalBytes / 1000000).toFixed(1)} MB read</p>}
    <p className="mt-1 text-[10px] text-[#bdb0c5]">Acknowledgements: {pool.ready} / {pool.total} prepared{pool.ready < pool.total ? ' · prepared silently when idle' : ' · saved locally'}{active && !speech?.ackStartedAt && speech?.submittedAt ? ' · no prepared submission cue was played' : ''}</p>
    {(pool.error || engine.phase === 'error' && !active) && <p className="mt-1 text-amber-200">{pool.error || engine.message}</p>}
  </section>;
}

export function VoiceDownloadStatus() {
  const [status, setStatus] = useState<VoiceStatus>({ phase: 'idle', message: '' });
  useEffect(() => subscribeVoiceStatus(setStatus), []);
  return <VoiceProgress status={status} />;
}

export function VoiceProgress({ status }: { status: VoiceStatus }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!['loading', 'preparing', 'synthesizing'].includes(status.phase)) return;
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, [status.phase]);
  if (!['loading', 'preparing', 'synthesizing', 'error'].includes(status.phase)) return null;
  const hasByteProgress = ['loading', 'preparing'].includes(status.phase) && !!status.totalBytes;
  const format = (bytes: number) => (bytes / 1000000).toFixed(1);
  return (
    <div className="fixed bottom-0 inset-x-0 z-[100] bg-[#180f26]/95 border-t border-[#d4af37]/30 text-[#e6d8be] font-mono text-[10px]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-center justify-between gap-3 px-3 py-1">
        {status.phase !== 'error' && <span key={status.confirmedAt} aria-hidden="true" className="voice-measurement-ack h-2 w-2 rounded-full bg-[#d4af37] shrink-0" />}
        <span role="status">{status.message}</span>
        {hasByteProgress && <span className="shrink-0 tabular-nums">
          {format(status.loadedBytes || 0)} / {format(status.totalBytes!)} MB
        </span>}
      </div>
      {status.phase !== 'error' && status.startedAt && <div className="px-3 pb-1 tabular-nums">
        {(Math.max(0, now - status.startedAt) / 1000).toFixed(1)}s elapsed · last work measurement {(Math.max(0, now - (status.confirmedAt || status.startedAt)) / 1000).toFixed(1)}s ago
        {status.heartbeatAt && <> · <span key={status.heartbeatAt} className="voice-measurement-ack inline-block">worker responded</span> {(Math.max(0, now - status.heartbeatAt) / 1000).toFixed(1)}s ago</>}
      </div>}
      {(status.files || status.graphs) && <details className="px-3 pb-1 max-h-[40vh] overflow-auto">
        <summary className="cursor-pointer">Actual files and ONNX graphs{status.file ? ` · ${status.file}` : ''}</summary>
        {status.files?.map(file => <div key={file.file} className="py-1">
          <div className="flex justify-between gap-2"><span>{file.file} · {file.source === 'cache' ? 'saved cache' : file.source === 'network' ? 'network response' : 'source not yet measured'}</span><span>{format(file.loadedBytes)} / {format(file.totalBytes)} MB</span></div>
          <progress aria-label={file.file + ' bytes read'} max={file.totalBytes} value={file.loadedBytes} className="block w-full h-1 accent-[#d4af37]" />
        </div>)}
        {status.graphs?.map(graph => <div key={graph.operation + graph.file + graph.backend} className="py-1">
          <span>{graph.file} · {graph.backend} · {graph.operation === 'session' ? 'initialization' : 'execution'} · {graph.completed}{graph.expected ? '/' + graph.expected : ''} completed{graph.state === 'start' ? ' · waiting for runtime completion' : graph.state === 'error' ? ' · failed' : ''}{graph.durationMs !== undefined ? ` · last operation ${(graph.durationMs / 1000).toFixed(3)}s` : ''}</span>
          {graph.expected && <progress aria-label={graph.file + ' ' + graph.operation + ' completions'} max={graph.expected} value={graph.completed} className="block w-full h-1 accent-[#d4af37]" />}
        </div>)}
      </details>}
      {['loading', 'preparing'].includes(status.phase) && <progress aria-label={hasByteProgress ? 'Voice model bytes loaded' : 'Preparing local voice runtime'}
        max={hasByteProgress ? status.totalBytes : undefined}
        value={hasByteProgress ? status.loadedBytes || 0 : undefined}
        className="block w-full h-[2px] accent-[#d4af37]" />}
    </div>
  );
}
