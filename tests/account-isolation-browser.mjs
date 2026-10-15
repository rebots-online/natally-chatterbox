import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { chromium } from 'playwright';

// Test-only middleware: never imported by the application or included in dist.
const fixture = `
import React from 'react';
import { createRoot } from 'react-dom/client';
import { NatallyChatbot } from '/src/components/NatallyChatbot.tsx';
const root = createRoot(document.getElementById('root'));
window.pending = [];
window.speechEvents = [];
window.currentUid = null;
let epoch = 0;
window.mountAccount = uid => {
  window.currentUid = uid;
  const generation = ++epoch;
  if (!uid) { root.render(null); return; }
  const chart = { input: { name: uid, birthDate: '1990-01-01', placeName: 'Test City' }, sunFormatted: 'Sun Test', ascFormatted: 'Asc Test', natalBodies: [], aspectChords: [], houses: [] };
  root.render(React.createElement(NatallyChatbot, {
    key: uid + generation, accountUid: uid, chart,
    isCurrentSession: () => epoch === generation && window.currentUid === uid,
    userLore: [], isOpen: true, isSignedIn: true,
    onClose() {}, onOpen() {}, onSignIn() {}, onAddUserLore() {}, onUpdateVoiceSettings() {},
    onSpeechStateChange: (...args) => window.speechEvents.push(args),
    voiceSettings: { readingAloud: false, language: 'en-US', rate: 1, pitch: 1, accentMode: 'standard', ttsModel: 'supertonic-onnx', aiVoiceName: 'F4', kawaiiMode: 'natural_companion', kawaiiIntensity: 0, spriteMode: 'docked' }
  }));
};
window.mountAccount('A');
`;
const server = await createServer({
  configFile: false,
  server: { host: '127.0.0.1', port: 0 },
  optimizeDeps: { include: ['react', 'react-dom/client'] },
  plugins: [{
    name: 'account-isolation-test-only', enforce: 'pre',
    resolveId(id) { if (id === '/__account-fixture.js') return id; },
    load(id) { if (id === '/__account-fixture.js') return fixture; },
    transform(code, id) {
      if (id.split('?')[0].endsWith('/src/services/natallyChat.ts')) {
        assert.match(code, /export async function askNatally\(/);
        return code.replace('export async function askNatally(', 'async function originalAskNatally(') +
          '\nexport async function askNatally(...args: any[]) { return new Promise(resolve => window.pending.push({ args, resolve })); }';
      }
    },
    configureServer(vite) {
      vite.middlewares.use((req, res, next) => {
        if (req.url === '/__account-fixture') {
          res.setHeader('Content-Type', 'text/html');
          res.end('<!doctype html><div id="root"></div><script type="module" src="/__account-fixture.js"></script>');
        } else next();
      });
    },
  }],
});
let browser;
try {
  await server.listen();
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', error => { errors.push(error.message); console.error(error.message); });
  page.on('console', message => { if (message.type() === 'error') console.error(message.text()); });
  page.on('dialog', dialog => dialog.accept());
  const base = 'astrosphere_natally_chat_history_v3';
  const legacy = JSON.stringify([{ id: 'legacy', sender: 'user', text: 'LEGACY_SECRET', timestamp: '12:00' }]);
  await page.addInitScript(({ base, legacy }) => { if (!localStorage.getItem(base)) localStorage.setItem(base, legacy); }, { base, legacy });
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/__account-fixture`);
  await page.getByLabel('Message Natally').waitFor();
  assert.equal(await page.getByText('LEGACY_SECRET', { exact: true }).count(), 0);
  const send = async text => { await page.getByLabel('Message Natally').fill(text); await page.getByLabel('Send message', { exact: true }).click(); };
  const mount = async uid => { await page.evaluate(uid => window.mountAccount(uid), uid); if (uid) await page.getByLabel('Message Natally').waitFor(); };
  await send('A private message');
  await page.waitForFunction(() => window.pending.length === 1);
  await mount(null);
  await page.waitForFunction(() => !document.querySelector('[aria-label="Message Natally"]'));
  await mount('B');
  assert.equal(await page.getByText('A private message', { exact: true }).count(), 0);
  const speechCount = await page.evaluate(() => window.speechEvents.length);
  await page.evaluate(() => window.pending[0].resolve({ text: 'A STALE SECRET', source: 'hosted', model: 'test' }));
  await page.waitForTimeout(100);
  assert.equal(await page.getByText('A STALE SECRET', { exact: true }).count(), 0);
  assert.equal(await page.evaluate(() => window.speechEvents.length), speechCount);
  await send('B private message');
  await page.waitForFunction(() => window.pending.length === 2);
  await page.evaluate(() => window.pending[1].resolve({ text: 'B answer', source: 'hosted', model: 'test' }));
  await page.getByText('B answer', { exact: true }).waitFor();
  await page.getByPlaceholder('Search conversation, topics, or lore...').fill('A private message');
  assert.equal(await page.getByText('A private message', { exact: true }).count(), 0);
  await page.getByPlaceholder('Search conversation, topics, or lore...').fill('');
  const storedB = await page.evaluate(base => localStorage.getItem(base + ':B'), base);
  assert.ok(storedB.includes('B private message'));
  assert.ok(!storedB.includes('A STALE SECRET') && !storedB.includes('A private message'));
  await mount('A');
  await page.getByText('A private message', { exact: true }).first().waitFor();
  assert.equal(await page.getByText('B private message', { exact: true }).count(), 0);
  assert.equal(await page.getByText('A STALE SECRET', { exact: true }).count(), 0);
  await page.reload();
  await page.getByText('A private message', { exact: true }).first().waitFor();
  await page.getByTitle('Clear Conversation History', { exact: true }).click();
  await page.waitForFunction(base => !localStorage.getItem(base + ':A').includes('A private message'), base);
  assert.equal(await page.evaluate(base => localStorage.getItem(base), base), legacy);
  assert.equal(await page.evaluate(base => localStorage.getItem(base + ':B'), base), storedB);
  await mount('B');
  await page.getByText('B private message', { exact: true }).first().waitFor();
  assert.deepEqual(errors, []);
  console.log('PASS actual NatallyChatbot: A→signed-out→B→A; legacy preservation; stale reply isolation; search; reload; account-local clear. Synthetic identities; inference stubbed; voice disabled.');
} finally {
  await browser?.close();
  await server.close();
}
