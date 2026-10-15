import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const origin = 'https://natally.surge.sh';
const release = process.env.SURGE_RELEASE;
assert.ok(release && /^\d+$/.test(release), 'Set SURGE_RELEASE to the published release number');
const root = path.resolve('dist');
const evidenceDirectory = path.join(root, 'verification');
await mkdir(evidenceDirectory, { recursive: true });
const walk = async directory => (await Promise.all((await readdir(directory, { withFileTypes: true })).map(async entry => {
  const filename = path.join(directory, entry.name);
  return entry.isDirectory() ? walk(filename) : [filename];
}))).flat();
const files = [path.join(root, 'index.html'), path.join(root, 'natally-mascot.webp'),
  ...(await Promise.all(['assets', 'fonts', 'tests', 'vendor'].map(name => walk(path.join(root, name))))).flat()];
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const assets = [];
for (const filename of files) {
  const relative = path.relative(root, filename).split(path.sep).join('/');
  const local = await readFile(filename);
  const response = await fetch(`${origin}/${relative}?release=${release}`, { signal: AbortSignal.timeout(90000) });
  assert.equal(response.status, 200, relative);
  const remote = Buffer.from(await response.arrayBuffer());
  assert.equal(sha256(remote), sha256(local), `Live bytes differ: ${relative}`);
  assets.push({ path: relative, bytes: local.length, sha256: sha256(local), status: response.status });
}
const appAsset = assets.find(asset => /^assets\/app-.*\.js$/.test(asset.path));
assert.ok(appAsset, 'Built application script must be present');
assert.match(await readFile(path.join(root, appAsset.path), 'utf8'), /CHART PRESENTATION/);
let browser;
const errors = [];
let browserResult;
try {
  browser = await chromium.launch({ channel: process.env.NATALLY_TEST_BROWSER || 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${origin}/?release=${release}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.getByRole('button', { name: /google/i }).waitFor({ timeout: 30000 });
  assert.equal(await page.locator('input[type="email"]').isVisible(), true);
  await page.screenshot({ path: path.join(evidenceDirectory, `surge-chart-presentation-${release}.png`) });
  browserResult = { googleSignInVisible: true, emailSignInVisible: true, pageErrors: errors };
  assert.deepEqual(errors, []);
} finally { await browser?.close(); }
const report = { checkedAt: new Date().toISOString(), origin, release, sourceCommit: process.env.RELEASE_SOURCE_COMMIT,
  assets, chartPresentationPromptIncluded: true, browser: browserResult,
  liveAuthenticatedChartInteractionVerified: false, realAudioAlignmentVerified: false, physicalAndroidVerified: false };
await writeFile(path.join(evidenceDirectory, `surge-chart-presentation-${release}.json`), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ passed: true, release, matchedFiles: assets.length, matchedBytes: assets.reduce((sum, asset) => sum + asset.bytes, 0), ...browserResult }));
