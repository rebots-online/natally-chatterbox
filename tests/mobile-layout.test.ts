import test from 'node:test';
import assert from 'node:assert/strict';
import { getChatViewportLayout, type ViewportBounds } from '../src/services/chatViewport';
import { bindTorusTouch, getTorusZoomDistance } from '../src/services/torusGestures';

const phone: ViewportBounds = { width: 393, height: 740, left: 0, top: 0, layoutWidth: 393 };
const savedPosition = { x: 930, y: 580 };
const savedSize = { width: 460, height: 600 };

test('phone chat fills the visible rectangle, not a saved desktop position', () => {
  assert.deepEqual(getChatViewportLayout(phone, savedPosition, savedSize, false), {
    left: 8, top: 8, width: 377, height: 724, mobile: true, compact: false,
  });
});

test('keyboard opening, panning, rotation and closing keep both edges visible', () => {
  for (const bounds of [phone, { ...phone, height: 310, top: 125 },
    { ...phone, width: 740, height: 240, layoutWidth: 740 }, phone]) {
    const rectangle = getChatViewportLayout(bounds, savedPosition, savedSize, false);
    assert.equal(rectangle.top, bounds.top + 8);
    assert.equal(rectangle.top + rectangle.height, bounds.top + bounds.height - 8);
    assert.equal(rectangle.left + rectangle.width, bounds.left + bounds.width - 8);
    assert.equal(rectangle.compact, bounds.height < 500);
  }
});

test('desktop keeps user dimensions and clamps offscreen saved coordinates', () => {
  const bounds = { width: 1200, height: 800, left: 0, top: 0, layoutWidth: 1200 };
  assert.deepEqual(getChatViewportLayout(bounds, savedPosition, savedSize, false), {
    left: 728, top: 188, width: 460, height: 600, mobile: false, compact: false,
  });
  const normal = getChatViewportLayout(bounds, { x: 80, y: 90 }, savedSize, false);
  assert.equal(normal.left, 80);
  assert.equal(normal.top, 90);
  const expanded = getChatViewportLayout(bounds, savedPosition, savedSize, true);
  assert.deepEqual([expanded.left, expanded.top, expanded.width, expanded.height], [12, 12, 1176, 776]);
});

test('small desktop visual viewport and corrupt saved geometry remain bounded', () => {
  for (const width of [320, 600, 1200]) {
    for (const height of [120, 280, 800]) {
      const bounds = { width, height, left: 45, top: 91, layoutWidth: 1200 };
      const rectangle = getChatViewportLayout(bounds, { x: NaN, y: Infinity },
        { width: NaN, height: -1 }, false);
      assert.ok(rectangle.left >= bounds.left);
      assert.ok(rectangle.top >= bounds.top);
      assert.ok(rectangle.left + rectangle.width <= bounds.left + bounds.width);
      assert.ok(rectangle.top + rectangle.height <= bounds.top + bounds.height);
    }
  }
});

function touchEvent(element: EventTarget, type: string, points: number[][]) {
  const event = new Event(type, { cancelable: true });
  Object.defineProperty(event, 'targetTouches', {
    value: points.map(([clientX, clientY]) => ({ clientX, clientY })),
  });
  element.dispatchEvent(event);
  return event;
}

function fixture() {
  const canvas = new EventTarget();
  const calls: Array<[string, ...number[]]> = [];
  let cameraDistance = 8;
  const binding = bindTorusTouch(canvas as HTMLElement, {
    start: (x, y) => calls.push(['start', x, y]),
    move: (x, y) => calls.push(['move', x, y]),
    end: () => calls.push(['end']),
    zoom: (factor) => {
      cameraDistance = getTorusZoomDistance(cameraDistance, factor);
      calls.push(['zoom', factor]);
    },
  });
  return { canvas, calls, binding, distance: () => cameraDistance };
}

test('real gesture binding spreads to enlarge and pinches to shrink within bounds', () => {
  const { canvas, binding, distance } = fixture();
  assert.equal(touchEvent(canvas, 'touchstart', [[0, 0], [100, 0]]).defaultPrevented, true);
  assert.equal(touchEvent(canvas, 'touchmove', [[0, 0], [200, 0]]).defaultPrevented, true);
  assert.equal(distance(), 4);
  touchEvent(canvas, 'touchmove', [[0, 0], [50, 0]]);
  assert.equal(distance(), 13);
  touchEvent(canvas, 'touchend', []);
  assert.equal(binding.suppressClick(), true);
  binding.dispose();
});

test('one-two-one transitions reset rotation baseline without accidental selection', () => {
  const { canvas, calls, binding } = fixture();
  touchEvent(canvas, 'touchstart', [[10, 20]]);
  touchEvent(canvas, 'touchmove', [[20, 25]]);
  assert.deepEqual(calls.at(-1), ['move', 20, 25]);
  touchEvent(canvas, 'touchstart', [[20, 25], [120, 25]]);
  touchEvent(canvas, 'touchmove', [[20, 25], [220, 25]]);
  assert.deepEqual(calls.at(-1), ['zoom', 0.5]);
  touchEvent(canvas, 'touchend', [[220, 25]]);
  assert.deepEqual(calls.at(-1), ['start', 220, 25]);
  touchEvent(canvas, 'touchend', []);
  assert.equal(binding.suppressClick(), true);
  touchEvent(canvas, 'touchstart', [[40, 30]]);
  touchEvent(canvas, 'touchend', []);
  assert.equal(binding.suppressClick(), false);
  binding.dispose();
});

test('three fingers suspend gestures; cancel clears state and disposal removes listeners', () => {
  const { canvas, calls, binding } = fixture();
  touchEvent(canvas, 'touchstart', [[0, 0], [100, 0], [200, 0]]);
  const count = calls.length;
  touchEvent(canvas, 'touchmove', [[0, 0], [110, 0], [250, 0]]);
  assert.equal(calls.length, count);
  touchEvent(canvas, 'touchend', [[0, 0], [110, 0]]);
  touchEvent(canvas, 'touchmove', [[0, 0], [220, 0]]);
  assert.deepEqual(calls.at(-1), ['zoom', 0.5]);
  touchEvent(canvas, 'touchcancel', []);
  assert.deepEqual(calls.at(-1), ['end']);
  const afterCancel = calls.length;
  touchEvent(canvas, 'touchmove', [[90, 90]]);
  assert.equal(calls.length, afterCancel);
  binding.dispose();
  const afterDispose = calls.length;
  touchEvent(canvas, 'touchstart', [[10, 20]]);
  touchEvent(canvas, 'touchmove', [[20, 20]]);
  assert.equal(calls.length, afterDispose);
});

test('panel gestures do not reach canvas; coincident fingers never create invalid zoom', () => {
  const { canvas, calls, binding, distance } = fixture();
  const panel = new EventTarget();
  const event = touchEvent(panel, 'touchmove', [[1, 2], [100, 200]]);
  assert.equal(event.defaultPrevented, false);
  assert.equal(calls.length, 0);
  touchEvent(canvas, 'touchstart', [[0, 0], [0, 0]]);
  touchEvent(canvas, 'touchmove', [[0, 0], [0, 0]]);
  touchEvent(canvas, 'touchmove', [[0, 0], [100, 0]]);
  assert.equal(distance(), 8);
  binding.dispose();
});

test('camera distance validation and repeated zoom retain finite limits', () => {
  assert.equal(getTorusZoomDistance(8, 0.5), 4);
  assert.equal(getTorusZoomDistance(8, 2), 13);
  for (const factor of [NaN, Infinity, 0, -1]) assert.equal(getTorusZoomDistance(8, factor), 8);
  assert.ok(Number.isFinite(getTorusZoomDistance(NaN, 1)));
  assert.equal(getTorusZoomDistance(13, 0.5), 6.5);
});

test('only a completed one-finger rotation releases momentum', () => {
  const canvas = new EventTarget();
  const endings: boolean[] = [];
  const binding = bindTorusTouch(canvas as HTMLElement, {
    start() {}, move() {}, zoom() {},
    end: (allowMomentum: boolean) => endings.push(allowMomentum),
  });
  touchEvent(canvas, 'touchstart', [[10, 10]]);
  touchEvent(canvas, 'touchmove', [[80, 20]]);
  touchEvent(canvas, 'touchend', []);
  assert.equal(endings.at(-1), true, 'normal rotation release must coast');
  touchEvent(canvas, 'touchstart', [[10, 10]]);
  touchEvent(canvas, 'touchend', []);
  assert.equal(endings.at(-1), false, 'a tap must not launch momentum');
  touchEvent(canvas, 'touchstart', [[10, 10]]);
  touchEvent(canvas, 'touchmove', [[80, 20]]);
  touchEvent(canvas, 'touchstart', [[80, 20], [180, 20]]);
  assert.equal(endings.at(-1), false, 'pinch interrupts the rotation');
  touchEvent(canvas, 'touchend', []);
  assert.equal(endings.at(-1), false, 'pinch release must not fling');
  touchEvent(canvas, 'touchstart', [[10, 10]]);
  touchEvent(canvas, 'touchmove', [[80, 20]]);
  touchEvent(canvas, 'touchcancel', []);
  assert.equal(endings.at(-1), false);
  binding.dispose();
  assert.equal(endings.at(-1), false);
});

test('compatibility mouse events after a touch cannot interrupt its momentum', () => {
  const { canvas, binding } = fixture();
  assert.equal(binding.suppressMouse(), false);
  touchEvent(canvas, 'touchstart', [[10, 10]]);
  assert.equal(binding.suppressMouse(), true);
  touchEvent(canvas, 'touchmove', [[90, 10]]);
  touchEvent(canvas, 'touchend', []);
  assert.equal(binding.suppressMouse(), true);
  // Click suppression stays separate so a deliberate tap can select a placement.
  touchEvent(canvas, 'touchstart', [[10, 10]]);
  touchEvent(canvas, 'touchend', []);
  assert.equal(binding.suppressClick(), false);
  assert.equal(binding.suppressMouse(), true);
  binding.dispose();
});
