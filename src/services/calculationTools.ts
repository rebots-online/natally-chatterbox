import { calculateNatalChart, type NatalChartResult } from './ephemeris';
import { loadGazetteer, tzOffsetHours } from './gazetteer';
import { buildCurrentSkyContext, resolveObservationMoment } from './transits';
import { buildStructuredNatalContext, buildSynastryContext } from './natallyChat';

export function createCalculationSession(primary: NatalChartResult, partner?: NatalChartResult | null) {
  const charts = new Map<string, NatalChartResult>([['primary', primary]]);
  if (partner) charts.set('partner', partner);
  const chart = (id: unknown) => {
    const found = typeof id === 'string' ? charts.get(id) : undefined;
    if (!found) throw new Error('Unknown chartId. Use an available chart or calculate natal first.');
    return found;
  };
  return {
    context: () => `Calculation clock UTC: ${new Date().toISOString()}. Available chart IDs: ${JSON.stringify([...charts].map(([id, value]) => ({ id, name: value.input.name, date: value.input.birthDate, place: value.input.placeName })))}.`,
    async execute(name: string, raw: string): Promise<string> {
      try {
        if (name !== 'calculate_astrology') throw new Error('Unknown calculation tool.');
        const args = JSON.parse(raw);
        const allowed = ['operation', 'query', 'name', 'date', 'time', 'placeId', 'chartId', 'otherChartId', 'at'];
        if (!args || Array.isArray(args) || typeof args !== 'object' || Object.entries(args).some(([key, value]) => !allowed.includes(key) || typeof value !== 'string' || value.length > 200)) throw new Error('Invalid calculation arguments.');
        if (args.operation === 'lookup_place') {
          if (!args.query?.trim()) throw new Error('Supply a birthplace query.');
          const query = args.query.trim().toLowerCase();
          const places = loadGazetteer().filter(place => `${place.name} ${place.countryCode}`.toLowerCase().includes(query)).slice(0, 8);
          return JSON.stringify({ ok: true, operation: args.operation, places, note: places.length ? 'Resolve ambiguous matches with the user before natal calculation.' : 'No match in local gazetteer. Ask for another supported city; do not invent coordinates or a place ID.' });
        }
        if (args.operation === 'natal') {
          if (!args.name?.trim() || !args.date || !args.time || !args.placeId) throw new Error('Natal requires name, date, time (HH:mm or explicitly unknown), and looked-up placeId. Ask only for missing details.');
          const place = loadGazetteer().find(place => place.id === args.placeId);
          if (!place) throw new Error('Unknown placeId. Call lookup_place first.');
          const unknown = args.time === 'unknown';
          const time = unknown ? '12:00' : args.time;
          resolveObservationMoment(args.date, time, 0);
          if (Number(args.date.slice(0, 4)) < 1800 || Number(args.date.slice(0, 4)) > 2399) throw new Error('Supported chart years are 1800–2399.');
          if (charts.size >= 8) throw new Error('Eight-chart session limit reached. Start a new chart session.');
          const result = await calculateNatalChart({ name: args.name, birthDate: args.date, birthTime: time,
            placeName: `${place.name}, ${place.countryCode}`, latitude: place.lat, longitude: place.lon,
            timezoneOffset: tzOffsetHours(place.tzid, args.date, time), houseSystem: unknown ? 'W' : 'P', birthTimeUnknown: unknown });
          const chartId = 'chart-' + charts.size;
          charts.set(chartId, result);
          return JSON.stringify({ ok: true, operation: args.operation, chartId, facts: buildStructuredNatalContext(result, []) });
        }
        if (args.operation === 'transits') {
          if (!args.at || (args.at !== 'now' && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(args.at))) throw new Error('Supply at: now or an explicit UTC timestamp ending Z.');
          const at = args.at === 'now' ? new Date() : new Date(args.at);
          if (!Number.isFinite(at.getTime()) || at.getUTCFullYear() < 1800 || at.getUTCFullYear() > 2399 || (args.at !== 'now' && at.toISOString().slice(0, 19) !== args.at.slice(0, 19))) throw new Error('Invalid or unsupported observation timestamp.');
          return JSON.stringify({ ok: true, operation: args.operation, chartId: args.chartId, facts: await buildCurrentSkyContext(chart(args.chartId), at) });
        }
        if (args.operation === 'synastry') return JSON.stringify({ ok: true, operation: args.operation,
          facts: buildSynastryContext(chart(args.chartId), chart(args.otherChartId)) });
        throw new Error('Unsupported calculation operation.');
      } catch (error) {
        return JSON.stringify({ ok: false, error: error instanceof Error ? error.message : 'Calculation failed. Ask for corrected inputs; do not invent results.' });
      }
    },
  };
}
