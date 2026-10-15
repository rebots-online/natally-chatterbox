import { useEffect, useState } from 'react';
import { EMPTY_SURVEY, SURVEY_OPTIONS, voiceMeasurements, summarizeMeasurements, type VoiceSurvey } from '../services/voiceMeasurements';

const labels: Record<keyof VoiceSurvey, string> = { device: 'Device type', os: 'Operating system', browser: 'Browser', memory: 'Device RAM (if known)', power: 'Power mode', network: 'Connection during test', experience: 'What happened?' };
export function VoiceMeasurementPanel() {
  const [snapshot, setSnapshot] = useState(() => voiceMeasurements.snapshot());
  const [survey, setSurvey] = useState<VoiceSurvey>({ ...EMPTY_SURVEY });
  const [review, setReview] = useState('');
  useEffect(() => {
    const timer = setInterval(() => setSnapshot(voiceMeasurements.snapshot()), 1000);
    return () => clearInterval(timer);
  }, []);
  const timings = summarizeMeasurements(snapshot.events).filter(row => ['request', 'load'].includes(row.operation));
  const exportReport = () => {
    const report = JSON.stringify(voiceMeasurements.export(survey), null, 2);
    setReview(report);
    return report;
  };
  return <details className="p-3 rounded-xl bg-[#1d122b] border border-[#322641] text-xs space-y-3">
    <summary className="cursor-pointer text-[#f2ca50]">Participate in accurate voice-load measurements</summary>
    <p>Help measure loading across devices. Recording starts when you opt in and stops when you turn it off. Data stays in this tab until you download a report; nothing is uploaded automatically.</p>
    <p>The report contains file read sources, bytes, graph timings, failures, backend and text-length ranges. It excludes spoken text, accounts, error messages and device identifiers. Survey answers are optional.</p>
    <label className="flex gap-2 items-center"><input type="checkbox" checked={snapshot.enabled} onChange={event => {
      voiceMeasurements.setEnabled(event.target.checked); setSnapshot(voiceMeasurements.snapshot());
    }} /> Record measurements in this tab</label>
    <p>For a fresh model load, open the <a className="underline" href="/tests/voice-browser.html" target="_blank" rel="noreferrer">measurement page</a>, opt in, then start a test. The report distinguishes a new engine from one already in memory. Keep the page visible while testing.</p>
    <div className="grid grid-cols-2 gap-2">{(Object.keys(SURVEY_OPTIONS) as (keyof VoiceSurvey)[]).map(key => <label key={key} className="flex flex-col gap-1">{labels[key]}
      <select className="bg-[#120c1c] border border-[#322641] rounded p-1" value={survey[key]} onChange={event => { setSurvey({ ...survey, [key]: event.target.value }); setReview(''); }}>
        {SURVEY_OPTIONS[key].map(option => <option key={option} value={option}>{option.replaceAll('-', ' ')}</option>)}
      </select></label>)}</div>
    <p role="status">{snapshot.events.length} measured events · {snapshot.events.filter(event => event.operation === 'request' && event.state === 'complete').length} completed requests · {snapshot.events.filter(event => event.operation === 'request' && event.state === 'error').length} failed/interrupted requests{snapshot.omittedEvents > 0 ? ` · ${snapshot.omittedEvents} events omitted at the recording limit` : ''}</p>
    {timings.map((row, index) => <p key={index}>{row.operation === 'load' ? 'Model load only' : 'Whole request'} · {row.backend || 'unknown backend'} · {row.workload} · {row.memoryReuse ? 'engine already in memory' : 'new engine'}{row.operation === 'load' ? ` · ${row.source}` : row.clipReuse ? ' · saved audio replay' : row.workload === 'preload' ? '' : ' · new generation'}: n={row.count}, mean {(row.meanMs / 1000).toFixed(2)}s, observed {(row.minMs / 1000).toFixed(2)}–{(row.maxMs / 1000).toFixed(2)}s{row.sampleStdDevMs === null ? '' : `; sample 2σ ±${(row.observedTwoSigmaMs! / 1000).toFixed(2)}s, 3σ ±${(row.observedThreeSigmaMs! / 1000).toFixed(2)}s`}</p>)}
    <p>These are observations from this tab. Sample spreads describe these measurements; they are not population confidence intervals.</p>
    <div className="flex flex-wrap gap-3">
      <button type="button" className="underline" disabled={!snapshot.events.length} onClick={exportReport}>Review report</button>
      <button type="button" className="underline" disabled={!snapshot.events.length} onClick={() => {
        const url = URL.createObjectURL(new Blob([exportReport()], { type: 'application/json' }));
        const link = document.createElement('a'); link.href = url; link.download = 'natally-voice-measurements.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      }}>Download report to share</button>
      <button type="button" className="underline" onClick={() => { voiceMeasurements.clear(); setSnapshot(voiceMeasurements.snapshot()); setReview(''); }}>Clear recorded data</button>
    </div>
    {review && <label className="block">Exact report contents<textarea aria-label="Measurement report JSON" className="block w-full bg-[#120c1c] text-[10px]" rows={8} readOnly value={review} /></label>}
  </details>;
}
