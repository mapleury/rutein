import React, { useEffect, useState, useMemo } from 'react';
import { CheckCircle2, MapPin } from 'lucide-react';
import {
  INDONESIA_ROAD_DISRUPTIONS,
  SEVERITY_COLORS,
  DISRUPTION_SEVERITY_LABELS,
  DISRUPTION_CAUSE_LABELS,
  ROAD_TYPE_LABELS,
  IndonesiaRoadDisruption,
} from '../data/indonesiaRoadDisruption';

type FilterTab = 'semua' | 'aktif' | 'kritis' | 'tol';

const C = {
  bg: '#FCF4ED',
  surface: '#FFFDF9',
  border: '#B7A897',
  text: '#1E1E1E',
  textMuted: '#7A6F62',
  primary: '#DA362A',
  primaryHover: '#C22B20',
};

const bodyFont: React.CSSProperties = { fontFamily: "'Aileron', sans-serif" };

const sharedStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Aileron:wght@400;600;700&display=swap');

  @keyframes pageFadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  .page-fade { opacity: 0; animation: pageFadeUp 0.5s ease forwards; }

  .filter-chip { transition: all 0.15s ease; cursor: pointer; }
  .filter-chip:hover { opacity: 0.85; transform: translateY(-1px); }

  .disruption-card { transition: transform 0.15s ease, box-shadow 0.15s ease; }
  .disruption-card:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(30, 30, 30, 0.07); }
`;

const cardStyle: React.CSSProperties = {
  background: C.surface,
  border: `1.5px solid ${C.border}`,
  borderRadius: 22,
  boxSizing: 'border-box',
};

const severityBadge: React.CSSProperties = {
  ...bodyFont,
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  padding: '3px 10px',
  borderRadius: 999,
  whiteSpace: 'nowrap',
};

const FILTERS: { key: FilterTab; label: string }[] = [
  { key: 'aktif', label: 'Sedang Aktif' },
  { key: 'kritis', label: 'Prioritas Kritis' },
  { key: 'tol', label: 'Jalur Tol' },
  { key: 'semua', label: 'Semua Laporan' },
];

function formatWaktuLaporan(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMins = Math.max(0, Math.floor(diffMs / (1000 * 60)));
  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} menit lalu`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;
  return new Date(isoString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Disruptions() {
  const [disruptions, setDisruptions] = useState<IndonesiaRoadDisruption[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>('aktif');

  useEffect(() => {
    const timer = setTimeout(() => {
      const severityWeight: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
      const sorted = [...INDONESIA_ROAD_DISRUPTIONS].sort((a, b) => severityWeight[b.severity] - severityWeight[a.severity]);

      setDisruptions(sorted);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const filteredDisruptions = useMemo(() => {
    switch (filter) {
      case 'aktif':
        return disruptions.filter((d) => d.isActive);
      case 'kritis':
        return disruptions.filter((d) => d.severity === 'critical');
      case 'tol':
        return disruptions.filter((d) => d.roadType === 'toll_road');
      case 'semua':
      default:
        return disruptions;
    }
  }, [disruptions, filter]);

  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: 'clamp(16px, 6vw, 40px) 20px', boxSizing: 'border-box' }}>
      <style>{sharedStyles}</style>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div className="page-fade" style={{ marginBottom: 24, animationDelay: '0ms' }}>
          <h1
            className="font-jockey"
            style={{ fontSize: 'clamp(28px, 7vw, 40px)', margin: '0 0 8px', color: C.text }}
          >
            Peringatan Lalu Lintas & Rute
          </h1>
          <p style={{ ...bodyFont, color: C.textMuted, margin: 0, fontSize: 14, lineHeight: 1.5 }}>
            Informasi situasi insiden, penundaan, dan penutupan jalan terkini di area perjalananmu.
          </p>
        </div>

        {/* Filter tabs */}
        <div className="page-fade" style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', animationDelay: '80ms' }}>
          {FILTERS.map((tab) => {
            const isActive = filter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                className="filter-chip"
                onClick={() => setFilter(tab.key)}
                style={{
                  padding: '9px 18px',
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 600,
                  ...bodyFont,
                  border: `1.5px solid ${isActive ? C.primary : C.border}`,
                  background: isActive ? C.primary : C.surface,
                  color: isActive ? '#FFFFFF' : C.textMuted,
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {loading && (
          <p className="page-fade" style={{ ...bodyFont, color: C.textMuted, fontSize: 14, animationDelay: '140ms' }}>
            Memeriksa laporan gangguan lalu lintas…
          </p>
        )}

        {!loading && filteredDisruptions.length === 0 && (
          <div
            className="page-fade"
            style={{
              ...cardStyle,
              textAlign: 'center',
              padding: '32px 20px',
              animationDelay: '140ms',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <CheckCircle2 size={22} color="#16A34A" />
            <p style={{ margin: 0, ...bodyFont, color: '#16A34A', fontWeight: 600, fontSize: 15 }}>
              Tidak ada laporan gangguan lalu lintas untuk filter ini.
            </p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filteredDisruptions.map((d, i) => (
            <div
              key={d.id}
              className="page-fade disruption-card"
              style={{
                ...cardStyle,
                borderLeft: `4px solid ${SEVERITY_COLORS[d.severity]}`,
                padding: '18px 20px',
                animationDelay: `${140 + Math.min(i, 10) * 50}ms`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div className="font-jockey" style={{ fontSize: 16, color: C.text, lineHeight: 1.3 }}>{d.title}</div>
                <span
                  style={{
                    ...severityBadge,
                    background: SEVERITY_COLORS[d.severity] + '1A',
                    color: SEVERITY_COLORS[d.severity],
                    border: `1px solid ${SEVERITY_COLORS[d.severity]}40`,
                  }}
                >
                  {DISRUPTION_SEVERITY_LABELS[d.severity] ?? d.severity}
                </span>
              </div>

              {d.description && (
                <p style={{ margin: '8px 0 0', ...bodyFont, fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>
                  {d.description}
                </p>
              )}

              {d.affectedRoads.length > 0 && (
                <p style={{ margin: '10px 0 0', ...bodyFont, fontSize: 12, color: C.text }}>
                  <strong>Ruas terdampak:</strong> {d.affectedRoads.join(', ')}
                </p>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14, margin: '10px 0 0', ...bodyFont, fontSize: 12, color: C.textMuted }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <MapPin size={13} />
                  {ROAD_TYPE_LABELS[d.roadType] ?? d.roadType}
                </span>
                <span>Kategori: {DISRUPTION_CAUSE_LABELS[d.cause] ?? d.cause}</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 12,
                  paddingTop: 10,
                  borderTop: `1px solid ${C.border}55`,
                  ...bodyFont,
                  fontSize: 11,
                  color: C.textMuted,
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600, color: d.isActive ? '#B91C1C' : '#16A34A' }}>
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: d.isActive ? '#B91C1C' : '#16A34A',
                      display: 'inline-block',
                    }}
                  />
                  {d.isActive ? 'Sedang Berlangsung' : 'Telah Ditangani'}
                </span>
                <span>Dilaporkan {formatWaktuLaporan(d.reportedAt)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}