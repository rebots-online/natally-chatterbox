import assert from 'node:assert/strict';
import { chromium } from 'playwright';

// Start the existing Vite dev server first. No account or model access required.
const base = process.env.NATALLY_TEST_URL || 'http://127.0.0.1:3000';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const evidence = {};
try {
  const page = await browser.newPage({ viewport: { width: 393, height: 740 }, hasTouch: true, isMobile: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base + '/tests/torus-browser.html');
  await page.waitForFunction(() => window.torusProbe?.ready && window.torusProbe.frame > 2);
  const sample = () => page.evaluate(() => ({ ...window.torusProbe }));
  const frames = async (count) => {
    const before = await sample();
    await page.waitForFunction(frame => window.torusProbe.frame >= frame, before.frame + count);
    return sample();
  };
  const cdp = await page.context().newCDPSession(page);
  const touch = (type, points) => cdp.send('Input.dispatchTouchEvent', {
    type, touchPoints: points.map(([x, y], id) => ({ x, y, id })),
  });
  await touch('touchStart', [[40, 650]]);
  for (const x of [100, 160, 220]) {
    await frames(2);
    await touch('touchMove', [[x, 650]]);
  }
  const dragging = await sample();
  await touch('touchEnd', []);
  const released = await frames(4);
  const coasting = await frames(4);
  assert.ok(released.y - dragging.y > 0.01, 'touch release should continue rotating');
  assert.ok(coasting.y - released.y > 0.01, 'touch release should retain decaying momentum');
  evidence.mobile = { releaseDelta: released.y - dragging.y, coastDelta: coasting.y - released.y };

  // A pinch interrupts the coast and never launches rotation on release.
  await touch('touchStart', [[60, 650], [180, 650]]);
  const pinching = await frames(2);
  await touch('touchMove', [[30, 650], [210, 650]]);
  const zoomed = await frames(2);
  assert.ok(zoomed.distance < pinching.distance, 'spreading fingers should zoom in');
  await touch('touchEnd', []);
  const afterPinch = await frames(4);
  const stopped = await frames(4);
  assert.ok(Math.abs(stopped.y - afterPinch.y) < 1e-8, 'pinch release must not rotate');
  assert.equal(stopped.selections, 0, 'gesture compatibility clicks must not select a placement');
  evidence.pinch = { distanceBefore: pinching.distance, distanceAfter: zoomed.distance, rotationAfterRelease: stopped.y - afterPinch.y };
  assert.deepEqual(errors, []);
  await page.close();

  const desktop = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  await desktop.goto(base + '/tests/torus-browser.html');
  await desktop.waitForFunction(() => window.torusProbe?.ready && window.torusProbe.frame > 2);
  await desktop.mouse.move(40, 720);
  await desktop.mouse.down();
  for (const x of [100, 160, 220]) {
    const frame = await desktop.evaluate(() => window.torusProbe.frame);
    await desktop.waitForFunction(value => window.torusProbe.frame >= value + 2, frame);
    await desktop.mouse.move(x, 720);
  }
  await desktop.mouse.up();
  const first = await desktop.evaluate(() => ({ ...window.torusProbe }));
  await desktop.waitForFunction(frame => window.torusProbe.frame >= frame + 4, first.frame);
  const second = await desktop.evaluate(() => ({ ...window.torusProbe }));
  assert.ok(second.y - first.y > 0.01, 'desktop release should still coast');
  evidence.desktop = { coastDelta: second.y - first.y };
  await desktop.close();
  console.log(JSON.stringify({ passed: true, ...evidence, physicalAndroidVerified: false }, null, 2));
} finally {
  await browser.close();
}
