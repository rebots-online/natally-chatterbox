import { readFile, writeFile } from 'node:fs/promises';
import { randomUUID, randomBytes } from 'node:crypto';
import { calculateNatalChart } from '../src/services/ephemeris.ts';
import { createCalculationSession } from '../src/services/calculationTools.ts';
import { NATALLY_SYSTEM_PROMPT, buildStructuredNatalContext } from '../src/services/natallyChat.ts';
import { completeHosted } from '../src/services/hostedInference.ts';

const config = JSON.parse(await readFile('firebase-applet-config.json', 'utf8'));
const endpoint = 'https://natally-hosted-chat.netlify.app/.netlify/functions/chat';
const originalFetch = globalThis.fetch;
const calls = [];
const diagnostics = [];
globalThis.fetch = async (url, init = {}) => {
  const response = await originalFetch(url, { ...init, headers: { ...init.headers, Origin: 'https://natally.surge.sh' } });
  if (url === endpoint && !response.ok) {
    const body = await response.clone().json();
    diagnostics.push({ status: response.status, error: body.error, calculationDiagnostic: body.calculationDiagnostic });
  }
  return response;
};
const identity = async (action, body) => {
  const response = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:' + action + '?key=' + config.apiKey,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error('Identity ' + action + ' HTTP ' + response.status);
  return response.json();
};
let token;
let result;
let failure;
try {
  const signup = await identity('signUp', { email: 'natally-tools-' + randomUUID() + '@example.test', password: randomBytes(32).toString('base64url'), returnSecureToken: true });
  token = signup.idToken;
  const chart = await calculateNatalChart({ name: 'Synthetic A', birthDate: '2000-01-01', birthTime: '00:00', placeName: 'Greenwich', latitude: 51.48, longitude: 0, timezoneOffset: 0, houseSystem: 'W' });
  const session = createCalculationSession(chart);
  result = await completeHosted({
    prompt: 'Use your calculation tools to compare me with my friend Alex, born May 15 1992 in Toronto Canada; Alex explicitly does not know the birth time. Then examine my transits on April 10 2027 at 12:00 UTC. Explain two calculated cross-chart aspects and two calculated transits, including their orbs, under 350 words. Do not assume romance.',
    systemInstruction: NATALLY_SYSTEM_PROMPT + '\n' + buildStructuredNatalContext(chart, []) + '\n' + session.context(),
    history: [{ role: 'assistant', content: 'I do not have live ephemeris loaded in this conversation.' }],
  }, token, endpoint, async (name, args) => {
    const output = await session.execute(name, args);
    const data = JSON.parse(output);
    calls.push({ name, args: JSON.parse(args), result: data });
    console.log('calculation', JSON.parse(args).operation, 'ok:', data.ok);
    return output;
  });
  const operations = calls.map(call => call.args.operation);
  if (!['lookup_place', 'natal', 'synastry', 'transits'].every(operation => operations.includes(operation))) throw new Error('Model did not complete required chain: ' + operations.join(','));
  if (calls.some(call => !call.result.ok)) throw new Error('One or more calculation calls failed.');
  console.log(JSON.stringify({ model: result.model, operations, text: result.text }));
} catch (error) {
  failure = error.message;
  process.exitCode = 1;
  console.log(JSON.stringify({ failure, diagnostics }));
} finally {
  if (token) { await identity('delete', { idToken: token }); console.log('Disposable verification account deleted.'); }
  globalThis.fetch = originalFetch;
  await writeFile('DOCS/verification/hosted-calculation-chain-' + Date.now() + '.json', JSON.stringify({
    recordedAt: new Date().toISOString(), runtime: 'Hosted model + Firebase; local Node Swiss WASM; NOT browser UI', result, failure, diagnostics, calls,
  }, null, 2) + '\n');
}
