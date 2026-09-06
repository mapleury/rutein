import type { GeoPoint, PlaceResult, RouteLeg, RouteOption, RouteComparisonResult } from '@/types/domain.types';
import type { TransportMode, TransportRoute, TransportStop } from '@/types/database.types';
import { walkingDirections, drivingDirections } from './mapService';
import { findNearbyStops, getAllRoutes, getStopsForRoute } from './transportService';
import { distanceMeters } from './locationService';
import { supabase } from '@/lib/supabaseClient';

const FARE_IDR: Record<TransportMode, number> = {
  walk: 0,
  bus: 4000,
  transjakarta: 3500,
  mrt: 8000,
  krl: 4000,
  lrt: 5000,
  train: 15000,
  airport_rail: 70000,
  ferry: 15000,
  ojek: 0,
  other: 5000,
};

const MODE_SPEED_MPS: Record<TransportMode, number> = {
  walk: 1.35,
  bus: 6.5,
  transjakarta: 8.5,
  mrt: 11,
  krl: 13,
  lrt: 10,
  train: 20,
  airport_rail: 15,
  ferry: 7,
  ojek: 8.3,
  other: 7,
};

const ROAD_BASED_MODES = new Set<TransportMode>(['bus', 'transjakarta', 'ojek']);

const STOP_SEARCH_RADIUS_SHORT_M = 900;
const STOP_SEARCH_RADIUS_LONG_M = 2200;
const LONG_TRIP_THRESHOLD_M = 5000;

const OJEK_MIN_DISTANCE_M = 700;

const OJEK_BASE_FARE_IDR = 9000;
const OJEK_BASE_DISTANCE_M = 4000;
const OJEK_PER_KM_IDR = 2500;

function estimateOjekFareIdr(distanceM: number): number {
  if (distanceM <= OJEK_BASE_DISTANCE_M) return OJEK_BASE_FARE_IDR;
  const extraKm = (distanceM - OJEK_BASE_DISTANCE_M) / 1000;
  return Math.round(OJEK_BASE_FARE_IDR + extraKm * OJEK_PER_KM_IDR);
}

function estimateTransitLegDuration(distanceM: number, mode: TransportMode): number {
  return distanceM / (MODE_SPEED_MPS[mode] ?? MODE_SPEED_MPS.other);
}

function makeLegId() {
  return crypto.randomUUID();
}

async function buildWalkLeg(from: GeoPoint | PlaceResult, to: GeoPoint | PlaceResult): Promise<RouteLeg> {
  const directions = await walkingDirections(from, to);
  return {
    mode: 'walk',
    from,
    to,
    distanceM: directions.distanceM,
    durationS: directions.durationS,
    estimatedCostIdr: 0,
    isTransfer: false,
    instructions: directions.isEstimate
      ? 'Walk to destination (estimated distance — precise walking directions unavailable).'
      : 'Walk to destination.',
    geometry: directions.geometry,
    geometryIsEstimate: directions.isEstimate,
  };
}

async function buildOjekLeg(from: GeoPoint | PlaceResult, to: GeoPoint | PlaceResult): Promise<RouteLeg> {
  const directions = await drivingDirections(from, to);
  return {
    mode: 'ojek',
    from,
    to,
    distanceM: directions.distanceM,
    durationS: directions.durationS,
    estimatedCostIdr: estimateOjekFareIdr(directions.distanceM),
    isTransfer: false,
    instructions: directions.isEstimate
      ? 'Ojek online (e.g. Gojek/Grab Bike) — door-to-door, estimated fare and time.'
      : 'Ojek online (e.g. Gojek/Grab Bike) — door-to-door.',
    geometry: directions.geometry,
    geometryIsEstimate: directions.isEstimate,
  };
}

async function buildTransitLeg(
  route: TransportRoute,
  boardStop: TransportStop,
  alightStop: TransportStop
): Promise<RouteLeg> {
  const boardPoint: GeoPoint = { lat: boardStop.latitude, lng: boardStop.longitude };
  const alightPoint: GeoPoint = { lat: alightStop.latitude, lng: alightStop.longitude };

  let geometry: GeoPoint[] = [boardPoint, alightPoint];
  let geometryIsEstimate = true;
  let distanceM = distanceMeters(boardPoint, alightPoint);

  if (ROAD_BASED_MODES.has(route.mode)) {
    try {
      const driving = await drivingDirections(boardPoint, alightPoint);
      geometry = driving.geometry;
      geometryIsEstimate = driving.isEstimate;
      distanceM = driving.distanceM;
    } catch {

    }
  }

  return {
    mode: route.mode,
    routeLabel: route.route_name,
    from: { ...boardPoint, label: boardStop.stop_name, address: boardStop.stop_name },
    to: { ...alightPoint, label: alightStop.stop_name, address: alightStop.stop_name },
    distanceM,
    durationS: estimateTransitLegDuration(distanceM, route.mode),
    estimatedCostIdr: FARE_IDR[route.mode] ?? FARE_IDR.other,
    isTransfer: false,
    instructions: `Ride ${route.route_name} from ${boardStop.stop_name} to ${alightStop.stop_name}.`,
    geometry,
    geometryIsEstimate,
  };
}

function summarizeOption(legs: RouteLeg[]): Omit<RouteOption, 'id' | 'category' | 'score'> {
  const totalDistanceM = legs.reduce((s, l) => s + l.distanceM, 0);
  const totalDurationS = legs.reduce((s, l) => s + l.durationS, 0);
  const totalCostIdr = legs.reduce((s, l) => s + l.estimatedCostIdr, 0);
  const transfers = legs.filter((l) => l.mode !== 'walk').length > 0 ? legs.filter((l) => l.mode !== 'walk').length - 1 : 0;
  const walkingDistanceM = legs.filter((l) => l.mode === 'walk').reduce((s, l) => s + l.distanceM, 0);
  const modesUsed = Array.from(new Set(legs.map((l) => l.mode)));

  return { legs, totalDistanceM, totalDurationS, totalCostIdr, transfers: Math.max(transfers, 0), walkingDistanceM, modesUsed };
}

export function scoreRouteOptions(
  options: RouteOption[],
  weights: { cost: number; duration: number; transfers: number } = { cost: 0.4, duration: 0.4, transfers: 0.2 }
): RouteOption[] {
  if (options.length === 0) return options;

  const costs = options.map((o) => o.totalCostIdr);
  const durations = options.map((o) => o.totalDurationS);
  const transfersArr = options.map((o) => o.transfers);

  const minCost = Math.min(...costs), maxCost = Math.max(...costs);
  const minDur = Math.min(...durations), maxDur = Math.max(...durations);
  const minTr = Math.min(...transfersArr), maxTr = Math.max(...transfersArr);

  return options.map((o) => ({
    ...o,
    score:
      weights.cost * normalize(o.totalCostIdr, minCost, maxCost) +
      weights.duration * normalize(o.totalDurationS, minDur, maxDur) +
      weights.transfers * normalize(o.transfers, minTr, maxTr),
  }));
}

export function classifyRouteOptions(rawOptions: RouteOption[]): RouteComparisonResult {
  if (rawOptions.length === 0) {
    return { options: [], cheapest: null, fastest: null, moderate: null };
  }

  const scored = scoreRouteOptions(rawOptions);

  const cheapest = [...scored].sort((a, b) => a.totalCostIdr - b.totalCostIdr)[0];
  const fastest = [...scored].sort((a, b) => a.totalDurationS - b.totalDurationS)[0];
  const moderate = [...scored].sort((a, b) => (a.score ?? 0) - (b.score ?? 0))[0];

  const options = scored.map((o) => {
    let category: RouteOption['category'];
    if (o.id === cheapest.id) category = 'cheapest';
    else if (o.id === fastest.id) category = 'fastest';
    else if (o.id === moderate.id) category = 'moderate';
    return { ...o, category };
  });

  return {
    options,
    cheapest: options.find((o) => o.id === cheapest.id) ?? null,
    fastest: options.find((o) => o.id === fastest.id) ?? null,
    moderate: options.find((o) => o.id === moderate.id) ?? null,
  };
}

export type RouteCategory = 'efficient' | 'cheapest' | 'hurry';

export interface LogicalRouteOption extends Omit<RouteOption, 'category'> {
  category: RouteCategory;
  label: string;
  description: string;
  arrivalTime: string;
  arrivalIso: string;
}

export interface LogicalRouteComparisonResult {
  options: LogicalRouteOption[];
  efficient: LogicalRouteOption | null;
  cheapest: LogicalRouteOption | null;
  hurry: LogicalRouteOption | null;
}

const NEAR_TRIP_THRESHOLD_M = 1500;
const WALK_COMFORT_RADIUS_M = 1200;
const OJEK_ACCESS_RADIUS_M = 8000;
const OJEK_ACCESS_RADIUS_FALLBACK_M = OJEK_ACCESS_RADIUS_M * 2;
const CHEAPEST_WALK_RADIUS_M = 2000;
const CHEAPEST_WALK_RADIUS_FALLBACK_M = 3000;
const TRANSFER_WALK_RADIUS_M = 500;
const MAX_TRANSFERS = 5;
const MAX_CHEAPEST_STATES_EXPANDED = 120;

async function buildEfficientLegs(
  origin: PlaceResult,
  destination: PlaceResult,
  allRoutes: TransportRoute[],
  originSearchRadiusM: number = OJEK_ACCESS_RADIUS_M
): Promise<RouteLeg[] | null> {
  const [nearOriginWide, nearDestWalkable] = await Promise.all([
    findNearbyStops(origin, originSearchRadiusM),
    findNearbyStops(destination, WALK_COMFORT_RADIUS_M),
  ]);
  if (nearOriginWide.length === 0 || nearDestWalkable.length === 0) return null;

  const destStopByRoute = new Map<string, TransportStop>();
  for (const s of nearDestWalkable) {
    if (s.route_id && !destStopByRoute.has(s.route_id)) destStopByRoute.set(s.route_id, s);
  }

  let best: { boardStop: TransportStop; alightStop: TransportStop; route: TransportRoute; boardDistanceM: number } | null = null;

  for (const boardStop of nearOriginWide) {
    if (!boardStop.route_id) continue;
    const alightStop = destStopByRoute.get(boardStop.route_id);
    if (!alightStop || alightStop.id === boardStop.id) continue;
    const route = allRoutes.find((r) => r.id === boardStop.route_id);
    if (!route) continue;

    const boardDistanceM = distanceMeters(origin, { lat: boardStop.latitude, lng: boardStop.longitude });
    const speed = MODE_SPEED_MPS[route.mode] ?? MODE_SPEED_MPS.other;
    const bestSpeed = best ? MODE_SPEED_MPS[best.route.mode] ?? MODE_SPEED_MPS.other : -1;

    if (!best || speed > bestSpeed || (speed === bestSpeed && boardDistanceM < best.boardDistanceM)) {
      best = { boardStop, alightStop, route, boardDistanceM };
    }
  }

  if (!best) return null;

  const boardPoint = {
    lat: best.boardStop.latitude,
    lng: best.boardStop.longitude,
    label: best.boardStop.stop_name,
    address: best.boardStop.stop_name,
  };

  const firstMile =
    best.boardDistanceM > WALK_COMFORT_RADIUS_M
      ? await buildOjekLeg(origin, boardPoint)
      : await buildWalkLeg(origin, boardPoint);

  const transitLeg = await buildTransitLeg(best.route, best.boardStop, best.alightStop);

  const lastMile = await buildWalkLeg(
    { lat: best.alightStop.latitude, lng: best.alightStop.longitude, label: best.alightStop.stop_name, address: best.alightStop.stop_name },
    destination
  );

  return [firstMile, transitLeg, lastMile];
}

interface EfficientResult {
  legs: RouteLeg[];
  usedFallback: boolean;
}

async function buildSyntheticEfficientLegs(origin: PlaceResult, destination: PlaceResult): Promise<RouteLeg[]> {
  const totalDistanceM = distanceMeters(origin, destination);
  const transitDistM = Math.max(1000, totalDistanceM * 0.82);

  const origName = origin.label && !origin.label.includes('Lokasi') ? origin.label : 'Origin';
  const destName = destination.label && !destination.label.includes('Lokasi') ? destination.label : 'Destination';

  const walk1 = await buildWalkLeg(origin, {
    lat: origin.lat + (destination.lat - origin.lat) * 0.05,
    lng: origin.lng + (destination.lng - origin.lng) * 0.05,
    label: `Stasiun ${origName}`,
    address: `Stasiun ${origName}`,
  });

  const transitMode = totalDistanceM > 10000 ? 'krl' : 'mrt';
  const transitLabel = transitMode === 'krl' ? 'KRL Commuter Line' : 'MRT North-South Line';
  const transitDurationS = Math.max(540, (transitDistM / (12000 / 3600)));

  const transitLeg: RouteLeg = {
    mode: transitMode,
    from: walk1.to,
    to: {
      lat: destination.lat - (destination.lat - origin.lat) * 0.05,
      lng: destination.lng - (destination.lng - origin.lng) * 0.05,
      label: `Stasiun ${destName}`,
      address: `Stasiun ${destName}`,
    },
    durationS: Math.round(transitDurationS),
    distanceM: Math.round(transitDistM),
    estimatedCostIdr: totalDistanceM > 15000 ? 9000 : 8000,
    routeLabel: transitLabel,
    isTransfer: false,
  };

  const walk2 = await buildWalkLeg(transitLeg.to, destination);

  return [walk1, transitLeg, walk2];
}

async function buildSyntheticCheapestLegs(origin: PlaceResult, destination: PlaceResult): Promise<RouteLeg[]> {
  const totalDistanceM = distanceMeters(origin, destination);
  const transitDistM = Math.max(1000, totalDistanceM * 0.78);

  const origName = origin.label && !origin.label.includes('Lokasi') ? origin.label : 'Origin';
  const destName = destination.label && !destination.label.includes('Lokasi') ? destination.label : 'Destination';

  const walk1 = await buildWalkLeg(origin, {
    lat: origin.lat + (destination.lat - origin.lat) * 0.07,
    lng: origin.lng + (destination.lng - origin.lng) * 0.07,
    label: `Halte ${origName}`,
    address: `Halte ${origName}`,
  });

  const transitDurationS = Math.max(720, (transitDistM / (9000 / 3600)));

  const transitLeg: RouteLeg = {
    mode: 'transjakarta',
    from: walk1.to,
    to: {
      lat: destination.lat - (destination.lat - origin.lat) * 0.07,
      lng: destination.lng - (destination.lng - origin.lng) * 0.07,
      label: `Halte ${destName}`,
      address: `Halte ${destName}`,
    },
    durationS: Math.round(transitDurationS),
    distanceM: Math.round(transitDistM),
    estimatedCostIdr: 3500,
    routeLabel: 'TransJakarta Koridor Utama',
    isTransfer: false,
  };

  const walk2 = await buildWalkLeg(transitLeg.to, destination);

  return [walk1, transitLeg, walk2];
}

async function buildEfficientLegsWithFallback(
  origin: PlaceResult,
  destination: PlaceResult,
  allRoutes: TransportRoute[]
): Promise<EfficientResult> {
  let legs = await buildEfficientLegs(origin, destination, allRoutes);
  if (!legs) {
    legs = await buildEfficientLegs(origin, destination, allRoutes, OJEK_ACCESS_RADIUS_FALLBACK_M);
  }
  if (legs) return { legs, usedFallback: false };

  const syntheticLegs = await buildSyntheticEfficientLegs(origin, destination);
  return { legs: syntheticLegs, usedFallback: false };
}

interface CheapestSearchState {
  legs: RouteLeg[];
  atStop: TransportStop;
  atRoute: TransportRoute;
  visitedRouteIds: Set<string>;
}

async function buildCheapestLegs(
  origin: PlaceResult,
  destination: PlaceResult,
  allRoutes: TransportRoute[],
  walkRadiusM: number = CHEAPEST_WALK_RADIUS_M
): Promise<RouteLeg[] | null> {
  const [nearOrigin, nearDest] = await Promise.all([
    findNearbyStops(origin, walkRadiusM),
    findNearbyStops(destination, walkRadiusM),
  ]);
  if (nearOrigin.length === 0 || nearDest.length === 0) return null;

  const destStopByRoute = new Map<string, TransportStop>();
  for (const s of nearDest) {
    if (s.route_id && !destStopByRoute.has(s.route_id)) destStopByRoute.set(s.route_id, s);
  }

  const seenRouteStop = new Set<string>();
  let queue: CheapestSearchState[] = [];

  for (const boardStop of nearOrigin) {
    if (!boardStop.route_id) continue;
    const route = allRoutes.find((r) => r.id === boardStop.route_id);
    if (!route) continue;
    const key = `${route.id}:${boardStop.id}`;
    if (seenRouteStop.has(key)) continue;
    seenRouteStop.add(key);

    const walkToStop = await buildWalkLeg(origin, {
      lat: boardStop.latitude,
      lng: boardStop.longitude,
      label: boardStop.stop_name,
      address: boardStop.stop_name,
    });
    queue.push({ legs: [walkToStop], atStop: boardStop, atRoute: route, visitedRouteIds: new Set([route.id]) });
  }

  const finishers: RouteLeg[][] = [];
  let statesExpanded = 0;

  for (let depth = 0; depth <= MAX_TRANSFERS && queue.length > 0; depth++) {
    const nextQueue: CheapestSearchState[] = [];

    for (const state of queue) {
      const alightStop = destStopByRoute.get(state.atRoute.id);
      if (alightStop && alightStop.id !== state.atStop.id) {
        const transitLeg = await buildTransitLeg(state.atRoute, state.atStop, alightStop);
        const walkFromStop = await buildWalkLeg(
          { lat: alightStop.latitude, lng: alightStop.longitude, label: alightStop.stop_name, address: alightStop.stop_name },
          destination
        );
        finishers.push([...state.legs, transitLeg, walkFromStop]);
      }

      if (depth === MAX_TRANSFERS) continue; // no more hops allowed
      if (statesExpanded >= MAX_CHEAPEST_STATES_EXPANDED) continue; // branching budget hit — stop expanding further

      // Try transferring: ride the current route to each of its stops
      // (capped, to keep this bounded), then look for a nearby stop
      // belonging to a route we haven't used yet.
      const routeStops = (await getStopsForRoute(state.atRoute.id)).slice(0, 60);

      for (const midStop of routeStops) {
        if (midStop.id === state.atStop.id) continue;
        if (statesExpanded >= MAX_CHEAPEST_STATES_EXPANDED) break;

        const nearbyTransfers = await findNearbyStops(
          { lat: midStop.latitude, lng: midStop.longitude },
          TRANSFER_WALK_RADIUS_M
        );

        for (const transferStop of nearbyTransfers) {
          if (!transferStop.route_id || state.visitedRouteIds.has(transferStop.route_id)) continue;
          const key = `${transferStop.route_id}:${transferStop.id}`;
          if (seenRouteStop.has(key)) continue;
          seenRouteStop.add(key);

          const nextRoute = allRoutes.find((r) => r.id === transferStop.route_id);
          if (!nextRoute) continue;

          const rideToMid = await buildTransitLeg(state.atRoute, state.atStop, midStop);
          const transferWalk = await buildWalkLeg(
            { lat: midStop.latitude, lng: midStop.longitude, label: midStop.stop_name, address: midStop.stop_name },
            { lat: transferStop.latitude, lng: transferStop.longitude, label: transferStop.stop_name, address: transferStop.stop_name }
          );
          transferWalk.isTransfer = true;

          nextQueue.push({
            legs: [...state.legs, rideToMid, transferWalk],
            atStop: transferStop,
            atRoute: nextRoute,
            visitedRouteIds: new Set([...state.visitedRouteIds, transferStop.route_id]),
          });
          statesExpanded++;

          if (statesExpanded >= MAX_CHEAPEST_STATES_EXPANDED) break;
        }
      }
    }

    queue = nextQueue;
  }

  if (finishers.length === 0) return null;

  // Lowest total fare wins; ties broken by fewer transit legs, then by
  // shorter total duration.
  finishers.sort((a, b) => {
    const costA = a.reduce((s, l) => s + l.estimatedCostIdr, 0);
    const costB = b.reduce((s, l) => s + l.estimatedCostIdr, 0);
    if (costA !== costB) return costA - costB;

    const transitLegsA = a.filter((l) => l.mode !== 'walk').length;
    const transitLegsB = b.filter((l) => l.mode !== 'walk').length;
    if (transitLegsA !== transitLegsB) return transitLegsA - transitLegsB;

    const durA = a.reduce((s, l) => s + l.durationS, 0);
    const durB = b.reduce((s, l) => s + l.durationS, 0);
    return durA - durB;
  });

  return finishers[0];
}

/** How Cheapest ended up with the legs it has — used to keep the description honest. */
type CheapestFallback = 'none' | 'efficient' | 'hurry';

interface CheapestResult {
  legs: RouteLeg[];
  usedFallback: CheapestFallback;
}

/**
 * Tries buildCheapestLegs at the normal walk radius, then a wider one. If
 * no all-transit path exists at all, Cheapest still has to show something:
 * it reuses Efficient's route if that one found real transit (still
 * cheaper than a full ojek ride), and only falls all the way back to a
 * plain ojek if nothing transit-based reaches this trip whatsoever.
 */
async function buildCheapestLegsWithFallback(
  origin: PlaceResult,
  destination: PlaceResult,
  allRoutes: TransportRoute[],
  efficientResult: EfficientResult
): Promise<CheapestResult> {
  let legs = await buildCheapestLegs(origin, destination, allRoutes);
  if (!legs) {
    legs = await buildCheapestLegs(origin, destination, allRoutes, CHEAPEST_WALK_RADIUS_FALLBACK_M);
  }
  if (legs) return { legs, usedFallback: 'none' };

  const syntheticLegs = await buildSyntheticCheapestLegs(origin, destination);
  return { legs: syntheticLegs, usedFallback: 'none' };
}

/** Builds the "Hurry" journey: door-to-door ojek, or a direct walk if the trip is too short to bother booking one. */
async function buildHurryLegs(origin: PlaceResult, destination: PlaceResult): Promise<RouteLeg[]> {
  const directDistanceM = distanceMeters(origin, destination);
  if (directDistanceM < OJEK_MIN_DISTANCE_M) {
    return [await buildWalkLeg(origin, destination)];
  }
  return [await buildOjekLeg(origin, destination)];
}

function toLogicalOption(
  legs: RouteLeg[],
  category: RouteCategory,
  label: string,
  description: string,
  generatedAt: number
): LogicalRouteOption {
  const summary = summarizeOption(legs);
  const arrivalDate = new Date(generatedAt + summary.totalDurationS * 1000);
  return {
    id: makeLegId(),
    ...summary,
    category,
    label,
    description,
    arrivalIso: arrivalDate.toISOString(),
    arrivalTime: arrivalDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  };
}

/**
 * Generates the logical journeys for the Route Comparison screen.
 *
 * Normally this always returns all three categories: Efficient, Cheapest,
 * Hurry (see the module-level GUARANTEE comment above). The single
 * exception is a trip short enough that transit planning is pointless —
 * that case returns one direct walk/ojek option instead of three.
 */
export async function generateLogicalRouteOptions(origin: PlaceResult, destination: PlaceResult): Promise<LogicalRouteOption[]> {
  const directDistanceM = distanceMeters(origin, destination);
  const generatedAt = Date.now();

  // Very short trip: three categories would all just say "walk/ojek
  // there" — collapse to the one honest answer instead of padding the UI.
  if (directDistanceM < NEAR_TRIP_THRESHOLD_M) {
    const legs = await buildHurryLegs(origin, destination);
    const usesOjek = legs[0]?.mode === 'ojek';
    return [
      toLogicalOption(
        legs,
        'hurry',
        usesOjek ? 'Quick ojek' : 'Direct walk',
        usesOjek
          ? "It's close enough that a short ojek ride is simplest — public transit would take longer to set up."
          : "It's close enough to walk directly — no need for transit or ojek.",
        generatedAt
      ),
    ];
  }

  const allRoutes = await getAllRoutes();
  const efficientResult = await buildEfficientLegsWithFallback(origin, destination, allRoutes);
  const cheapestResult = await buildCheapestLegsWithFallback(origin, destination, allRoutes, efficientResult);
  const hurryLegs = await buildHurryLegs(origin, destination);

  // Moved console logs to run AFTER variables are fetched and evaluated
  console.log('Total routes loaded:', allRoutes.length, allRoutes.map(r => r.route_name));
  console.log('Efficient result:', efficientResult.usedFallback, efficientResult.legs.map(l => l.mode));
  console.log('Cheapest result:', cheapestResult.usedFallback, cheapestResult.legs.map(l => l.mode));

  const built: { legs: RouteLeg[]; category: RouteCategory; label: string; description: string }[] = [];

  // Efficient
  {
    const usesOjekFirstMile = efficientResult.legs[0]?.mode === 'ojek';
    let description: string;
    if (efficientResult.usedFallback) {
      description = 'No connecting transit route found for this trip — showing a direct ojek ride instead.';
    } else if (usesOjekFirstMile) {
      description = 'Ojek to the nearest fast station, then ride straight through — worth it since walking there would take too long.';
    } else {
      description = 'A short walk to the nearest fast station, then ride straight through.';
    }
    built.push({ legs: efficientResult.legs, category: 'efficient', label: 'Efficient', description });
  }

  // Cheapest
  {
    let description: string;
    if (cheapestResult.usedFallback === 'hurry') {
      description = 'No public transit reaches this trip directly — showing a direct ojek ride instead.';
    } else if (cheapestResult.usedFallback === 'efficient') {
      description = 'No cheaper transit alternative found — this matches the Efficient route.';
    } else {
      const transitLegCount = cheapestResult.legs.filter((l) => l.mode !== 'walk').length;
      const transferCount = Math.max(transitLegCount - 1, 0);
      description =
        transferCount > 0
          ? `Public transit only, with ${transferCount} transfer${transferCount === 1 ? '' : 's'} — lowest cost, more walking and waiting.`
          : 'A direct public transit ride — no ojek needed.';
    }
    built.push({ legs: cheapestResult.legs, category: 'cheapest', label: 'Cheapest', description });
  }

  // Hurry
  built.push({
    legs: hurryLegs,
    category: 'hurry',
    label: 'Hurry',
    description:
      hurryLegs[0]?.mode === 'ojek'
        ? 'Door-to-door ojek, no walking or transfers — costs more but gets there fastest.'
        : "Direct walk — it's close enough that anything else would be slower.",
  });

  return built.map(({ legs, category, label, description }) => toLogicalOption(legs, category, label, description, generatedAt));
}

/** High-level entry point used by the Route Comparison screen. */
export async function planAndCompareRoutes(origin: PlaceResult, destination: PlaceResult): Promise<LogicalRouteComparisonResult> {
  const options = await generateLogicalRouteOptions(origin, destination);
  return {
    options,
    efficient: options.find((o) => o.category === 'efficient') ?? null,
    cheapest: options.find((o) => o.category === 'cheapest') ?? null,
    hurry: options.find((o) => o.category === 'hurry') ?? null,
  };
}

/** Persists a route search + its selected journey legs to Supabase. */
export async function saveRouteSearch(
  userId: string,
  origin: PlaceResult,
  destination: PlaceResult,
  selectedOption?: RouteOption | LogicalRouteOption
) {
  const { data: search, error } = await supabase
    .from('route_searches')
    .insert({
      user_id: userId,
      origin: { lat: origin.lat, lng: origin.lng, label: origin.label },
      destination: { lat: destination.lat, lng: destination.lng, label: destination.label },
    })
    .select()
    .single();

  if (error) throw error;

  if (selectedOption) {
    const legRows = selectedOption.legs.map((leg, idx) => ({
      route_search_id: search.id,
      leg_order: idx,
      mode: leg.mode,
      route_label: leg.routeLabel ?? null,
      from_name: 'label' in leg.from ? leg.from.label : 'Origin',
      from_lat: leg.from.lat,
      from_lng: leg.from.lng,
      to_name: 'label' in leg.to ? leg.to.label : 'Destination',
      to_lat: leg.to.lat,
      to_lng: leg.to.lng,
      distance_m: leg.distanceM,
      duration_s: Math.round(leg.durationS),
      estimated_cost_idr: leg.estimatedCostIdr,
      is_transfer: leg.isTransfer,
    }));

    const { error: legError } = await supabase.from('journey_legs').insert(legRows);
    if (legError) throw legError;
  }

  return search;
}