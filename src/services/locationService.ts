import type { GeoPoint } from '@/types/domain.types';

export type GeoErrorType = 'permission_denied' | 'position_unavailable' | 'timeout' | 'unsupported';

export interface GeoServiceError {
  type: GeoErrorType;
  message: string;
}

function mapGeolocationError(err: GeolocationPositionError): GeoServiceError {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return { type: 'permission_denied', message: 'Location permission was denied.' };
    case err.POSITION_UNAVAILABLE:
      return { type: 'position_unavailable', message: 'Current location is unavailable.' };
    case err.TIMEOUT:
      return { type: 'timeout', message: 'Location request timed out.' };
    default:
      return { type: 'position_unavailable', message: err.message };
  }
}

export function isGeolocationSupported(): boolean {
  return typeof navigator !== 'undefined' && 'geolocation' in navigator;
}

export async function fetchIpGeolocation(): Promise<GeoPoint> {
  try {
    const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      if (data.latitude && data.longitude) {
        return { lat: data.latitude, lng: data.longitude };
      }
    }
  } catch { }

  return { lat: -6.2088, lng: 106.8456 };
}

export function getCurrentPosition(): Promise<GeoPoint> {
  return new Promise((resolve) => {
    if (!isGeolocationSupported()) {
      fetchIpGeolocation().then(resolve);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        fetchIpGeolocation().then(resolve);
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 5000 }
    );
  });
}

export function watchPosition(
  onUpdate: (point: GeoPoint, accuracyM: number) => void,
  onError: (error: GeoServiceError) => void
): () => void {
  if (!isGeolocationSupported()) {
    onError({ type: 'unsupported', message: 'Geolocation is not supported by this browser.' });
    return () => { };
  }

  const watchId = navigator.geolocation.watchPosition(
    (pos) => onUpdate({ lat: pos.coords.latitude, lng: pos.coords.longitude }, pos.coords.accuracy),
    (err) => onError(mapGeolocationError(err)),
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 2000 }
  );

  return () => navigator.geolocation.clearWatch(watchId);
}

export function distanceMeters(a: GeoPoint, b: GeoPoint): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}
