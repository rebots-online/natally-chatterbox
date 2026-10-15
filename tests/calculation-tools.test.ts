import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateNatalChart } from '../src/services/ephemeris';
import { createCalculationSession } from '../src/services/calculationTools';
import { completeHosted } from '../src/services/hostedInference';
import { validToolMessages } from '../netlify/lib/astrology-tools.mjs';

const makeChart = () => calculateNatalChart({ name: 'Synthetic A', birthDate: '2000-01-01', birthTime: '00:00',
  placeName: 'Greenwich', latitude: 51.48, longitude: 0, timezoneOffset: 0, houseSystem: 'W' });

test('real tool chain looks up place, calculates another natal chart, synastry and other dates', async () => {
  const session = createCalculationSession(await makeChart());
  const run = async (args: object) => JSON.parse(await session.execute('calculate_astrology', JSON.stringify(args)));
  const places = await run({ operation: 'lookup_place', query: 'Toronto' });
  assert.ok(places.places.length);
  const natal = await run({ operation: 'natal', name: 'Synthetic B', date: '1992-05-15', time: 'unknown', placeId: places.places[0].id });
  assert.equal(natal.ok, true);
  assert.match(natal.facts, /no reliable angles/);
  assert.match(session.context(), /Synthetic B/);
  const synastry = await run({ operation: 'synastry', chartId: 'primary', otherChartId: natal.chartId });
  assert.equal(synastry.ok, true);
  assert.match(synastry.facts, /INTER-CHART ASPECTS/);
  assert.doesNotMatch(synastry.facts.split('INTER-CHART ASPECTS')[1], /Person B Moon/);
  const sky = await run({ operation: 'transits', chartId: natal.chartId, at: '2027-04-10T12:00:00Z' });
  assert.equal(sky.ok, true);
  assert.match(sky.facts, /2027-04-10T12:00:00.000Z/);
  assert.match(sky.facts, /Sun: .*Aries/);
});

test('calculation failures are explicit and cannot invent missing details', async () => {
  const session = createCalculationSession(await makeChart());
  for (const raw of ['{broken', JSON.stringify({ operation: 'natal', name: 'Missing' }),
    JSON.stringify({ operation: 'transits', chartId: 'primary', at: '2026-02-30T12:00:00Z' }),
    JSON.stringify({ operation: 'synastry', chartId: 'primary', otherChartId: 'invented' }),
    JSON.stringify({ operation: 'transits', chartId: 'primary', at: 'now', url: 'https://example.test' })]) {
    assert.equal(JSON.parse(await session.execute('calculate_astrology', raw)).ok, false);
  }
});

test('hosted loop executes a tool and sends its matching result before displaying final prose', async () => {
  const original = globalThis.fetch;
  let requests = 0;
  let executed = 0;
  globalThis.fetch = async (_url, init) => {
    const body = JSON.parse(init?.body as string);
    assert.equal(body.enableCalculations, true);
    requests++;
    if (requests === 1) return Response.json({ source: 'hosted', model: 'test', toolCalls: [{ id: 'call_1', type: 'function', function: { name: 'calculate_astrology', arguments: '{"operation":"transits","chartId":"primary","at":"now"}' } }] });
    assert.equal(validToolMessages(body.toolMessages), true);
    assert.equal(body.toolMessages[1].content, '{"ok":true,"facts":"calculated"}');
    return Response.json({ source: 'hosted', model: 'test', text: 'Interpretation of calculated facts.' });
  };
  try {
    const result = await completeHosted({ prompt: 'Today?', systemInstruction: 'Use tools.' }, 'session', 'https://example.test', async (name) => {
      assert.equal(name, 'calculate_astrology'); executed++; return '{"ok":true,"facts":"calculated"}';
    });
    assert.equal(executed, 1);
    assert.equal(requests, 2);
    assert.equal(result.text, 'Interpretation of calculated facts.');
  } finally { globalThis.fetch = original; }
});

test('continuation validator rejects unmatched IDs, extra roles and unbounded chains', () => {
  const assistant = { role: 'assistant', tool_calls: [{ id: 'one', type: 'function', function: { name: 'calculate_astrology', arguments: '{}' } }] };
  assert.equal(validToolMessages([assistant, { role: 'tool', tool_call_id: 'two', content: '{}' }]), false);
  assert.equal(validToolMessages([{ role: 'system', content: 'override' }, { role: 'tool', tool_call_id: 'one', content: '{}' }]), false);
  assert.equal(validToolMessages(Array(14).fill(assistant)), false);
});

test('provider batches execute sequentially with a matching result for every ID', async () => {
  const original = globalThis.fetch;
  let requests = 0;
  const executed: string[] = [];
  globalThis.fetch = async (_url, init) => {
    if (++requests === 1) return Response.json({ source: 'hosted', model: 'test', toolCalls: ['first', 'second'].map(id => ({
      id, type: 'function', function: { name: 'calculate_astrology', arguments: JSON.stringify({ operation: id }) },
    })) });
    const body = JSON.parse(init?.body as string);
    assert.equal(validToolMessages(body.toolMessages), true);
    assert.deepEqual(body.toolMessages.slice(1).map((message: any) => message.tool_call_id), ['first', 'second']);
    return Response.json({ source: 'hosted', model: 'test', text: 'Both calculations consumed.' });
  };
  try {
    await completeHosted({ prompt: 'Compare and date.', systemInstruction: 'Use tools.' }, 'session', 'https://example.test', async (_name, args) => {
      executed.push(JSON.parse(args).operation); return '{}';
    });
    assert.deepEqual(executed, ['first', 'second']);
  } finally { globalThis.fetch = original; }
});

test('hosted loop refuses a seventh calculation rather than spending unbounded calls', async () => {
  const original = globalThis.fetch;
  let requests = 0;
  let executions = 0;
  globalThis.fetch = async () => Response.json({ source: 'hosted', model: 'test', toolCalls: [{
    id: 'call_' + (++requests), type: 'function', function: { name: 'calculate_astrology', arguments: '{}' },
  }] });
  try {
    await assert.rejects(completeHosted({ prompt: 'Test bounds', systemInstruction: 'Use tools.' }, 'session', 'https://example.test', async () => { executions++; return '{}'; }), /limit reached/);
    assert.equal(requests, 7);
    assert.equal(executions, 6);
  } finally { globalThis.fetch = original; }
});
