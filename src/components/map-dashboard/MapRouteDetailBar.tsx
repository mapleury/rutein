import React from 'react';
import { Navigation, AlertTriangle, ChevronRight, Eye, Wallet } from 'lucide-react';
import type { DirectionsResult } from '@/services/mapService';
import type { PlaceResult } from '@/types/domain.types';

interface MapRouteDetailBarProps {
  destination: PlaceResult | null;
  directions: DirectionsResult | null;
  loading: boolean;
  travelMode?: 'walk' | 'ojek' | 'transit';
  budgetPreference?: 'cheapest' | 'fastest' | 'efficient';
  onOpenDetails?: () => void;
  onOpenPreview?: () => void;
  onCloseRoute?: () => void;
}

export function getRouteRoadName(label?: string, lat?: number, lng?: number): string {
  if (!label) return 'Jalur Utama Perkotaan';
  const l = label.toLowerCase();
  if (l.includes('fatmawati') || l.includes('cilandak') || l.includes('lotte')) return 'Jl. RS. Fatmawati Raya';
  if (l.includes('monas') || l.includes('merdeka') || l.includes('thamrin')) return 'Jl. M.H. Thamrin / Medan Merdeka';
  if (l.includes('sudirman') || l.includes('senayan') || l.includes('scbd')) return 'Jl. Jend. Sudirman';
  if (l.includes('tangerang') || l.includes('karawaci') || l.includes('banten')) return 'Jl. Tol Jakarta - Tangerang';
  if (l.includes('bogor') || l.includes('depok') || l.includes('jagorawi')) return 'Jl. Tol Jagorawi';
  if (l.includes('bekasi') || l.includes('cikampek') || l.includes('mbz')) return 'Jl. Tol Jakarta - Cikampek';
  if (l.includes('bandara') || l.includes('soekarno') || l.includes('cengkareng')) return 'Jl. Tol Sedyatmo (Bandara)';
  if (l.includes('daan mogot') || l.includes('kalideres') || l.includes('rawa buaya')) return 'Jl. Daan Mogot';
  if (l.includes('kebon jeruk') || l.includes('tomang') || l.includes('slipi')) return 'Jl. Letjen S. Parman';
  if (l.includes('blok m') || l.includes('kebayoran')) return 'Jl. Kyai Maja / Trunojoyo';
  if (l.includes('pangeran jayakarta') || l.includes('mangga dua') || l.includes('kota')) return 'Jl. Pangeran Jayakarta';
  return 'Jalur Utama Perkotaan';
}

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 1) return '<1 min';
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h} j ${m} m` : `${h} j`;
}

function formatDistance(meters: number): string {
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
}

export function estimateRouteCost(
  distanceM: number,
  travelMode: 'walk' | 'ojek' | 'transit' = 'transit',
  budgetPreference: 'cheapest' | 'fastest' | 'efficient' = 'efficient'
): { costText: string; detailLabel: string } {
  if (travelMode === 'walk') {
    return { costText: 'Gratis', detailLabel: 'Jalan Kaki' };
  }

  const km = distanceM / 1000;

  if (travelMode === 'ojek') {
    let base = 9000;
    let perKm = 2500;
    if (budgetPreference === 'cheapest') {
      base = 8000;
      perKm = 2000;
    } else if (budgetPreference === 'fastest') {
      base = 12000;
      perKm = 3200;
    }
    const cost = Math.max(9000, Math.round((base + km * perKm) / 500) * 500);
    return {
      costText: `Rp ${cost.toLocaleString('id-ID')}`,
      detailLabel: `Estimasi Ojek (${budgetPreference === 'cheapest' ? 'Murah' : budgetPreference === 'fastest' ? 'Cepat' : 'Efisien'})`,
    };
  }

  // Public Transit
  if (budgetPreference === 'cheapest') {
    const cost = km > 15 ? 4000 : 3500;
    return {
      costText: `Rp ${cost.toLocaleString('id-ID')}`,
      detailLabel: 'Tarif Paling Murah',
    };
  }

  if (budgetPreference === 'fastest') {
    const cost = Math.min(24000, Math.max(7500, Math.round((7500 + km * 420) / 500) * 500));
    return {
      costText: `Rp ${cost.toLocaleString('id-ID')}`,
      detailLabel: 'Tarif Paling Cepat',
    };
  }

  // Efficient (balanced)
  const cost = Math.min(18000, Math.max(5000, Math.round((4500 + km * 280) / 500) * 500));
  return {
    costText: `Rp ${cost.toLocaleString('id-ID')}`,
    detailLabel: 'Tarif Paling Efisien',
  };
}

export default function MapRouteDetailBar({
  destination,
  directions,
  loading,
  travelMode = 'transit',
  budgetPreference = 'efficient',
  onOpenDetails,
  onOpenPreview,
  onCloseRoute,
}: MapRouteDetailBarProps) {
  if (!destination) return null;

  const roadName = getRouteRoadName(destination.label, destination.lat, destination.lng);

  return (
    <div style={cardWrapperStyle}>
      <div style={headerRowStyle}>
        <div style={destinationLabelGroup}>
          <Navigation size={16} color="#DA362A" />
          <span style={destinationTitleStyle}>via {roadName} (Menuju {destination.label})</span>
        </div>
        {onCloseRoute && (
          <button onClick={onCloseRoute} style={closeBtnStyle}>
            ✕
          </button>
        )}
      </div>

      {loading ? (
        <div style={statusTextStyle}>Menghitung rute perjalanan...</div>
      ) : directions ? (
        <>
          <div style={metricsRowStyle}>
            <span style={durationBadgeStyle}>{formatDuration(directions.durationS)}</span>
            <span style={distanceTextStyle}>{formatDistance(directions.distanceM)}</span>
          </div>

          {/* Budget Estimation directly below duration and distance */}
          {(() => {
            const { costText, detailLabel } = estimateRouteCost(
              directions.distanceM,
              travelMode,
              budgetPreference
            );
            return (
              <div style={costEstimationRowStyle}>
                <div style={costBadgeGroupStyle}>
                  <Wallet size={14} color="#059669" />
                  <span style={costLabelStyle}>Estimasi Biaya:</span>
                  <span style={costValueStyle}>{costText}</span>
                </div>
                <span style={costDetailTagStyle}>({detailLabel})</span>
              </div>
            );
          })()}

          <div style={warningNoticeStyle}>
            <AlertTriangle size={13} color="#F5A623" />
            <span>Rute ini memiliki tol / lintasan berbayar.</span>
          </div>

          <div style={actionsRowStyle}>
            <button onClick={onOpenDetails} style={detailsBtnStyle}>
              Details
            </button>
            <button onClick={onOpenPreview} style={previewBtnStyle}>
              <Eye size={14} />
              <span>Preview 360°</span>
            </button>
          </div>
        </>
      ) : (
        <div style={statusTextStyle}>Pilih lokasi awal untuk melihat rute lengkap.</div>
      )}
    </div>
  );
}

// STYLES
const cardWrapperStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 20,
  left: 20,
  zIndex: 'var(--z-panel)',
  width: 360,
  maxWidth: 'calc(100vw - 120px)',
  background: '#FFFFFF',
  borderRadius: 16,
  padding: 16,
  boxShadow: 'var(--shadow-floating)',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  animation: 'slideUpFade 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
};

const headerRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const destinationLabelGroup: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const destinationTitleStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: '#1E1E1E',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: 280,
};

const closeBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  fontSize: 12,
  color: '#888',
  cursor: 'pointer',
};

const metricsRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 10,
};

const durationBadgeStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 800,
  color: '#16A34A',
};

const distanceTextStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: '#666666',
};

const warningNoticeStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 11,
  color: '#D97706',
  background: 'rgba(245, 166, 35, 0.1)',
  padding: '4px 8px',
  borderRadius: 6,
};

const actionsRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  marginTop: 2,
};

const detailsBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: '8px 14px',
  borderRadius: 8,
  border: '1px solid #E5E5E5',
  background: '#F9F9F9',
  color: '#1E1E1E',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
};

const previewBtnStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  padding: '8px 14px',
  borderRadius: 8,
  border: 'none',
  background: '#DA362A',
  color: '#FFFFFF',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
};

const statusTextStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#666666',
  fontStyle: 'italic',
};

const costEstimationRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  background: '#ECFDF5',
  border: '1px solid #A7F3D0',
  borderRadius: 10,
  padding: '6px 10px',
  marginTop: 2,
};

const costBadgeGroupStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

const costLabelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: '#047857',
};

const costValueStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 800,
  color: '#065F46',
};

const costDetailTagStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: '#047857',
  opacity: 0.9,
};
