import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { hostname } from 'node:os';

const browser = await chromium.launch({ headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage();
const failures = [];
page.on('pageerror', error => failures.push(error.message));
try {
  await page.goto(process.env.VOICE_URL || 'http://127.0.0.1:5179/tests/voice-browser.html');
  console.log('Real voice page loaded');
  const device = await page.evaluate(() => {
    window.voiceRun = { requests: [], completions: [], starts: [], ends: [], errors: [] };
    const NativeWorker = window.Worker;
    window.Worker = class extends NativeWorker {
      constructor(...args) {
        super(...args);
        const post = this.postMessage.bind(this);
        this.postMessage = (data, ...rest) => {
          if (data.text) window.voiceRun.requests.push({ id: data.id, text: data.text, at: performance.now() });
          return post(data, ...rest);
        };
        this.addEventListener('message', ({ data }) => {
          if (data.error) window.voiceRun.errors.push(data.error);
          if (data.samples) window.voiceRun.completions.push({
            id: data.id, at: performance.now(), samples: data.samples.length, sampleRate: data.sampleRate,
            backend: data.backend, generationMs: data.generationMs, clipReuse: data.clipReuse,
            finite: data.samples.every(Number.isFinite),
          });
        });
      }
    };
    const original = AudioContext.prototype.createBufferSource;
    AudioContext.prototype.createBufferSource = function(...args) {
      const source = original.apply(this, args);
      const start = source.start.bind(source);
      source.start = (...args) => {
        window.voiceRun.starts.push({ at: performance.now(), duration: source.buffer.duration, pitch: source.playbackRate.value });
        return start(...args);
      };
      source.addEventListener('ended', () => window.voiceRun.ends.push(performance.now()));
      return source;
    };
    document.querySelector('#resource').value = 'gentle';
    document.querySelector('#sample').value = 'Okay, that tracks. You want closeness, but you also need room to breathe. We can take both seriously without turning your whole life into a project. Honestly, that is a lot to hold at once. Let us start with one small next step, then give the rest a little space. This is the final sentence, and these are the final words.';
    return { title: document.title, cores: navigator.hardwareConcurrency, memory: navigator.deviceMemory };
  });
  const text = await page.locator('#sample').inputValue();
  await page.locator('#speak').click();
  console.log('Requested gentle playback with actual model');
  await page.waitForFunction(() => /completed successfully|Stopped or failed/.test(document.querySelector('#playback').textContent), null, { timeout: 300000 });
  const gentle = await page.evaluate(() => ({ ...window.voiceRun, result: document.querySelector('#playback').textContent, status: document.querySelector('#status').textContent }));
  assert.equal(gentle.result, 'Local playback completed successfully', JSON.stringify(gentle.errors));
  assert.equal(gentle.requests.map(entry => entry.text).join(' '), text);
  assert.equal(gentle.starts.length, gentle.requests.length);
  assert.equal(gentle.ends.length, gentle.requests.length);
  assert.ok(gentle.completions.every(entry => entry.finite && entry.samples > 0));
  for (let i = 1; i < gentle.requests.length; i++) assert.ok(gentle.requests[i].at >= gentle.ends[i-1], 'Gentle inference overlaps playback');
  console.log('Gentle real playback passed: ' + JSON.stringify(gentle.completions));
  await page.evaluate(() => {
    window.voiceRun = { requests: [], completions: [], starts: [], ends: [], errors: [] };
    document.querySelector('#resource').value = 'auto';
    document.querySelector('#tone').value = 'warm';
    document.querySelector('#sample').value = 'Your Moon and your rising sign can want different things. That does not make you inconsistent. It gives us something useful to explore. We can look at what feels safe, and what helps you feel seen. No need to solve everything tonight. The last words of this reading are still here.';
  });
  const autoText = await page.locator('#sample').inputValue();
  await page.locator('#speak').click();
  await page.waitForFunction(() => /completed successfully|Stopped or failed/.test(document.querySelector('#playback').textContent), null, { timeout: 300000 });
  const auto = await page.evaluate(() => ({ ...window.voiceRun, result: document.querySelector('#playback').textContent }));
  assert.equal(auto.result, 'Local playback completed successfully', JSON.stringify(auto.errors));
  assert.equal(auto.requests.map(entry => entry.text).join(' '), autoText);
  assert.equal(auto.starts.length, auto.requests.length);
  assert.equal(auto.ends.length, auto.requests.length);
  assert.ok(auto.completions.every(entry => entry.finite && entry.samples > 0));
  assert.equal(failures.length, 0, failures.join('\n'));
  const report = { recordedAt: new Date().toISOString(), url: page.url(), host: hostname(), device, runtime: 'Playwright Chromium; real pinned Supertonic; no synthetic speech', limits: 'Playback lifecycle and PCM validity; not listening or physical Android acceptance', gentle, auto, failures };
  await writeFile('DOCS/verification/adaptive-speech-browser.json', JSON.stringify(report, null, 2) + '\n');
  console.log('Auto real playback passed; report saved');
} finally { await browser.close(); }

