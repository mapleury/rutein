import type { PlaceResult } from '@/types/domain.types';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const JAKARTA_VIEWBOX = '106.5,-6.5,107.1,-5.9';

const POPULAR_INDONESIAN_PLACES: PlaceResult[] = [
  {
    lat: -6.2917,
    lng: 106.7909,
    label: 'South Quarter',
    address: 'Jl. RA Kartini No.8, Cilandak Barat, Jakarta Selatan',
    placeId: 'pop-sq',
  },
  {
    lat: -6.2736,
    lng: 106.7972,
    label: 'Lotte Mart Fatmawati',
    address: 'Jl. RS. Fatmawati Raya No.15, Cilandak, Jakarta Selatan',
    placeId: 'pop-lotte-fatmawati',
  },
  {
    lat: -6.1754,
    lng: 106.8272,
    label: 'Monas (Monumen Nasional)',
    address: 'Gambir, Jakarta Pusat',
    placeId: 'pop-monas',
  },
  {
    lat: -6.2023,
    lng: 106.8236,
    label: 'Stasiun Sudirman',
    address: 'Sudirman, Jakarta Pusat',
    placeId: 'pop-sudirman',
  },
  {
    lat: -6.2100,
    lng: 106.8501,
    label: 'Stasiun Manggarai',
    address: 'Tebet, Jakarta Selatan',
    placeId: 'pop-manggarai',
  },
  {
    lat: -6.2443,
    lng: 106.7976,
    label: 'Blok M Plaza',
    address: 'Kebayoran Baru, Jakarta Selatan',
    placeId: 'pop-blok-m',
  },
  {
    lat: -6.2905,
    lng: 106.7753,
    label: 'Stasiun MRT Lebak Bulus',
    address: 'Cilandak, Jakarta Selatan',
    placeId: 'pop-lebak-bulus',
  },
  {
    lat: -6.1856,
    lng: 106.8105,
    label: 'Stasiun KRL Tanah Abang',
    address: 'Tanah Abang, Jakarta Pusat',
    placeId: 'pop-tanah-abang',
  },
  {
    lat: -6.1950,
    lng: 106.8230,
    label: 'Bundaran HI',
    address: 'Menteng, Jakarta Pusat',
    placeId: 'pop-bhi',
  },
  {
    lat: -6.2255,
    lng: 106.8080,
    label: 'Gelora Bung Karno (GBK)',
    address: 'Senayan, Jakarta Pusat',
    placeId: 'pop-gbk',
  },
];

const placeCache = new Map<string, PlaceResult[]>();

const MIN_GAP_MS = 800;
let queueTail: Promise<void> = Promise.resolve();

function throttled<T>(fn: () => Promise<T>): Promise<T> {
  const run = queueTail.then(fn);
  queueTail = run.then(
    () => new Promise((resolve) => setTimeout(resolve, MIN_GAP_MS)),
    () => new Promise((resolve) => setTimeout(resolve, MIN_GAP_MS))
  );
  return run;
}

function toPlaceResult(item: any): PlaceResult {
  return {
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
    label: item.name || item.display_name?.split(',')[0] || item.display_name,
    address: item.display_name,
    placeId: String(item.place_id ?? item.osm_id),
  };
}

export async function searchPlaces(query: string, limit = 6): Promise<PlaceResult[]> {
  if (!query || query.trim().length < 2) return [];
  const q = query.trim().toLowerCase();

  const popularMatches = POPULAR_INDONESIAN_PLACES.filter(
    (p) => p.label.toLowerCase().includes(q) || p.address.toLowerCase().includes(q)
  );
  if (popularMatches.length > 0) {
    return popularMatches.slice(0, limit);
  }

  if (placeCache.has(q)) {
    return placeCache.get(q)!.slice(0, limit);
  }

  const url = new URL(`${NOMINATIM_BASE}/search`);
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('viewbox', JAKARTA_VIEWBOX);
  url.searchParams.set('bounded', '0');
  url.searchParams.set('countrycodes', 'id');

  try {
    const results = await throttled(async () => {
      const res = await fetch(url.toString(), {
        headers: { 'Accept-Language': 'id,en' },
      });

      if (!res.ok) {
        throw new Error(`Geocoding search failed (${res.status})`);
      }

      const data = await res.json();
      return (data as any[]).map(toPlaceResult);
    });

    if (results.length > 0) {
      placeCache.set(q, results);
    }
    return results;
  } catch (err) {
    return POPULAR_INDONESIAN_PLACES.slice(0, limit);
  }
}

export async function searchNearbyCategory(
  query: string,
  lat: number,
  lng: number,
  radiusM = 3000,
  limit = 5
): Promise<PlaceResult[]> {
  const degDelta = radiusM / 111_000;

  const url = new URL(`${NOMINATIM_BASE}/search`);
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('limit', String(limit));
  url.searchParams.set(
    'viewbox',
    `${lng - degDelta},${lat + degDelta},${lng + degDelta},${lat - degDelta}`
  );
  url.searchParams.set('bounded', '1');

  const results = await throttled(async () => {
    const res = await fetch(url.toString(), {
      headers: { 'Accept-Language': 'id,en' },
    });

    if (!res.ok) {
      throw new Error(`Nearby category search failed (${res.status})`);
    }

    const data = await res.json();
    return (data as any[]).map(toPlaceResult);
  });

  const earthRadius = 6371000;
  const toRad = (n: number) => (n * Math.PI) / 180;

  return results.filter((place) => {
    const dLat = toRad(place.lat - lat);
    const dLng = toRad(place.lng - lng);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat)) * Math.cos(toRad(place.lat)) * Math.sin(dLng / 2) ** 2;
    const distance = 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return distance <= radiusM;
  });
}

export async function reverseGeocode(lat: number, lng: number): Promise<PlaceResult | null> {
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (placeCache.has(cacheKey)) {
    return placeCache.get(cacheKey)![0];
  }

  const url = new URL(`${NOMINATIM_BASE}/reverse`);
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lng));
  url.searchParams.set('format', 'jsonv2');

  return throttled(async () => {
    const res = await fetch(url.toString(), {
      headers: { 'Accept-Language': 'id,en' },
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.error) return null;
    const place = toPlaceResult(data);
    placeCache.set(cacheKey, [place]);
    return place;
  });
}

export function debounce<Args extends unknown[]>(fn: (...args: Args) => void, delayMs = 300) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delayMs);
  };
}