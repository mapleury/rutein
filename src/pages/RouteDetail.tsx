import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import LiveGpsModal from '@/components/LiveGpsModal';
import type { PlaceResult, RouteOption } from '@/types/domain.types';

const MODE_ICON: Record<string, string> = {
  walk: '🚶',
  bus: '🚌',
  transjakarta: '🚍',
  mrt: '🚇',
  krl: '🚆',
  lrt: '🚈',
  ojek: '🛵',
  other: '🚏',
};

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

function formatCost(idr: number): string {
  return idr === 0 ? 'Free' : `Rp${idr.toLocaleString('id-ID')}`;
}

function legModeLabel(mode: string): string {
  switch (mode) {
    case 'walk': return 'Walk';
    case 'ojek': return 'Ojek online';
    default: return mode;
  }
}
export default function RouteDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { origin?: PlaceResult; destination?: PlaceResult; option?: RouteOption } | null;
  const [showGpsModal, setShowGpsModal] = useState(false);

  if (!state?.option) {
    return (
      <div className="container" style={{ paddingTop: 36, paddingBottom: 80 }}>
        <h1>Route not found</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>
          This route's details aren't available directly by link yet — go back to Route Comparison and select a route again.
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/routes')}>
          Back to Route Comparison
        </button>
      </div>
    );
  }

  const { origin, destination, option } = state;
  const now = new Date();
  const arrival = new Date(now.getTime() + option.totalDurationS * 1000);

  const waypoints = option.legs.map((leg, i) => ({
    lat: leg.to.lat,
    lng: leg.to.lng,
    label: 'label' in leg.to ? leg.to.label : `Stop ${i + 1}`,
  }));

  return (
    <div className="container" style={{ paddingTop: 28, paddingBottom: 80 }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--color-primary)',
          marginBottom: 14,
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          padding: 0,
        }}
      >
        ← Back to routes
      </button>

      <h1 style={{ fontSize: 'clamp(26px, 4vw, 34px)', marginBottom: 6 }}>Route summary</h1>
      <div className="card" style={{ marginBottom: 24, background: '#FFFFFF', borderRadius: 16, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>From</span>
          <strong style={{ fontSize: 13, color: 'var(--color-text)' }}>{origin?.label ?? 'Origin'}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>To</span>
          <strong style={{ fontSize: 13, color: 'var(--color-text)' }}>{destination?.label ?? 'Destination'}</strong>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
            textAlign: 'center',
            background: 'var(--color-surface-raised)',
            padding: '14px 8px',
            borderRadius: 12,
            border: '1px solid var(--color-border)',
          }}
        >
          <Stat label="Duration" value={formatDuration(option.totalDurationS)} />
          <Stat label="Cost" value={formatCost(option.totalCostIdr)} />
          <Stat label="Transfers" value={String(option.transfers)} />
        </div>
        <p style={{ marginTop: 14, marginBottom: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>
          Estimated arrival: {arrival.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      <h3 style={{ fontSize: 18, marginBottom: 16 }}>Step-by-step directions</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {option.legs.map((leg, i) => (
          <div key={i} style={{ display: 'flex', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={stepDot}>{MODE_ICON[leg.mode] ?? '🚏'}</div>
              {i < option.legs.length - 1 && <div style={stepLine} />}
            </div>
            <div className="card" style={{ flex: 1, marginBottom: 14, background: '#FFFFFF', borderRadius: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong style={{ fontSize: 14, color: 'var(--color-text)' }}>{leg.routeLabel ?? legModeLabel(leg.mode)}</strong>
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{formatDuration(leg.durationS)}</span>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>{leg.instructions}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: 'var(--color-text)' }}>
                <span>{Math.round(leg.distanceM)}m</span>
                <span style={{ fontWeight: 600 }}>{formatCost(leg.estimatedCostIdr)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        className="btn btn-secondary"
        style={{ width: '100%', marginTop: 8, padding: '12px', borderRadius: 12 }}
        onClick={() => navigate('/map', { state: { option, origin, destination } })}
      >
        View route on map
      </button>

      <button
        className="btn btn-primary"
        style={{ width: '100%', marginTop: 10, padding: '12px', borderRadius: 12 }}
        onClick={() => setShowGpsModal(true)}
      >
        Track this journey live
      </button>

      {showGpsModal && <LiveGpsModal waypoints={waypoints} onClose={() => setShowGpsModal(false)} />}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-text)' }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 2 }}>{label}</div>
    </div>
  );
}

const stepDot: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: '50%',
  background: '#FDF0ED',
  border: '1.5px solid var(--color-border)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 16,
};

const stepLine: React.CSSProperties = {
  width: 2,
  flex: 1,
  background: 'var(--color-border)',
  minHeight: 14,
};