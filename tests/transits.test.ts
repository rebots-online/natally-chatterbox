import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateTransitAspects, buildCurrentSkyContext, resolveObservationMoment, requestCurrentLocation } from '../src/services/transits';
import { calculateNatalChart } from '../src/services/ephemeris';

test('transit aspects wrap around zero and enforce the three-degree orb', () => {
  const natal = [{ name: 'Sun', lon: 359 }];
  assert.deepEqual(calculateTransitAspects(natal, [{ name: 'Moon', lon: 1 }]),
    [{ transit: 'Moon', natal: 'Sun', type: 'Conjunction', orb: 2 }]);
  assert.equal(calculateTransitAspects(natal, [{ name: 'Moon', lon: 3 }]).length, 0);
  assert.equal(calculateTransitAspects([{ name: 'Sun', lon: 0 }], [{ name: 'Saturn', lon: 180 }])[0].type, 'Opposition');
  assert.throws(() => calculateTransitAspects(natal, [{ name: 'Moon', lon: NaN }]));
});

test('observation timestamp handles offsets, midnight and invalid calendar dates', () => {
  assert.equal(resolveObservationMoment('2026-10-12', '00:00', -4).toISOString(), '2026-10-12T04:00:00.000Z');
  assert.equal(resolveObservationMoment('2026-10-12', '00:00', 5.5).toISOString(), '2026-10-11T18:30:00.000Z');
  assert.throws(() => resolveObservationMoment('2026-02-30', '12:00', 0));
  assert.throws(() => resolveObservationMoment('2026-10-12', '12:00'));
});

test('real Swiss runtime preserves natal midnight and computes a separately dated current sky', async () => {
  const chart = await calculateNatalChart({ name: 'Synthetic test', birthDate: '2000-01-01', birthTime: '00:00',
    placeName: 'Greenwich', latitude: 51.48, longitude: 0, timezoneOffset: 0, houseSystem: 'W',
    currentLocationName: 'Toronto, CA', currentTimezoneId: 'America/Toronto' });
  assert.equal(chart.julianDayUT, 2451544.5);
  const now = new Date('2026-10-12T06:00:00Z');
  const context = await buildCurrentSkyContext(chart, now);
  assert.match(context, /2026-10-12T06:00:00.000Z/);
  assert.match(context, /Toronto, CA/);
  assert.match(context, /America\/Toronto/);
  assert.match(context, /Sun: .*Libra/);
  assert.match(context, /TRANSIT-TO-NATAL ASPECTS/);
  const later = await buildCurrentSkyContext(chart, new Date('2026-11-12T06:00:00Z'));
  assert.match(later, /Sun: .*Scorpio/);
  const unknown = await buildCurrentSkyContext({ ...chart, input: { ...chart.input, birthTimeUnknown: true } }, now);
  assert.match(unknown, /Birth time unknown/);
  assert.doesNotMatch(unknown, /natal Moon, orb/);
});

test('location requests are coarse and permission failure supports manual fallback', async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  try {
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { geolocation: {
      getCurrentPosition(success: any, _failure: any, options: any) {
        assert.equal(options.enableHighAccuracy, false);
        assert.equal(options.timeout, 10000);
        success({ coords: { latitude: 43.653256, longitude: -79.383184 } });
      },
    } } });
    const location = await requestCurrentLocation();
    assert.equal(location.latitude, 43.65);
    assert.equal(location.longitude, -79.38);
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { geolocation: {
      getCurrentPosition(_success: any, failure: any) { failure({ code: 1 }); },
    } } });
    await assert.rejects(requestCurrentLocation(), /Choose a city manually or skip/);
  } finally {
    if (original) Object.defineProperty(globalThis, 'navigator', original);
    else Reflect.deleteProperty(globalThis, 'navigator');
  }
});
