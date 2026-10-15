import { accountStorageKey } from './accountStorage';

export interface CityLocation {
  name: string;
  country: string;
  adminRegion?: string;
  latitude: number;
  longitude: number;
  timezoneOffset: number; // Standard UTC offset in hours
  label: string;
}

export const PRESET_CITIES: CityLocation[] = [
  // User's Hometown & Canadian Centers (Ontario / Quebec Border Corridor)
  {
    name: 'Alexandria, ON',
    adminRegion: 'Ontario',
    country: 'Canada',
    latitude: 45.3117,
    longitude: -74.6322,
    timezoneOffset: -5,
    label: 'Alexandria, ON, Canada (North Glengarry · 45.31°N, 74.63°W · UTC-5)',
  },
  {
    name: 'Ottawa, ON',
    adminRegion: 'Ontario',
    country: 'Canada',
    latitude: 45.4215,
    longitude: -75.6972,
    timezoneOffset: -5,
    label: 'Ottawa, ON, Canada (45.42°N, 75.70°W · UTC-5)',
  },
  {
    name: 'Montreal, QC',
    adminRegion: 'Quebec',
    country: 'Canada',
    latitude: 45.5017,
    longitude: -73.5673,
    timezoneOffset: -5,
    label: 'Montreal, QC, Canada (45.50°N, 73.57°W · UTC-5)',
  },
  {
    name: 'Toronto, ON',
    adminRegion: 'Ontario',
    country: 'Canada',
    latitude: 43.6532,
    longitude: -79.3832,
    timezoneOffset: -5,
    label: 'Toronto, ON, Canada (43.65°N, 79.38°W · UTC-5)',
  },
  {
    name: 'Cornwall, ON',
    adminRegion: 'Ontario',
    country: 'Canada',
    latitude: 45.0213,
    longitude: -74.7303,
    timezoneOffset: -5,
    label: 'Cornwall, ON, Canada (45.02°N, 74.73°W · UTC-5)',
  },
  {
    name: 'Kingston, ON',
    adminRegion: 'Ontario',
    country: 'Canada',
    latitude: 44.2312,
    longitude: -76.4860,
    timezoneOffset: -5,
    label: 'Kingston, ON, Canada (44.23°N, 76.49°W · UTC-5)',
  },
  {
    name: 'Quebec City, QC',
    adminRegion: 'Quebec',
    country: 'Canada',
    latitude: 46.8139,
    longitude: -71.2080,
    timezoneOffset: -5,
    label: 'Quebec City, QC, Canada (46.81°N, 71.21°W · UTC-5)',
  },
  {
    name: 'Vancouver, BC',
    adminRegion: 'British Columbia',
    country: 'Canada',
    latitude: 49.2827,
    longitude: -123.1207,
    timezoneOffset: -8,
    label: 'Vancouver, BC, Canada (49.28°N, 123.12°W · UTC-8)',
  },
  {
    name: 'Calgary, AB',
    adminRegion: 'Alberta',
    country: 'Canada',
    latitude: 51.0447,
    longitude: -114.0719,
    timezoneOffset: -7,
    label: 'Calgary, AB, Canada (51.04°N, 114.07°W · UTC-7)',
  },
  {
    name: 'Edmonton, AB',
    adminRegion: 'Alberta',
    country: 'Canada',
    latitude: 53.5461,
    longitude: -113.4938,
    timezoneOffset: -7,
    label: 'Edmonton, AB, Canada (53.55°N, 113.49°W · UTC-7)',
  },
  {
    name: 'Winnipeg, MB',
    adminRegion: 'Manitoba',
    country: 'Canada',
    latitude: 49.8951,
    longitude: -97.1384,
    timezoneOffset: -6,
    label: 'Winnipeg, MB, Canada (49.90°N, 97.14°W · UTC-6)',
  },
  {
    name: 'Halifax, NS',
    adminRegion: 'Nova Scotia',
    country: 'Canada',
    latitude: 44.6488,
    longitude: -63.5752,
    timezoneOffset: -4,
    label: 'Halifax, NS, Canada (44.65°N, 63.58°W · UTC-4)',
  },

  // Other Notable Alexandria and North American Cities
  {
    name: 'Alexandria, VA',
    adminRegion: 'Virginia',
    country: 'USA',
    latitude: 38.8048,
    longitude: -77.0469,
    timezoneOffset: -5,
    label: 'Alexandria, VA, USA (38.80°N, 77.05°W · UTC-5)',
  },
  {
    name: 'Alexandria, LA',
    adminRegion: 'Louisiana',
    country: 'USA',
    latitude: 31.3113,
    longitude: -92.4451,
    timezoneOffset: -6,
    label: 'Alexandria, LA, USA (31.31°N, 92.45°W · UTC-6)',
  },
  {
    name: 'Alexandria',
    adminRegion: 'Alexandria',
    country: 'Egypt',
    latitude: 31.2001,
    longitude: 29.9187,
    timezoneOffset: 2,
    label: 'Alexandria, Egypt (31.20°N, 29.92°E · UTC+2)',
  },
  {
    name: 'New York, NY',
    adminRegion: 'New York',
    country: 'USA',
    latitude: 40.7128,
    longitude: -74.0060,
    timezoneOffset: -5,
    label: 'New York, NY, USA (40.71°N, 74.01°W · UTC-5)',
  },
  {
    name: 'Los Angeles, CA',
    adminRegion: 'California',
    country: 'USA',
    latitude: 34.0522,
    longitude: -118.2437,
    timezoneOffset: -8,
    label: 'Los Angeles, CA, USA (34.05°N, 118.24°W · UTC-8)',
  },
  {
    name: 'San Francisco, CA',
    adminRegion: 'California',
    country: 'USA',
    latitude: 37.7749,
    longitude: -122.4194,
    timezoneOffset: -8,
    label: 'San Francisco, CA, USA (37.77°N, 122.42°W · UTC-8)',
  },
  {
    name: 'Chicago, IL',
    adminRegion: 'Illinois',
    country: 'USA',
    latitude: 41.8781,
    longitude: -87.6298,
    timezoneOffset: -6,
    label: 'Chicago, IL, USA (41.88°N, 87.63°W · UTC-6)',
  },
  {
    name: 'Austin, TX',
    adminRegion: 'Texas',
    country: 'USA',
    latitude: 30.2672,
    longitude: -97.7431,
    timezoneOffset: -6,
    label: 'Austin, TX, USA (30.27°N, 97.74°W · UTC-6)',
  },
  {
    name: 'Miami, FL',
    adminRegion: 'Florida',
    country: 'USA',
    latitude: 25.7617,
    longitude: -80.1918,
    timezoneOffset: -5,
    label: 'Miami, FL, USA (25.76°N, 80.19°W · UTC-5)',
  },
  {
    name: 'Seattle, WA',
    adminRegion: 'Washington',
    country: 'USA',
    latitude: 47.6062,
    longitude: -122.3321,
    timezoneOffset: -8,
    label: 'Seattle, WA, USA (47.61°N, 122.33°W · UTC-8)',
  },

  // Europe & World
  { name: 'London', country: 'UK', latitude: 51.5074, longitude: -0.1278, timezoneOffset: 0, label: 'London, UK (51.51°N, 0.13°W · UTC+0)' },
  { name: 'Paris', country: 'France', latitude: 48.8566, longitude: 2.3522, timezoneOffset: 1, label: 'Paris, France (48.86°N, 2.35°E · UTC+1)' },
  { name: 'Zurich', country: 'Switzerland', latitude: 47.3769, longitude: 8.5417, timezoneOffset: 1, label: 'Zurich, Switzerland (47.38°N, 8.54°E · UTC+1)' },
  { name: 'Berlin', country: 'Germany', latitude: 52.5200, longitude: 13.4050, timezoneOffset: 1, label: 'Berlin, Germany (52.52°N, 13.41°E · UTC+1)' },
  { name: 'Rome', country: 'Italy', latitude: 41.9028, longitude: 12.4964, timezoneOffset: 1, label: 'Rome, Italy (41.90°N, 12.50°E · UTC+1)' },
  { name: 'Tokyo', country: 'Japan', latitude: 35.6762, longitude: 139.6503, timezoneOffset: 9, label: 'Tokyo, Japan (35.68°N, 139.65°E · UTC+9)' },
  { name: 'Sydney', country: 'Australia', latitude: -33.8688, longitude: 151.2093, timezoneOffset: 10, label: 'Sydney, Australia (33.87°S, 151.21°E · UTC+10)' },
];

export function estimateTimezoneFromLon(lon: number): number {
  return Math.round(lon / 15);
}

// In-memory cache to guarantee instant, flicker-free repeat lookups
const searchCache = new Map<string, CityLocation[]>();

export async function searchPlaceOnline(query: string): Promise<CityLocation[]> {
  const q = query.trim().toLowerCase();
  if (!q) return PRESET_CITIES.slice(0, 8);

  if (searchCache.has(q)) {
    return searchCache.get(q)!;
  }

  // 1. Instant local exact & fuzzy matches
  const localMatches = PRESET_CITIES.filter((c) => {
    return (
      c.name.toLowerCase().includes(q) ||
      (c.adminRegion && c.adminRegion.toLowerCase().includes(q)) ||
      c.country.toLowerCase().includes(q) ||
      c.label.toLowerCase().includes(q)
    );
  });

  const results: CityLocation[] = [...localMatches];

  // 2. Query free, permissive open APIs if length >= 2
  if (q.length >= 2) {
    try {
      // Primary: Open-Meteo Geocoding API (100% free, permissive open data, CORS enabled, no API key needed)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const omRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          query
        )}&count=8&language=en&format=json`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (omRes.ok) {
        const omData = await omRes.json();
        if (omData.results && Array.isArray(omData.results)) {
          for (const item of omData.results) {
            const lat = Number(Number(item.latitude).toFixed(4));
            const lon = Number(Number(item.longitude).toFixed(4));
            const admin = item.admin1 || '';
            const country = item.country || '';
            const nameWithAdmin = admin ? `${item.name}, ${admin}` : item.name;
            const shortName = `${nameWithAdmin}, ${country}`;
            const tz = estimateTimezoneFromLon(lon);

            // Deduplicate
            if (
              !results.some(
                (r) =>
                  Math.abs(r.latitude - lat) < 0.05 &&
                  Math.abs(r.longitude - lon) < 0.05
              )
            ) {
              results.push({
                name: nameWithAdmin,
                adminRegion: admin,
                country,
                latitude: lat,
                longitude: lon,
                timezoneOffset: tz,
                label: `${shortName} (${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(
                  lon
                ).toFixed(2)}°${lon >= 0 ? 'E' : 'W'} · UTC${tz >= 0 ? `+${tz}` : tz})`,
              });
            }
          }
        }
      }
    } catch {
      // If Open-Meteo was interrupted, try Komoot Photon
      try {
        const pController = new AbortController();
        const pTimeout = setTimeout(() => pController.abort(), 1800);
        const photonRes = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6`,
          { signal: pController.signal }
        );
        clearTimeout(pTimeout);

        if (photonRes.ok) {
          const pData = await photonRes.json();
          if (pData.features && Array.isArray(pData.features)) {
            for (const f of pData.features) {
              const coords = f.geometry?.coordinates;
              if (coords && coords.length >= 2) {
                const lon = Number(Number(coords[0]).toFixed(4));
                const lat = Number(Number(coords[1]).toFixed(4));
                const p = f.properties || {};
                const name = p.name || 'Location';
                const state = p.state ? `, ${p.state}` : '';
                const country = p.country || '';
                const shortName = `${name}${state}${country ? `, ${country}` : ''}`;
                const tz = estimateTimezoneFromLon(lon);

                if (
                  !results.some(
                    (r) =>
                      Math.abs(r.latitude - lat) < 0.05 &&
                      Math.abs(r.longitude - lon) < 0.05
                  )
                ) {
                  results.push({
                    name: `${name}${state}`,
                    country,
                    latitude: lat,
                    longitude: lon,
                    timezoneOffset: tz,
                    label: `${shortName} (${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(
                      lon
                    ).toFixed(2)}°${lon >= 0 ? 'E' : 'W'})`,
                  });
                }
              }
            }
          }
        }
      } catch {
        // Fallback safely to local matches
      }
    }
  }

  const finalOutput = results.slice(0, 10);
  if (finalOutput.length > 0) {
    searchCache.set(q, finalOutput);
  }
  return finalOutput;
}

const VANTAGE_LOCATION_STORAGE_KEY = 'astrosphere_current_vantage_location_v2';

export function getPersistedVantageLocation(accountUid: string | null): CityLocation | null {
  try {
    const storage =
      typeof window !== 'undefined'
        ? window.localStorage
        : typeof localStorage !== 'undefined'
        ? localStorage
        : null;
    const key = accountStorageKey(VANTAGE_LOCATION_STORAGE_KEY, accountUid);
    if (!storage || !key) return null;
    const raw = storage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (
        parsed &&
        typeof parsed.latitude === 'number' &&
        typeof parsed.longitude === 'number' &&
        typeof parsed.name === 'string'
      ) {
        return parsed as CityLocation;
      }
    }
  } catch (e) {
    console.warn('Could not read vantage location from localStorage:', e);
  }
  return null;
}

export function savePersistedVantageLocation(location: CityLocation, accountUid: string | null): void {
  try {
    const storage =
      typeof window !== 'undefined'
        ? window.localStorage
        : typeof localStorage !== 'undefined'
        ? localStorage
        : null;
    const key = accountStorageKey(VANTAGE_LOCATION_STORAGE_KEY, accountUid);
    if (!storage || !key) return;
    storage.setItem(key, JSON.stringify(location));
  } catch (e) {
    console.warn('Could not save vantage location to localStorage:', e);
  }
}

