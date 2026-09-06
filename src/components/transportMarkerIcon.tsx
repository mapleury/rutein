import React from 'react';
import { Bus, TrainFront, TramFront, Train, Ship, Building2, PlaneTakeoff, MapPin, Bike, Footprints } from 'lucide-react';
import type { IndonesiaTransportType } from '@/data/indonesiaTransportData';
import type { TransportMode } from '@/types/database.types';

export const TRANSPORT_TYPE_COLOR: Record<IndonesiaTransportType, string> = {
  transjakarta: '#E4032E',
  bus: '#F97316',
  krl: '#EF5B25',
  mrt: '#0072BC',
  lrt: '#7B2CBF',
  train: '#16A34A',
  airport_rail: '#0EA5E9',
  ferry: '#06B6D4',
  terminal: '#64748B',
  other: '#90A0BE',
};

type IconComponent = React.ComponentType<any>;

const TRANSPORT_TYPE_ICON: Record<IndonesiaTransportType, IconComponent> = {
  transjakarta: Bus,
  bus: Bus,
  krl: TrainFront,
  mrt: TramFront,
  lrt: Train,
  train: TrainFront,
  airport_rail: PlaneTakeoff,
  ferry: Ship,
  terminal: Building2,
  other: MapPin,
};

interface Props {
  type: IndonesiaTransportType;
  /** Slightly larger + a highlight ring when the marker is hovered/selected. */
  highlighted?: boolean;
}

/**
 * Renders a transport-type marker as a live React element, meant to sit
 * inside a react-map-gl <Marker>. MapLibre markers (unlike Leaflet's
 * L.DivIcon) accept real JSX children directly, so there's no need to
 * pre-render icons to an HTML string and hand that to an imperative API —
 * that indirection in the old Leaflet version was the likely source of the
 * "images just don't show" flakiness. This is a plain, cacheable component.
 */
export default function TransportMarkerIcon({ type, highlighted = false }: Props) {
  const color = TRANSPORT_TYPE_COLOR[type] ?? TRANSPORT_TYPE_COLOR.other;
  const Icon = TRANSPORT_TYPE_ICON[type] ?? TRANSPORT_TYPE_ICON.other;
  const size = highlighted ? 30 : 24;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        border: '2px solid #FFFFFF',
        boxShadow: highlighted ? '0 0 0 5px rgba(255,255,255,0.15), 0 2px 6px rgba(0,0,0,0.4)' : '0 2px 5px rgba(0,0,0,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'box-shadow 120ms ease',
      }}
    >
      <Icon size={Math.round(size * 0.55)} color="#fff" strokeWidth={2.5} />
    </div>
  );
}

// ------------------------------------------------------------------
// Leg-mode styling — used on the Map page to render a computed
// RouteOption's legs (walk / bus / ojek / etc.), as opposed to the static
// station dataset above which is keyed by IndonesiaTransportType instead
// of TransportMode. Two separate keyspaces because a leg's `mode` field
// (TransportMode) and a station's `type` field (IndonesiaTransportType)
// aren't quite the same enum — e.g. legs have 'walk' and 'ojek', stations
// don't.
// ------------------------------------------------------------------

export const LEG_MODE_COLOR: Record<TransportMode, string> = {
  walk: '#38BDF8',
  bus: '#F97316',
  transjakarta: '#E4032E',
  mrt: '#0072BC',
  krl: '#EF5B25',
  lrt: '#7B2CBF',
  train: '#16A34A',
  airport_rail: '#0EA5E9',
  ferry: '#06B6D4',
  ojek: '#22C55E',
  other: '#64748B',
};

const LEG_MODE_ICON: Record<TransportMode, IconComponent> = {
  walk: Footprints,
  bus: Bus,
  transjakarta: Bus,
  mrt: TramFront,
  krl: TrainFront,
  lrt: Train,
  train: TrainFront,
  airport_rail: PlaneTakeoff,
  ferry: Ship,
  ojek: Bike,
  other: MapPin,
};

/** Small colored pin+icon marker for a single route leg, used on the itinerary map. */
export function LegModeMarker({ mode }: { mode: TransportMode }) {
  const color = LEG_MODE_COLOR[mode] ?? LEG_MODE_COLOR.other;
  const Icon = LEG_MODE_ICON[mode] ?? LEG_MODE_ICON.other;

  return (
    <div
      style={{
        width: 26,
        height: 26,
        borderRadius: '50%',
        background: color,
        border: '2px solid #FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 5px rgba(0,0,0,0.35)',
      }}
    >
      <Icon size={14} color="#fff" strokeWidth={2.5} />
    </div>
  );
}