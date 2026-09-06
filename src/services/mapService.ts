import type { GeoPoint } from '@/types/domain.types';
import { distanceMeters } from './locationService';

const OSRM_BASE = 'https://router.project-osrm.org/route/v1';
const AVERAGE_WALK_SPEED_MPS = 1.35;

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