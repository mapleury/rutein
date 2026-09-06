import { searchPlaces } from '@/services/geocodingService';
import { planAndCompareRoutes } from '@/services/routeService';
import type { GpsPosition } from '@/types/confusedMode.types';
import type {
  AIContextNavigationResult,
  NavigationResolutionStatus,
} from '@/types/confusedMode.types';

interface PlaceResultLike {
  lat: number;
  lng: number;
  label: string;
  address: string;
  placeId: string;
}

export interface ResolveNavigationResult {
  status: NavigationResolutionStatus;
  navigationResult: AIContextNavigationResult | null;
}

const DEFAULT_JAKARTA_ORIGIN: GpsPosition = {
  latitude: -6.2088,
  longitude: 106.8456,
  accuracy: 10,
};

export async function resolveNavigationForQuery(
  destinationQuery: string,
  origin: GpsPosition | null,
  originAddress: string | null
): Promise<ResolveNavigationResult> {
  const activeOrigin = origin || DEFAULT_JAKARTA_ORIGIN;

  let candidates: PlaceResultLike[];

  try {
    candidates = (await searchPlaces(destinationQuery, 5)) as PlaceResultLike[];
  } catch (error) {
    console.warn('Destination geocoding failed:', error);
    return { status: 'error', navigationResult: null };
  }

  if (!candidates || candidates.length === 0) {
    return { status: 'not_found', navigationResult: null };
  }

  const destination = candidates[0];

  const originPlace: PlaceResultLike = {
    lat: activeOrigin.latitude,
    lng: activeOrigin.longitude,
    label: origin ? 'Lokasi Terkini Pengguna' : 'Stasiun Sudirman (Default)',
    address: originAddress ?? 'Sudirman, Jakarta',
    placeId: 'current-location',
  };

  try {
    const comparison = await planAndCompareRoutes(
      originPlace as unknown as Parameters<typeof planAndCompareRoutes>[0],
      destination as unknown as Parameters<typeof planAndCompareRoutes>[1]
    );

    if (comparison.options.length === 0) {
      return { status: 'not_found', navigationResult: null };
    }

    const navigationResult: AIContextNavigationResult = {
      destinationQuery,
      resolvedDestination: {
        name: destination.label,
        address: destination.address,
        latitude: destination.lat,
        longitude: destination.lng,
      },
      options: comparison.options.map((option) => ({
        category: option.category,
        label: option.label,
        description: option.description,
        totalDistanceMeters: Math.round(option.totalDistanceM),
        totalDurationSeconds: Math.round(option.totalDurationS),
        totalCostIdr: option.totalCostIdr,
        transfers: option.transfers,
        arrivalTime: option.arrivalTime,
        legs: option.legs.map((leg) => ({
          mode: leg.mode,
          routeLabel: leg.routeLabel ?? null,
          fromLabel: 'label' in leg.from ? (leg.from.label as string | undefined) ?? null : null,
          toLabel: 'label' in leg.to ? (leg.to.label as string | undefined) ?? null : null,
          distanceMeters: Math.round(leg.distanceM),
          durationSeconds: Math.round(leg.durationS),
          estimatedCostIdr: leg.estimatedCostIdr,
          instructions: leg.instructions ?? '',
        })),
      })),
    };

    return { status: 'resolved', navigationResult };
  } catch (error) {
    console.warn('Route planning failed:', error);
    return { status: 'error', navigationResult: null };
  }
}