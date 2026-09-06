import type { GeoPoint } from '@/types/domain.types';
import { distanceMeters } from './locationService';

/**
 * Routing/directions provider abstraction.
 * ... (comment block unchanged) ...
 */

const ORS_PROXY_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ors-proxy`;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const AVERAGE_WALK_SPEED_MPS = 1.35; // ~4.9 km/h

export interface DirectionsResult {
  distanceM: number;
  durationS: number;
  geometry: GeoPoint[];
  isEstimate: boolean;
}

const directionsCache = new Map<string, DirectionsResult>();

const FAILURE_CACHE_TTL_MS = 60000;
const failureCache = new Map<string, number>();

function cacheKey(profile: string, from: GeoPoint, to: GeoPoint): string {
  const r = (n: number) => n.toFixed(5);
  return `${profile}:${r(from.lat)},${r(from.lng)}:${r(to.lat)},${r(to.lng)}`;
}

function recentlyFailed(key: string): boolean {
  const t = failureCache.get(key);
  return t !== undefined && Date.now() - t < FAILURE_CACHE_TTL_MS;
}

const MIN_GAP_MS = 350;
let queueTail: Promise<void> = Promise.resolve();

function throttled<T>(fn: () => Promise<T>): Promise<T> {
  const run = queueTail.then(fn);
  queueTail = run.then(
    () => new Promise((resolve) => setTimeout(resolve, MIN_GAP_MS)),
    () => new Promise((resolve) => setTimeout(resolve, MIN_GAP_MS))
  );
  return run;
}

async function fetchOrsDirections(profile: 'foot-walking' | 'driving-car', from: GeoPoint, to: GeoPoint) {
  if (!SUPABASE_ANON_KEY) {
    // Fail loudly in dev instead of silently 403ing — this is almost
    // certainly why routing is broken if you see this in the console.
    console.error('VITE_SUPABASE_ANON_KEY is not set — ors-proxy calls will 403.');
  }

  const res = await fetch(`${ORS_PROXY_BASE}?profile=${profile}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      coordinates: [
        [from.lng, from.lat],
        [to.lng, to.lat],
      ],
    }),
  });

  if (!res.ok) throw new Error(`ORS proxy returned ${res.status}`);

  const data = await res.json();
  const feature = data.features?.[0];
  const summary = feature?.properties?.summary;
  const coords: [number, number][] = feature?.geometry?.coordinates ?? [];

  return {
    distanceM: summary?.distance as number | undefined,
    durationS: summary?.duration as number | undefined,
    geometry: coords.map(([lng, lat]) => ({ lat, lng })),
  };
}

export async function walkingDirections(from: GeoPoint, to: GeoPoint): Promise<DirectionsResult> {
  const key = cacheKey('foot-walking', from, to);
  const cached = directionsCache.get(key);
  if (cached) return cached;

  if (recentlyFailed(key)) {
    const distanceM = distanceMeters(from, to);
    return { distanceM, durationS: distanceM / AVERAGE_WALK_SPEED_MPS, geometry: [from, to], isEstimate: true };
  }

  try {
    const { distanceM, durationS, geometry } = await throttled(() => fetchOrsDirections('foot-walking', from, to));
    const result: DirectionsResult = {
      distanceM: distanceM ?? distanceMeters(from, to),
      durationS: durationS ?? distanceMeters(from, to) / AVERAGE_WALK_SPEED_MPS,
      geometry: geometry.length > 0 ? geometry : [from, to],
      isEstimate: geometry.length === 0,
    };
    directionsCache.set(key, result);
    return result;
  } catch {
    failureCache.set(key, Date.now());
    const distanceM = distanceMeters(from, to);
    return { distanceM, durationS: distanceM / AVERAGE_WALK_SPEED_MPS, geometry: [from, to], isEstimate: true };
  }
}

const ROAD_CURVATURE_FACTOR = 1.3;
const AVERAGE_MOTORBIKE_SPEED_MPS = 8.3;

export async function drivingDirections(from: GeoPoint, to: GeoPoint): Promise<DirectionsResult> {
  const key = cacheKey('driving-car', from, to);
  const cached = directionsCache.get(key);
  if (cached) return cached;

  if (recentlyFailed(key)) {
    const distanceM = distanceMeters(from, to) * ROAD_CURVATURE_FACTOR;
    return { distanceM, durationS: distanceM / AVERAGE_MOTORBIKE_SPEED_MPS, geometry: [from, to], isEstimate: true };
  }

  try {
    const { distanceM, durationS, geometry } = await throttled(() => fetchOrsDirections('driving-car', from, to));
    const finalDistanceM = distanceM ?? distanceMeters(from, to) * ROAD_CURVATURE_FACTOR;
    const result: DirectionsResult = {
      distanceM: finalDistanceM,
      durationS: durationS ?? finalDistanceM / AVERAGE_MOTORBIKE_SPEED_MPS,
      geometry: geometry.length > 0 ? geometry : [from, to],
      isEstimate: geometry.length === 0,
    };
    directionsCache.set(key, result);
    return result;
  } catch {
    failureCache.set(key, Date.now());
    const distanceM = distanceMeters(from, to) * ROAD_CURVATURE_FACTOR;
    return { distanceM, durationS: distanceM / AVERAGE_MOTORBIKE_SPEED_MPS, geometry: [from, to], isEstimate: true };
  }
}

export function getMapStyle(): string {
  const style = (import.meta.env.VITE_MAP_STYLE as string) || 'positron';
  return `https://tiles.openfreemap.org/styles/${style}`;
}