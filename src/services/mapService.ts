import type { GeoPoint } from '@/types/domain.types';
import { distanceMeters } from './locationService';

/**
 * Routing/directions provider — OSRM public demo server
 * (https://router.project-osrm.org), used temporarily in place of the
 * ORS Supabase proxy because the ORS account quota was exhausted.
 *
 * No API key needed, no Supabase round-trip. This is OSRM's shared public
 * demo instance — fine for a deadline/demo tonight, but NOT meant for
 * sustained production traffic (no SLA, can rate-limit or go down without
 * notice). Swap back to the ors-proxy path once ORS quota resets or a
 * paid plan is in place — see fetchOrsDirections below for the old impl
 * to restore.
 *
 * Same two caches as before:
 *  - success cache: identical (profile, from, to) results are reused.
 *  - failure cache: a coordinate pair that just failed is assumed likely
 *    to fail again for a short window, so repeat requests skip the
 *    network and go straight to the straight-line estimate.
 *
 * Requests go through a shared throttled queue so a single search never
 * bursts the shared public server too hard.
 */

const OSRM_BASE = 'https://router.project-osrm.org/route/v1';
const AVERAGE_WALK_SPEED_MPS = 1.35; // ~4.9 km/h

export interface DirectionsResult {
  distanceM: number;
  durationS: number;
  geometry: GeoPoint[]; // decoded route as lat/lng pairs
  isEstimate: boolean;  // true when using the straight-line fallback
}

// --- Success cache ---
const directionsCache = new Map<string, DirectionsResult>();

// --- Failure cache ---
const FAILURE_CACHE_TTL_MS = 60000; // 1 minute
const failureCache = new Map<string, number>();

function cacheKey(profile: string, from: GeoPoint, to: GeoPoint): string {
  const r = (n: number) => n.toFixed(5);
  return `${profile}:${r(from.lat)},${r(from.lng)}:${r(to.lat)},${r(to.lng)}`;
}

function recentlyFailed(key: string): boolean {
  const t = failureCache.get(key);
  return t !== undefined && Date.now() - t < FAILURE_CACHE_TTL_MS;
}

// --- Throttled queue ---
// OSRM's public demo server is shared infrastructure — keep a slightly
// wider gap than the old ORS proxy used, to be a good citizen of it.
const MIN_GAP_MS = 400;
let queueTail: Promise<void> = Promise.resolve();

function throttled<T>(fn: () => Promise<T>): Promise<T> {
  const run = queueTail.then(fn);
  queueTail = run.then(
    () => new Promise((resolve) => setTimeout(resolve, MIN_GAP_MS)),
    () => new Promise((resolve) => setTimeout(resolve, MIN_GAP_MS))
  );
  return run;
}

/**
 * OSRM profiles: 'foot' (walking), 'driving' (used here for the ojek/
 * motorbike case — OSRM has no dedicated motorbike profile, driving is
 * the closest approximation, same as before with ORS's driving-car).
 */
async function fetchOsrmDirections(profile: 'foot' | 'driving', from: GeoPoint, to: GeoPoint) {
  const coordsPath = `${from.lng},${from.lat};${to.lng},${to.lat}`;
  const url = `${OSRM_BASE}/${profile}/${coordsPath}?overview=full&geometries=geojson`;

  const res = await fetch(url);

  if (!res.ok) {
    let message = `OSRM returned ${res.status}`;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch {
      // body wasn't JSON — keep the generic message
    }
    throw new Error(message);
  }

  const data = await res.json();

  if (data.code !== 'Ok' || !data.routes?.[0]) {
    throw new Error(data.message ?? `OSRM returned code "${data.code}"`);
  }

  const route = data.routes[0];
  const coords: [number, number][] = route.geometry?.coordinates ?? [];

  return {
    distanceM: route.distance as number | undefined,
    durationS: route.duration as number | undefined,
    geometry: coords.map(([lng, lat]) => ({ lat, lng })),
  };
}

export async function walkingDirections(from: GeoPoint, to: GeoPoint): Promise<DirectionsResult> {
  const key = cacheKey('foot', from, to);

  const cached = directionsCache.get(key);
  if (cached) return cached;

  if (recentlyFailed(key)) {
    const distanceM = distanceMeters(from, to);
    return {
      distanceM,
      durationS: distanceM / AVERAGE_WALK_SPEED_MPS,
      geometry: [from, to],
      isEstimate: true,
    };
  }

  try {
    const { distanceM, durationS, geometry } = await throttled(() => fetchOsrmDirections('foot', from, to));
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
    return {
      distanceM,
      durationS: distanceM / AVERAGE_WALK_SPEED_MPS,
      geometry: [from, to],
      isEstimate: true,
    };
  }
}

const ROAD_CURVATURE_FACTOR = 1.3;
const AVERAGE_MOTORBIKE_SPEED_MPS = 8.3;

export async function drivingDirections(from: GeoPoint, to: GeoPoint): Promise<DirectionsResult> {
  const key = cacheKey('driving', from, to);

  const cached = directionsCache.get(key);
  if (cached) return cached;

  if (recentlyFailed(key)) {
    const distanceM = distanceMeters(from, to) * ROAD_CURVATURE_FACTOR;
    return {
      distanceM,
      durationS: distanceM / AVERAGE_MOTORBIKE_SPEED_MPS,
      geometry: [from, to],
      isEstimate: true,
    };
  }

  try {
    const { distanceM, durationS, geometry } = await throttled(() => fetchOsrmDirections('driving', from, to));
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
    return {
      distanceM,
      durationS: distanceM / AVERAGE_MOTORBIKE_SPEED_MPS,
      geometry: [from, to],
      isEstimate: true,
    };
  }
}

export function getMapStyle(): string {
  const style = (import.meta.env.VITE_MAP_STYLE as string) || 'positron';
  return `https://tiles.openfreemap.org/styles/${style}`;
}