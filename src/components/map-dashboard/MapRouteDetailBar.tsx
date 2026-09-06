import React, { useState, useEffect } from 'react';
import {
  Navigation,
  AlertTriangle,
  Eye,
  Wallet,
  Bus,
  Train,
  Zap,
  DollarSign,
  Sliders,
  X,
  Footprints,
  Bike,
} from 'lucide-react';
import type { DirectionsResult } from '@/services/mapService';
import type { PlaceResult, GeoPoint } from '@/types/domain.types';
import { generateLogicalRouteOptions, type LogicalRouteOption, type RouteCategory } from '@/services/routeService';
import { useLanguage } from '@/contexts/LanguageContext';

interface MapRouteDetailBarProps {
  origin?: PlaceResult | GeoPoint | null;
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

function formatCost(costIdr: number): string {
  if (costIdr === 0) return 'Gratis';
  return `Rp ${costIdr.toLocaleString('id-ID')}`;
}

export default function MapRouteDetailBar({
  origin,
  destination,
  directions,
  loading,
  budgetPreference = 'efficient',
  onOpenDetails,
  onOpenPreview,
  onCloseRoute,
}: MapRouteDetailBarProps) {
  const { t } = useLanguage();
  const [phase, setPhase] = useState<'compact' | 1 | 2>('compact');
  const [routeOptions, setRouteOptions] = useState<LogicalRouteOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<RouteCategory | null>(null);

  useEffect(() => {
    if (!destination) {
      setRouteOptions([]);
      setPhase('compact');
      setSelectedCategory(null);
      return;
    }
    const orig: PlaceResult = origin ? {
      lat: origin.lat,
      lng: origin.lng,
      label: (origin as any).label || 'Lokasi Saya',
      address: (origin as any).address || (origin as any).label || 'Lokasi Saya',
    } : {
      lat: -6.2088,
      lng: 106.8456,
      label: 'Lokasi Saya',
      address: 'Lokasi Saya',
    };
    setLoadingOptions(true);

    generateLogicalRouteOptions(orig, destination)
      .then((opts) => {
        setRouteOptions(opts);
      })
      .catch((err) => {
        console.error('Failed to load route comparison options:', err);
      })
      .finally(() => {
        setLoadingOptions(false);
      });
  }, [destination, origin]);

  if (!destination) return null;

  const roadName = getRouteRoadName(destination.label, destination.lat, destination.lng);
  const activeOption = selectedCategory
    ? routeOptions.find((o) => o.category === selectedCategory) || null
    : null;

  const handleOpenPhase1 = () => {
    setPhase(1);
    if (onOpenDetails) onOpenDetails();
  };

  const handleNextToPhase2 = () => {
    if (!selectedCategory && routeOptions.length > 0) {
      const prefCategory: RouteCategory = budgetPreference === 'fastest' ? 'hurry' : (budgetPreference as RouteCategory);
      const defaultCat = routeOptions.find((o) => o.category === prefCategory)
        ? prefCategory
        : routeOptions[0].category;
      setSelectedCategory(defaultCat);
    }
    setPhase(2);
  };

  const handleBackToPhase1 = () => {
    setPhase(1);
  };

  const handleClose = () => {
    setPhase('compact');
    if (onCloseRoute) onCloseRoute();
  };

  return (
    <div
      className={`route-detail-card ${phase !== 'compact' ? 'route-detail-expanded' : 'route-detail-compact'}`}
      style={phase !== 'compact' ? expandedCardWrapperStyle : compactCardWrapperStyle}
    >
      <style>{routeDetailStyles}</style>

      {/* Mobile drag handle indicator */}
      <div className="route-drag-handle" />

      <div style={headerRowStyle}>
        <div style={destinationLabelGroup}>
          <Navigation size={16} color="#DA362A" style={{ flexShrink: 0, marginTop: 2 }} />
          <span
            className={phase === 'compact' ? 'route-dest-title-compact' : ''}
            style={phase !== 'compact' ? expandedDestinationTitleStyle : compactDestinationTitleStyle}
          >
            via {roadName} (Menuju {destination.label})
          </span>
        </div>
        {onCloseRoute && (
          <button onClick={handleClose} style={closeBtnStyle} title="Tutup">
            <X size={16} color="#666" />
          </button>
        )}
      </div>

      {loading ? (
        <div style={statusTextStyle}>Menghitung rute perjalanan...</div>
      ) : phase === 1 ? (
        <div style={expandedContentStyle}>
          <div style={categoryGridStyle}>
            {loadingOptions ? (
              <div style={statusTextStyle}>Memuat opsi perbandingan rute...</div>
            ) : (
              routeOptions.map((opt) => {
                const isSelected = selectedCategory === opt.category;
                let catLabel = t('detail_bar.efficient');
                let CatIcon = Sliders;
                let catColor = '#059669';

                if (opt.category === 'cheapest') {
                  catLabel = t('detail_bar.cheapest');
                  CatIcon = DollarSign;
                  catColor = '#2563EB';
                } else if (opt.category === 'hurry') {
                  catLabel = t('detail_bar.hurry');
                  CatIcon = Zap;
                  catColor = '#DA362A';
                }

                const transfersCount = opt.transfers ?? (opt as any).transfersCount ?? 0;
                const transitText = transfersCount === 0 ? '0 Transit' : `${transfersCount} Transit`;

                return (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedCategory(opt.category)}
                    style={{
                      ...categoryCardStyle,
                      borderColor: isSelected ? catColor : '#E5E7EB',
                      backgroundColor: isSelected ? `${catColor}08` : '#FFFFFF',
                      boxShadow: isSelected ? `0 4px 14px ${catColor}25` : '0 2px 6px rgba(0,0,0,0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <CatIcon size={15} color={isSelected ? catColor : '#6B7280'} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: isSelected ? catColor : '#374151' }}>
                          {catLabel}
                        </span>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>
                        {formatCost(opt.totalCostIdr)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#6B7280', marginTop: 4 }}>
                      <span>🕒 {formatDuration(opt.totalDurationS)}</span>
                      <span>•</span>
                      <span>🔄 {transitText}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div style={routeSummaryBoxStyle}>
            <div style={addressRowStyle}>
              <span style={addressLabelStyle}>{t('detail_bar.from')}:</span>
              <span style={addressValStyle}>{(origin as PlaceResult)?.label || 'Lokasi Saya'}</span>
            </div>
            <div style={addressRowStyle}>
              <span style={addressLabelStyle}>{t('detail_bar.to')}:</span>
              <span style={addressValStyle}>{destination.label}</span>
            </div>
            <div style={summaryMetricsGridStyle}>
              <div style={metricItemStyle}>
                <span style={metricLabelStyle}>{t('detail_bar.duration')}</span>
                <span style={{ ...metricValStyle, color: '#059669' }}>
                  {activeOption ? formatDuration(activeOption.totalDurationS) : '--'}
                </span>
              </div>
              <div style={metricItemStyle}>
                <span style={metricLabelStyle}>{t('detail_bar.cost')}</span>
                <span style={{ ...metricValStyle, color: '#DA362A' }}>
                  {activeOption ? formatCost(activeOption.totalCostIdr) : '--'}
                </span>
              </div>
              <div style={metricItemStyle}>
                <span style={metricLabelStyle}>{t('detail_bar.transfers')}</span>
                <span style={{ ...metricValStyle, color: '#3B82F6' }}>
                  {activeOption ? (activeOption.transfers ?? (activeOption as any).transfersCount ?? 0) : '0'}
                </span>
              </div>
            </div>
          </div>

          <div style={actionsRowStyle}>
            <button onClick={handleNextToPhase2} style={detailsBtnStyle}>
              {t('detail_bar.next')}
            </button>
            <button onClick={onOpenPreview} style={previewBtnStyle}>
              <Eye size={14} />
              <span>Preview 360°</span>
            </button>
          </div>
        </div>
      ) : phase === 2 ? (
        <div style={expandedContentStyle}>
          {activeOption && activeOption.legs && activeOption.legs.length > 0 ? (
            <div style={stepListContainerStyle}>
              <div style={stepListHeaderStyle}>
                <span>{t('detail_bar.step_by_step')}</span>
              </div>

              <div style={timelineWrapperStyle}>
                {activeOption.legs.map((leg, index) => {
                  let StepIcon = Footprints;
                  let stepColor = '#6B7280';
                  let stepTitle = 'Jalan Kaki';

                  if (leg.mode === 'mrt' || leg.mode === 'krl' || leg.mode === 'lrt') {
                    StepIcon = Train;
                    stepColor = '#2563EB';
                    stepTitle = leg.routeLabel || 'Kereta / Rail';
                  } else if (leg.mode === 'transjakarta' || leg.mode === 'bus') {
                    StepIcon = Bus;
                    stepColor = '#D97706';
                    stepTitle = leg.routeLabel || 'TransJakarta / Bus';
                  } else if (leg.mode === 'ojek') {
                    StepIcon = Bike;
                    stepColor = '#059669';
                    stepTitle = 'Ojek Online Direct';
                  }

                  const fromName = 'label' in leg.from ? leg.from.label : 'Point';
                  const toName = 'label' in leg.to ? leg.to.label : 'Point';

                  return (
                    <div key={index} style={timelineItemStyle}>
                      <div style={timelineBadgeColumnStyle}>
                        <div style={{ ...timelineIconBadgeStyle, backgroundColor: `${stepColor}15`, color: stepColor }}>
                          <StepIcon size={14} />
                        </div>
                        {index < activeOption.legs.length - 1 && <div style={timelineLineStyle} />}
                      </div>

                      <div style={timelineContentStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={stepTitleStyle}>{stepTitle}</span>
                          <span style={stepCostStyle}>{formatCost(leg.estimatedCostIdr)}</span>
                        </div>
                        <p style={stepDescStyle}>
                          {leg.mode === 'walk'
                            ? `Jalan kaki menuju ${toName}`
                            : `Naik ${stepTitle} dari ${fromName} ke ${toName}`}
                        </p>
                        <div style={stepMetaRowStyle}>
                          <span>⏱️ {formatDuration(leg.durationS)}</span>
                          <span>•</span>
                          <span>📏 {formatDistance(leg.distanceM)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={statusTextStyle}>Memuat rincian langkah rute...</div>
          )}

          <div style={actionsRowStyle}>
            <button onClick={handleBackToPhase1} style={detailsBtnStyle}>
              {t('detail_bar.back')}
            </button>
            <button onClick={onOpenPreview} style={previewBtnStyle}>
              <Eye size={14} />
              <span>Preview 360°</span>
            </button>
          </div>
        </div>
      ) : directions ? (
        <>
          <div style={metricsRowStyle}>
            <span style={durationBadgeStyle}>{formatDuration(directions.durationS)}</span>
            <span style={distanceTextStyle}>{formatDistance(directions.distanceM)}</span>
          </div>

          {(() => {
            const cost = activeOption ? activeOption.totalCostIdr : 'Rp.000';
            return (
              <div style={costEstimationRowStyle}>
                <div style={costBadgeGroupStyle}>
                  <Wallet size={14} color="#059669" />
                  <span style={costLabelStyle}>Pilih opsi rute untuk melihat estimasi biaya</span>

                </div>
                <span style={costDetailTagStyle}>
                  ({budgetPreference === 'cheapest' ? 'Murah' : budgetPreference === 'fastest' ? 'Cepat' : 'Efisien'})
                </span>
              </div>
            );
          })()}

          <div style={warningNoticeStyle}>
            <AlertTriangle size={13} color="#F5A623" />
            <span>Rute ini memiliki tol / lintasan berbayar.</span>
          </div>

          <div style={actionsRowStyle}>
            <button onClick={handleOpenPhase1} style={detailsBtnStyle}>
              {t('detail_bar.show_details')}
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
const routeDetailStyles = `
  .route-drag-handle {
    display: none;
  }
  @media (max-width: 767px) {
    .route-drag-handle {
      display: block;
      width: 38px;
      height: 4.5px;
      background: #D1D5DB;
      border-radius: 999px;
      margin: 0 auto 10px auto;
      flex-shrink: 0;
    }
    .route-detail-card {
      position: fixed !important;
      bottom: 0 !important;
      left: 0 !important;
      right: 0 !important;
      width: 100% !important;
      max-width: 100% !important;
      border-radius: 22px 22px 0 0 !important;
      box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.22) !important;
      z-index: 9995 !important;
      padding: 12px 16px 24px 16px !important;
      box-sizing: border-box !important;
      animation: slideUpRouteMobile 0.28s cubic-bezier(0.16, 1, 0.3, 1) !important;
    }
    .route-detail-expanded {
      max-height: 80dvh !important;
      overflow-y: auto !important;
    }
    .route-detail-compact {
      max-height: none !important;
    }
    .route-dest-title-compact {
      max-width: calc(100vw - 110px) !important;
    }
  }

  @keyframes slideUpRouteMobile {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }
`;

const compactCardWrapperStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 20,
  left: 20,
  zIndex: 'var(--z-panel)',
  width: 360,
  maxWidth: 'calc(100vw - 120px)',
  background: '#FFFFFF',
  borderRadius: 18,
  padding: 16,
  boxShadow: 'var(--shadow-floating)',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  animation: 'slideInRight 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
};

const expandedCardWrapperStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 20,
  left: 20,
  zIndex: 'var(--z-panel)',
  width: 400,
  maxWidth: 'calc(100vw - 60px)',
  maxHeight: 'calc(100vh - 100px)',
  overflowY: 'auto',
  background: '#FFFFFF',
  borderRadius: 20,
  padding: 18,
  boxShadow: '0 14px 36px rgba(0, 0, 0, 0.22)',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  animation: 'slideInRight 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
};

const headerRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 10,
};

const destinationLabelGroup: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 8,
  flex: 1,
};

const compactDestinationTitleStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: '#1E1E1E',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: 270,
};

const expandedDestinationTitleStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: '#1E1E1E',
  whiteSpace: 'normal',
  wordBreak: 'break-word',
  lineHeight: 1.4,
};

const closeBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  padding: 4,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  flexShrink: 0,
};

const statusTextStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#666666',
  padding: '6px 0',
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

const costEstimationRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  background: '#F0FDF4',
  border: '1px solid #A7F3D0',
  borderRadius: 10,
  padding: '8px 10px',
};

const costBadgeGroupStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

const costLabelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: '#065F46',
};

const costValueStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 800,
  color: '#047857',
};

const costDetailTagStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  color: '#059669',
};

const warningNoticeStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 11,
  color: '#D97706',
  background: 'rgba(245, 166, 35, 0.1)',
  padding: '6px 10px',
  borderRadius: 8,
};

const actionsRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  marginTop: 4,
};

const detailsBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: '9px 14px',
  borderRadius: 10,
  border: '1px solid #E5E7EB',
  background: '#FFFFFF',
  color: '#1E1E1E',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'background 0.15s ease',
};

const previewBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: '9px 14px',
  borderRadius: 10,
  border: 'none',
  background: '#DA362A',
  color: '#FFFFFF',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  boxShadow: '0 4px 12px rgba(218, 54, 42, 0.3)',
};

// EXPANDED STYLES
const expandedContentStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  marginTop: 4,
};

const categoryGridStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const categoryCardStyle: React.CSSProperties = {
  borderWidth: 1.5,
  borderStyle: 'solid',
  borderRadius: 12,
  padding: '10px 12px',
  textAlign: 'left',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

const routeSummaryBoxStyle: React.CSSProperties = {
  background: '#F9FAFB',
  border: '1px solid #E5E7EB',
  borderRadius: 12,
  padding: 12,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const addressRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 6,
  fontSize: 12,
};

const addressLabelStyle: React.CSSProperties = {
  fontWeight: 600,
  color: '#6B7280',
  minWidth: 32,
};

const addressValStyle: React.CSSProperties = {
  fontWeight: 700,
  color: '#111827',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const summaryMetricsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 8,
  marginTop: 6,
  paddingTop: 6,
  borderTop: '1px dashed #E5E7EB',
};

const metricItemStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

const metricLabelStyle: React.CSSProperties = {
  fontSize: 10,
  color: '#6B7280',
  fontWeight: 600,
};

const metricValStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 800,
  marginTop: 2,
};

const stepListContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const stepListHeaderStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: '#374151',
};

const timelineWrapperStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

const timelineItemStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  position: 'relative',
};

const timelineBadgeColumnStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: 24,
};

const timelineIconBadgeStyle: React.CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1,
};

const timelineLineStyle: React.CSSProperties = {
  width: 2,
  flex: 1,
  backgroundColor: '#E5E7EB',
  margin: '2px 0',
};

const timelineContentStyle: React.CSSProperties = {
  flex: 1,
  paddingBottom: 12,
};

const stepTitleStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: '#111827',
};

const stepCostStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: '#059669',
};

const stepDescStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#4B5563',
  margin: '2px 0 4px 0',
  lineHeight: 1.3,
};

const stepMetaRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 6,
  fontSize: 10,
  color: '#9CA3AF',
  fontWeight: 500,
};
