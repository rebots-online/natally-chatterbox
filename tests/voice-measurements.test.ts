import test from 'node:test';
import assert from 'node:assert/strict';
import { VoiceMeasurementStore, summarizeMeasurements, EMPTY_SURVEY } from '../src/services/voiceMeasurements';
import { aggregateVoiceReports } from '../scripts/summarize-voice-measurements';

test('participation is opt-in, export whitelists data, and failed runs stay distinguishable', () => {
  const store = new VoiceMeasurementStore();
  const start = { operation: 'request', state: 'start', runId: '1', atMs: 0, backend: 'wasm', workload: '1-100', revision: 'pinned', memoryReuse: false } as const;
  store.record(start);
  assert.equal(store.snapshot().events.length, 0);
  store.setEnabled(true);
  store.record({ ...start, text: 'PRIVATE SENTENCE', account: 'PRIVATE ACCOUNT' } as any);
  store.record({ ...start, state: 'error', atMs: 42, durationMs: 42, error: 'PRIVATE ERROR TEXT' } as any);
  const exported = store.export({ device: 'phone', os: 'android', browser: 'chrome', power: 'normal', network: 'wifi', experience: 'repeated-loading', memory: 'unknown' });
  const json = JSON.stringify(exported);
  assert.ok(!json.includes('PRIVATE'));
  assert.equal(exported.events[1].state, 'error');
  assert.equal(exported.survey.os, 'android');
  assert.equal(exported.summary.length, 0, 'failed requests do not enter successful timing estimates');
  store.setEnabled(false);
  store.record({ ...start, runId: '2' });
  assert.equal(store.snapshot().events.length, 2);
  store.clear();
  assert.equal(store.snapshot().events.length, 0);
});

test('timing comparison separates backend, workload and reuse; spreads are observed samples', () => {
  const events = [100, 200, 300].map((durationMs, index) => ({ operation: 'request', state: 'complete', runId: String(index), atMs: durationMs, durationMs, backend: 'wasm', workload: '1-100', memoryReuse: false, revision: 'pinned' } as const));
  const rows = summarizeMeasurements([...events, { ...events[0], backend: 'webgpu' }, { ...events[0], memoryReuse: true }, { ...events[0], workload: '101-300' }]);
  assert.equal(rows.length, 4);
  assert.equal(rows[0].count, 3);
  assert.equal(rows[0].meanMs, 200);
  assert.equal(rows[0].sampleStdDevMs, 100);
  assert.equal(rows[0].observedTwoSigmaMs, 200);
  assert.equal(rows[0].observedThreeSigmaMs, 300);
  assert.equal(rows[1].sampleStdDevMs, null, 'one observation cannot provide a variance');
});

test('event cap reports omitted measurements and never grows without bound', () => {
  const store = new VoiceMeasurementStore(2);
  store.setEnabled(true);
  for (let index = 0; index < 3; index++) store.record({ operation: 'session', state: 'complete', runId: '1', atMs: index, durationMs: index, revision: 'pinned' });
  assert.equal(store.snapshot().events.length, 2);
  assert.equal(store.snapshot().omittedEvents, 1);
});

test('shared reports use largest duplicate snapshot and separate device cohorts', () => {
  const store = new VoiceMeasurementStore(); store.setEnabled(true);
  const event = { operation: 'request', state: 'complete', runId: '1', atMs: 100, durationMs: 100, revision: 'pinned', clipReuse: false } as const;
  store.record({ ...event, state: 'start' }); store.record(event);
  const first = store.export({ ...EMPTY_SURVEY, device: 'phone' });
  store.record({ ...event, state: 'start', runId: '2' }); store.record({ ...event, runId: '2', durationMs: 200 });
  const latest = store.export({ ...EMPTY_SURVEY, device: 'phone' });
  store.clear(); store.record({ ...event, state: 'start', clipReuse: true }); store.record({ ...event, clipReuse: true });
  const desktop = store.export({ ...EMPTY_SURVEY, device: 'desktop' });
  const result = aggregateVoiceReports([first, latest, desktop, latest]);
  assert.equal(result.cohorts.length, 2);
  assert.equal(result.cohorts[0].reports, 1);
  assert.equal(result.cohorts[0].timings[0].count, 2);
  assert.equal(result.cohorts[0].timings[0].meanMs, 150);
  assert.equal(result.cohorts[1].timings[0].clipReuse, true);
});

test('opting in or clearing mid-operation keeps raw completion but excludes a partial timing sample', () => {
  const store = new VoiceMeasurementStore();
  const start = { operation: 'session', state: 'start', runId: '1', atMs: 0, revision: 'pinned' } as const;
  store.record(start); store.setEnabled(true);
  store.record({ ...start, state: 'complete', durationMs: 500 });
  assert.equal(store.snapshot().events[0].capturedStart, false);
  assert.equal(store.export(EMPTY_SURVEY).summary.length, 0);
  store.record({ ...start, runId: '2' }); store.clear();
  store.record({ ...start, runId: '2', state: 'complete', durationMs: 500 });
  assert.equal(store.export(EMPTY_SURVEY).summary.length, 0);
});

test('survey correction on equal-size export replaces earlier unknown cohort', () => {
  const store = new VoiceMeasurementStore();
  const first = store.export(EMPTY_SURVEY);
  const corrected = store.export({ ...EMPTY_SURVEY, os: 'android' });
  const result = aggregateVoiceReports([corrected, first]);
  assert.equal(result.cohorts[0].context.os, 'android');
});

test('request pairing survives actual backend selection or fallback', () => {
  const store = new VoiceMeasurementStore(); store.setEnabled(true);
  store.record({ operation: 'request', state: 'start', runId: '1', backend: 'wasm', atMs: 0, revision: 'pinned' });
  store.record({ operation: 'request', state: 'complete', runId: '1', backend: 'webgpu', atMs: 100, durationMs: 100, revision: 'pinned' });
  assert.equal(store.snapshot().events[1].capturedStart, true);
  assert.equal(store.export(EMPTY_SURVEY).summary[0].backend, 'webgpu');
});
