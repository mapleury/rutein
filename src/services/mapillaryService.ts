import type { GeoPoint } from '@/types/domain.types';

const GRAPH_API_BASE = 'https://graph.mapillary.com/images';

const SEARCH_RADII_M = [100, 300, 800, 2000];

export type MapillaryLookupResult =
  | { status: 'found'; imageId: string }
  | { status: 'not_found' }
  | { status: 'missing_token' }
  | { status: 'error'; message: string };

function getMapillaryToken(): string | undefined {
  return import.meta.env.VITE_MAPILLARY_TOKEN as string | undefined;
}

function bboxAround(point: GeoPoint, radiusM: number): string {
  const latDelta = radiusM / 111_000;
  const lngDelta = radiusM / (111_000 * Math.cos((point.lat * Math.PI) / 180));
  const minLng = point.lng - lngDelta;
  const minLat = point.lat - latDelta;
  const maxLng = point.lng + lngDelta;
  const maxLat = point.lat + latDelta;
  return `${minLng},${minLat},${maxLng},${maxLat}`;
}

export async function findNearestImage(point: GeoPoint): Promise<MapillaryLookupResult> {
  const token = getMapillaryToken();
  if (!token) {
    return { status: 'missing_token' };
  }

  for (const radiusM of SEARCH_RADII_M) {
    try {
      const url = new URL(GRAPH_API_BASE);
      url.searchParams.set('access_token', token);
      url.searchParams.set('fields', 'id,computed_geometry');
      url.searchParams.set('bbox', bboxAround(point, radiusM));
      url.searchParams.set('limit', '1');

      const res = await fetch(url.toString());

      if (!res.ok) {
        if (res.status === 401 || res.status === 400) {
          return { status: 'error', message: 'Mapillary rejected the request — check that VITE_MAPILLARY_TOKEN is a valid client token.' };
        }
        continue;
      }

      const data = await res.json();
      const first = data?.data?.[0];
      if (first?.id) {
        return { status: 'found', imageId: first.id };
      }
    } catch {
      continue;
    }
  }

  return { status: 'not_found' };
}
