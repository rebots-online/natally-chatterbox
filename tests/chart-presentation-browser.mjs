import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { chromium } from 'playwright';
import tailwindcss from '@tailwindcss/vite';
import { mkdir, writeFile } from 'node:fs/promises';

// Real React/chat/parser/Swiss Ephemeris/WebGL. Only hosted inference and
// speech callbacks are controlled, so no account, provider or voice download is needed.
const fixture = `
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import * as THREE from 'three';
import { NatallyChatbot } from '/src/components/NatallyChatbot.tsx';
import { Astrolabe3D } from '/src/components/Astrolabe3D.tsx';
import { calculateNatalChart } from '/src/services/ephemeris.ts';
import { generateAstrologicalReading } from '/src/services/readings.ts';
import '/src/index.css';
window.pending = []; window.probe = {}; window.session = true;
const originalUpdate = THREE.Object3D.prototype.updateMatrixWorld;
THREE.Object3D.prototype.updateMatrixWorld = function(force) {
  if (this.isScene) {
    const beads = [], chords = [], sectors = [];
    this.traverse(o => {
      if (o.name && o.material?.emissiveIntensity === 0.9) beads.push(o.name);
      if (o.name && o.geometry?.type === 'TubeGeometry') chords.push(o.name);
      if (o.name && o.geometry?.type === 'RingGeometry') sectors.push(o.name);
    });
    window.probe = { beads, chords, sectors };
  }
  return originalUpdate.call(this, force);
};
const initial = await calculateNatalChart({ name:'Synthetic chart focus', birthDate:'2000-01-01', birthTime:'00:00', placeName:'Greenwich', latitude:51.48, longitude:0, timezoneOffset:0, houseSystem:'W' });
window.initial = initial;
function Fixture() {
  const [chart, setChart] = useState(initial), [focus, setFocus] = useState([]), [manual] = useState(['Jupiter']);
  const [voice, setVoice] = useState(false), [visible, setVisible] = useState(true);
  const [external, setExternal] = useState(null);
  window.generateReading = async () => { const reading = await generateAstrologicalReading({type:'house', targetKey:'House 4', chart}); setExternal({...reading,content:reading.content,type:'reading'}); };
  window.changeChart = () => { setFocus([]); setChart({...initial, input:{...initial.input, birthDate:'2001-01-01'}}); };
  window.enableVoice = () => setVoice(true);
  window.unmountChat = () => { window.session = false; setFocus([]); setVisible(false); };
  return <><Astrolabe3D chart={chart} isSpinning={false} resetTrigger={0} selectedComponents={manual} highlightedComponents={focus}/>
    <output aria-label="Current chart focus" style={{position:'fixed',top:0,zIndex:100}}>{focus.join(';')}</output>
    <button style={{position:'fixed',top:30,zIndex:100}} onClick={() => setFocus([])}>Clear focus</button>
    {visible && <NatallyChatbot accountUid="focus-fixture" chart={chart} isCurrentSession={() => window.session}
      isOpen={true} isSignedIn={true} userLore={[]} onClose={() => {}} onOpen={() => {}} onSignIn={() => {}}
      onAddUserLore={() => {}} onUpdateVoiceSettings={() => {}} onSpeechStateChange={() => {}}
      onChartFocus={(targets, source) => { if (source === chart && window.session) setFocus(targets); }}
      externalReadingToInject={external} onClearExternalReading={() => setExternal(null)}
      voiceSettings={{readingAloud:voice,language:'en-US',rate:1,pitch:1,accentMode:'standard',ttsModel:'supertonic-onnx',aiVoiceName:'F4',kawaiiMode:'natural_companion',kawaiiIntensity:0,spriteMode:'docked'}}/>}</>;
}
createRoot(document.getElementById('root')).render(<Fixture/>);
`;
const server = await createServer({
  configFile: false, server: { host: '127.0.0.1', port: 0 },
  optimizeDeps: { include: ['react', 'react-dom/client', 'three'] },
  plugins: [tailwindcss(), { name: 'chart-presentation-fixture', enforce: 'pre',
    resolveId(id) { if (id === '/__chart-fixture.tsx') return id; },
    load(id) { if (id === '/__chart-fixture.tsx') return fixture; },
    transform(code, id) {
      if (id.split('?')[0].endsWith('/src/services/hostedInference.ts')) return code.replace(
        'export async function requestHostedInference(', 'async function originalRequestHostedInference(') +
        '\nexport async function requestHostedInference(payload: any) { return new Promise(resolve => window.pending.push({payload, resolve})); }';
      if (id.split('?')[0].endsWith('/src/services/voiceService.ts')) return code
        .replace('export async function speakNatallyText(', 'async function originalSpeakNatallyText(')
        .replace('export function stopSpeaking()', 'function originalStopSpeaking()') +
        '\nexport function stopSpeaking() { originalStopSpeaking(); const old=window.speech; window.speech=null; old?.end?.(); }' +
        '\nexport async function speakNatallyText(text:any, settings:any, start:any, end:any, word:any) { stopSpeaking(); window.speech={text,end,word}; start?.(); return true; }';
    },
    configureServer(vite) { vite.middlewares.use((req, res, next) => {
      if (req.url !== '/__chart-fixture') return next();
      res.setHeader('Content-Type', 'text/html');
      res.end('<!doctype html><div id="root"></div><script type="module" src="/__chart-fixture.tsx"></script>');
    }); },
  }],
});
let browser;
try {
  await server.listen();
  browser = await chromium.launch({ channel: process.env.NATALLY_TEST_BROWSER || 'chrome', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/__chart-fixture`);
  await page.getByLabel('Message Natally').waitFor();
  const send = async text => { await page.getByLabel('Message Natally').fill(text); await page.getByLabel('Send message', { exact: true }).click(); await page.waitForFunction(() => window.pending.length > 0); };
  const reply = text => page.evaluate(text => window.pending.shift().resolve({text, model:'controlled-model',source:'hosted'}), text);
  await send('Show the part of my chart you are explaining.');
  const payload = await page.evaluate(() => window.pending[0].payload);
  assert.match(payload.systemInstruction, /CHART PRESENTATION/);
  assert.match(payload.systemInstruction, /HOUSE OCCUPANCY/);
  await reply('[[chart:Sun]]Your Sun is here.\n\n[[chart:House 4]]These are your foundations.');
  await page.waitForFunction(() => window.probe.beads.includes('Sun'));
  assert.equal(await page.getByLabel('Current chart focus').textContent(), 'Sun');
  assert.ok((await page.evaluate(() => window.probe.beads)).includes('Jupiter'), 'manual selection remains');
  assert.doesNotMatch(await page.locator('.natally-chat-messages').innerText(), /\[\[chart:/);
  await page.getByRole('button', { name: 'Show House 4', exact: true }).click();
  const occupants = await page.evaluate(() => window.initial.natalBodies.filter(b => b.house === 4).map(b => b.name));
  await page.waitForFunction(occupants => window.probe.sectors.includes('House 4') && occupants.every(name => window.probe.beads.includes(name)), occupants);
  await mkdir('dist/verification', {recursive:true});
  await page.screenshot({path:'dist/verification/chart-presentation-desktop.png'});
  await page.getByRole('button', { name: 'Clear focus', exact: true }).click();
  await page.waitForFunction(() => window.probe.beads.length === 1 && window.probe.beads[0] === 'Jupiter');
  const aspect = await page.evaluate(() => window.initial.aspectChords[0].name);
  await send('Explain a calculated aspect.');
  await reply(`[[chart:${aspect}]]This is a calculated connection.`);
  await page.waitForFunction(name => window.probe.chords.includes(name), aspect);
  // Jupiter's manually selected chords may also be lit; the cue must not light
  // unrelated chords merely because they share an automatically focused endpoint.
  const extras = await page.evaluate(name => window.probe.chords.filter(chord => chord !== name && !window.initial.aspectChords.some(a => a.name === chord && (a.from === 'Jupiter' || a.to === 'Jupiter'))), aspect);
  assert.deepEqual(extras, []);
  await page.reload();
  await page.getByRole('button', {name:`Show ${aspect}`,exact:true}).click();
  await page.waitForFunction(name => window.probe.chords.includes(name), aspect);
  await page.evaluate(() => window.enableVoice());
  await send('Walk from the Sun to the Moon.');
  await reply('[[chart:Sun]]Sun first. [[chart:Moon]]Moon next. [[chart:clear]]Now reflect.');
  await page.waitForFunction(() => window.speech?.text.startsWith('Sun first.'));
  assert.equal(await page.evaluate(() => window.speech.text), 'Sun first. Moon next. Now reflect.');
  await page.evaluate(() => window.speech.word(11));
  await page.waitForFunction(() => window.probe.beads.includes('Moon') && !window.probe.beads.includes('Sun'));
  await page.evaluate(() => window.speech.word(22));
  await page.waitForFunction(() => window.probe.beads.length === 1);
  await page.evaluate(() => window.speech.end());
  assert.equal(await page.getByLabel('Current chart focus').textContent(), '');
  await page.evaluate(() => { void window.generateReading(); });
  await page.waitForFunction(() => window.pending.length > 0);
  await reply('[[chart:House 4]]A generated house reading.');
  await page.waitForFunction(() => window.speech?.text.includes('A generated house reading.'));
  const contentOffset = await page.evaluate(() => window.speech.text.indexOf('A generated'));
  await page.evaluate(offset => window.speech.word(offset), contentOffset);
  await page.waitForFunction(() => window.probe.sectors.includes('House 4'));
  await page.evaluate(() => window.speech.end());
  await send('A reply that will become stale.');
  await page.evaluate(() => window.changeChart());
  await reply('[[chart:Sun]]Stale chart response.');
  await page.waitForFunction(() => window.pending.length === 0);
  assert.equal(await page.getByText('Stale chart response.', { exact: true }).count(), 0);
  assert.equal(await page.getByRole('button', {name:'Show Sun',exact:true}).count(), 0, 'saved cues are invalidated for replacement charts');
  assert.deepEqual(errors, []);
  await page.setViewportSize({width:393,height:740});
  await send('An invalid target.');
  await reply('[[chart:#billing;Sun]]No arbitrary DOM writes.');
  await page.getByText('No arbitrary DOM writes.', {exact:true}).waitFor();
  assert.equal(await page.getByLabel('Current chart focus').textContent(), '');
  await send('A reply after sign out.');
  await page.evaluate(() => window.unmountChat());
  await reply('[[chart:Moon]]Late account response.');
  assert.equal(await page.getByLabel('Current chart focus').textContent(), '');
  assert.deepEqual(errors, []);
  const report = {checkedAt:new Date().toISOString(), passed:true, realWebGL:true, mutedFocus:true, houseOccupants:occupants, exactAspect:aspect,
    controlledSpeechBoundaryFocus:true, savedReplay:true, generatedReading:true, chartReplacement:true, accountInvalidation:true, mobileViewport:true, liveProvider:false, realAudio:false};
  await writeFile('dist/verification/chart-presentation-browser.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report));
} finally { await browser?.close(); await server.close(); }
