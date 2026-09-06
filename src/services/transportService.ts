import { supabase } from '@/lib/supabaseClient';
import type {
  TransportRoute,
  TransportStop,
  TransportSchedule,
  Disruption,
  TransportMode,
} from '@/types/database.types';
import { handleSupabaseError } from './supabaseService';
import { distanceMeters } from './locationService';
import type { GeoPoint } from '@/types/domain.types';

export async function getAllRoutes(): Promise<TransportRoute[]> {
  const { data, error } = await supabase.from('transport_routes').select('*').eq('is_active', true);
  if (error) handleSupabaseError('getAllRoutes', error);
  return data ?? [];
}

export async function getStopsForRoute(routeId: string): Promise<TransportStop[]> {
  const { data, error } = await supabase
    .from('transport_stops')
    .select('*')
    .eq('route_id', routeId)
    .order('sequence_order', { ascending: true });
  if (error) handleSupabaseError('getStopsForRoute', error);
  return data ?? [];
}

export interface NearbyTransportStop extends TransportStop {
  distanceM: number;
  transport_routes: Pick<TransportRoute, 'mode' | 'route_name' | 'route_code'> | null;
}

export async function findNearbyStops(
  point: GeoPoint,
  radiusM = 800
): Promise<NearbyTransportStop[]> {
  const degDelta = radiusM / 111_000;
  const { data, error } = await supabase
    .from('transport_stops')
    .select('*, transport_routes(mode, route_name, route_code)')
    .gte('latitude', point.lat - degDelta)
    .lte('latitude', point.lat + degDelta)
    .gte('longitude', point.lng - degDelta)
    .lte('longitude', point.lng + degDelta);

  if (error) handleSupabaseError('findNearbyStops', error);

  return (data ?? [])
    .map((stop: any) => ({
      ...stop,
      distanceM: distanceMeters(point, { lat: stop.latitude, lng: stop.longitude }),
    }))
    .filter((stop: NearbyTransportStop) => stop.distanceM <= radiusM)
    .sort((a: NearbyTransportStop, b: NearbyTransportStop) => a.distanceM - b.distanceM);
}

export async function getSchedulesForRoute(routeId: string): Promise<TransportSchedule[]> {
  const { data, error } = await supabase
    .from('transport_schedules')
    .select('*')
    .eq('route_id', routeId)
    .order('scheduled_departure', { ascending: true });
  if (error) handleSupabaseError('getSchedulesForRoute', error);
  return data ?? [];
}

export async function getActiveDisruptions(): Promise<Disruption[]> {
  const { data, error } = await supabase
    .from('disruptions')
    .select('*')
    .in('status', ['active', 'monitoring'])
    .order('severity', { ascending: false })
    .order('starts_at', { ascending: false });
  if (error) handleSupabaseError('getActiveDisruptions', error);
  return data ?? [];
}

export function subscribeToDisruptions(onChange: (disruption: Disruption) => void): () => void {
  const channel = supabase
    .channel('disruptions-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'disruptions' },
      (payload) => onChange(payload.new as Disruption)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToScheduleUpdates(routeId: string, onChange: (schedule: TransportSchedule) => void): () => void {
  const channel = supabase
    .channel(`schedules-${routeId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'transport_schedules', filter: `route_id=eq.${routeId}` },
      (payload) => onChange(payload.new as TransportSchedule)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}