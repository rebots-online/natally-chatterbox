import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { summarizeMeasurements, type VoiceMeasurement } from '../src/services/voiceMeasurements';

// Files are supplied deliberately by the analyst. No upload or provider endpoint.
export function aggregateVoiceReports(reports: any[]) {
const snapshots = new Map<string, any>();
const cohorts = new Map<string, { reports: number; omittedEvents: number; events: VoiceMeasurement[] }>();
for (const report of reports) {
  if (report.schema !== 'natally-voice-measurements/v1' || typeof report.reportId !== 'string' || !Array.isArray(report.events)) throw new Error('Unsupported measurement report');
  const previous = snapshots.get(report.reportId);
  if (!previous || report.events.length > previous.events.length || report.events.length === previous.events.length && (report.omittedEvents > previous.omittedEvents || report.snapshotSequence > previous.snapshotSequence)) snapshots.set(report.reportId, report);
}
for (const report of snapshots.values()) {
  const key = JSON.stringify({ runtime: report.runtime, ...report.survey });
  const cohort = cohorts.get(key) ?? { reports: 0, omittedEvents: 0, events: [] };
  cohort.reports++;
  cohort.omittedEvents += Number(report.omittedEvents) || 0;
  cohort.events.push(...report.events.filter((event: VoiceMeasurement) =>
    ['request', 'load', 'file', 'session', 'run'].includes(event.operation) && ['start', 'complete', 'error'].includes(event.state) &&
    (Number.isFinite(event.atMs) || event.state === 'error' && event.atMs === undefined) && (event.durationMs === undefined || Number.isFinite(event.durationMs) && event.durationMs >= 0)));
  cohorts.set(key, cohort);
}
return { scope: 'Voluntary reports. Report counts do not identify unique people or devices; sample spreads are not population coverage estimates.',
  cohorts: [...cohorts.entries()].map(([key, cohort]) => ({ context: JSON.parse(key), reports: cohort.reports,
    failedRequests: cohort.events.filter(event => event.operation === 'request' && event.state === 'error').length,
    omittedEvents: cohort.omittedEvents, timings: summarizeMeasurements(cohort.events) })) };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) console.log(JSON.stringify(aggregateVoiceReports(process.argv.slice(2).map(file => JSON.parse(readFileSync(file, 'utf8')))), null, 2));
