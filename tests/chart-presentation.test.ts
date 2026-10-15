import test from 'node:test';
import assert from 'node:assert/strict';
import * as chat from '../src/services/natallyChat';
import { calculateNatalChart } from '../src/services/ephemeris';

const chart = await calculateNatalChart({ name: 'Chart focus fixture', birthDate: '2000-01-01', birthTime: '00:00',
  placeName: 'Greenwich', latitude: 51.48, longitude: 0, timezoneOffset: 0, houseSystem: 'W' });

test('response cues become clean text and ordered offsets, without losing provenance', () => {
  const result = chat.parseNatallyResponse('  [[chart:Sun]]Your Sun.\n\n[[chart:House 8;Moon]]Your eighth house.\n[[chart:clear]]Your choice.\n---ASTROLOGICAL PROVENANCE---\nGeometry: measured', chart);
  assert.equal(result.text, 'Your Sun.\n\nYour eighth house.\nYour choice.');
  assert.deepEqual(result.chartCues, [
    { offset: 0, targets: ['Sun'] }, { offset: 11, targets: ['House 8', 'Moon'] }, { offset: 30, targets: [] },
  ]);
  assert.equal(result.evidence?.verifiedGeometry, 'measured');
});

test('invented aspects, selectors, malformed cues and unknown-time houses cannot control the chart', () => {
  const result = chat.parseNatallyResponse('[[chart:Sun;#billing]]Safe. [[chart:House 13]]Still safe. [[chart:<script>]]Done. [[chart:Sun', chart);
  assert.equal(result.text, 'Safe. Still safe. Done.');
  assert.deepEqual(result.chartCues, []);
  const unknown = { ...chart, input: { ...chart.input, birthTimeUnknown: true } };
  assert.deepEqual(chat.parseNatallyResponse('[[chart:House 1]]Approximate.', unknown).chartCues, []);
  assert.deepEqual(chat.parseNatallyResponse('[[chart:Sun]]Hello.').chartCues, []);
  const aspect = chart.aspectChords[0];
  assert.deepEqual(chat.parseNatallyResponse(`[[chart:${aspect.name}]]An actual aspect.`, chart).chartCues,
    [{ offset: 0, targets: [aspect.name] }]);
});

test('focus advances by cleaned reply offsets and clear cues remove it', () => {
  assert.equal(typeof chat.chartFocusAt, 'function');
  const cues = [{ offset: 0, targets: ['Sun'] }, { offset: 12, targets: ['House 8'] }, { offset: 25, targets: [] }];
  assert.deepEqual(chat.chartFocusAt(cues, 11), ['Sun']);
  assert.deepEqual(chat.chartFocusAt(cues, 12), ['House 8']);
  assert.deepEqual(chat.chartFocusAt(cues, 26), []);
  assert.deepEqual(chat.parseNatallyResponse('[[chart:Sun]]Sun text.[[chart:clear]]', chart).chartCues,
    [{ offset: 0, targets: ['Sun'] }, { offset: 9, targets: [] }]);
  assert.deepEqual(chat.parseNatallyResponse('[[chart:Sun]]Sun text.  [[chart:clear]]', chart).chartCues,
    [{ offset: 0, targets: ['Sun'] }, { offset: 9, targets: [] }]);
});

test('saved cues reject another chart, invalid offsets and non-inventory targets', () => {
  assert.equal(typeof chat.validateChartCues, 'function');
  const parsed = chat.parseNatallyResponse('[[chart:House 4]]Home.', chart);
  assert.deepEqual(chat.validateChartCues(parsed.chartCues, parsed.text, parsed.chartFocusKey, chart), parsed.chartCues);
  const other = { ...chart, input: { ...chart.input, birthDate: '2001-01-01' } };
  assert.deepEqual(chat.validateChartCues(parsed.chartCues, parsed.text, parsed.chartFocusKey, other), []);
  assert.deepEqual(chat.validateChartCues([{ offset: -1, targets: ['Sun'] }], 'Home.', parsed.chartFocusKey, chart), []);
  assert.deepEqual(chat.validateChartCues([{ offset: 0, targets: ['#billing'] }], 'Home.', parsed.chartFocusKey, chart), []);
  assert.deepEqual(chat.validateChartCues([{ offset: 8, targets: ['Sun'] }], 'Home.', parsed.chartFocusKey, chart), []);
  assert.deepEqual(chat.validateChartCues([{ offset: 3, targets: ['Sun'] }, { offset: 0, targets: ['Moon'] }], 'Home.', parsed.chartFocusKey, chart), []);
});

test('presentation parsing bounds oversized cues and never treats provenance commands as body cues', () => {
  const result = chat.parseNatallyResponse('[[chart:Sun;Moon;Mercury;Venus;Mars;Jupiter;Saturn]]Too many targets.', chart);
  assert.deepEqual(result.chartCues, []);
  const many = chat.parseNatallyResponse('[[chart:Sun]]Sun. '.repeat(60), chart);
  assert.equal(many.chartCues?.length, 48);
  assert.doesNotMatch(many.text, /\[\[chart:/);
  const provenance = chat.parseNatallyResponse('[[chart:Sun]]Sun.\n---ASTROLOGICAL PROVENANCE---\nGeometry: [[chart:Moon]]Moon.', chart);
  assert.deepEqual(provenance.chartCues, [{ offset: 0, targets: ['Sun'] }]);
});
