import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Search,
  MapPin,
  TrainFront,
  TramFront,
  Train,
  Bus,
  PlaneTakeoff,
  Ship,
  Building2,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Compass,
  ArrowRightLeft,
  CalendarDays
} from 'lucide-react';
import {
  INDONESIA_TRANSPORT_DATA,
  TRANSPORT_TYPE_LABELS,
  type IndonesiaTransportLocation,
  type IndonesiaTransportType,
} from '@/data/indonesiaTransportData';
import {
  TRANSPORT_ROUTES,
  FARE_ESTIMATE,
  getRouteForStation,
  getUpcomingDepartures,
  getFullDaySchedule,
  groupScheduleByDirectionAndHour,
  type DepartureStatus,
  type Direction,
} from '@/data/transportationScheduledata';
import type { PlaceResult } from '@/types/domain.types';

export const transportIcons: Record<IndonesiaTransportType, React.ComponentType<any>> = {
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

const TYPE_ORDER: IndonesiaTransportType[] = ['transjakarta', 'mrt', 'lrt', 'krl', 'bus', 'airport_rail', 'train', 'ferry'];

export default function Schedule() {
  const navigate = useNavigate();

  const [selectedType, setSelectedType] = useState<IndonesiaTransportType | 'all'>('all');
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeDirection, setActiveDirection] = useState<Direction>('outbound');
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);

  const presentTypes = useMemo(() => TYPE_ORDER.filter((t) => TRANSPORT_ROUTES.some((r) => r.type === t)), []);

  const searchedStations = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];
    return INDONESIA_TRANSPORT_DATA.filter((s) => {
      const matchesName = s.name.toLowerCase().includes(q);
      const matchesCity = s.city.toLowerCase().includes(q);
      const matchesLine = s.line ? s.line.toLowerCase().includes(q) : false;
      return matchesName || matchesCity || matchesLine;
    }).slice(0, 8);
  }, [searchQuery]);

  const filteredRoutes = useMemo(() => {
    return TRANSPORT_ROUTES.filter((r) => {
      const matchesType = selectedType === 'all' || r.type === selectedType;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesType;

      const matchesLine = r.line.toLowerCase().includes(q);
      const matchesStops = r.stops.some((s) => s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q));
      return matchesType && (matchesLine || matchesStops);
    }).sort((a, b) => a.line.localeCompare(b.line));
  }, [selectedType, searchQuery]);

  const selectedStation = selectedStationId ? INDONESIA_TRANSPORT_DATA.find((s) => s.id === selectedStationId) ?? null : null;
  const selectedRoute = selectedStationId ? getRouteForStation(selectedStationId) : null;
  const upcomingDepartures = selectedStationId ? getUpcomingDepartures(selectedStationId, new Date(), 8) : [];
  const fullDayGrouped = selectedStationId ? groupScheduleByDirectionAndHour(getFullDaySchedule(selectedStationId)) : null;

  const handleSelectStation = (stationId: string) => {
    setSelectedStationId(stationId);
    setSearchQuery('');
    setIsSearchFocused(false);
  };

  const handleStartRouteFromStation = (station: IndonesiaTransportLocation) => {
    const originPlace: PlaceResult = {
      lat: station.latitude,
      lng: station.longitude,
      label: station.name,
      address: `${station.name}, ${station.city}`,
    };
    navigate('/routes', { state: { origin: originPlace } });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FCF4ED',
        color: '#1E1E1E',
        fontFamily: 'var(--font-body)',
        paddingTop: 32,
        paddingBottom: 80,
      }}
    >
      <div className="container" style={{ maxWidth: 840, paddingLeft: 20, paddingRight: 20, margin: '0 auto' }}>
        <div className="rutein-slide-in" style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1
            className="font-jockey"
            style={{
              fontSize: 'clamp(32px, 5vw, 44px)',
              color: '#1E1E1E',
              margin: '0 0 8px 0',
              lineHeight: 1.1,
              letterSpacing: '0.01em',
            }}
          >
            Jadwal <span style={{ color: '#DA362A' }}>Transportasi</span>
          </h1>
          <p
            style={{
              color: '#4A4A4A',
              fontSize: 'clamp(15px, 1.8vw, 17px)',
              margin: 0,
              fontWeight: 500,
              fontFamily: 'var(--font-inter)',
            }}
          >
            Lihat keberangkatan real-time, bebas salah tunggu.
          </p>
        </div>

        <div
          className="rutein-slide-in-1"
          style={{
            marginBottom: 24,
            background: '#FFFFFF',
            border: '1.5px solid #E5D5C5',
            borderRadius: 20,
            padding: '24px 28px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
            position: 'relative',
            zIndex: 20,
          }}
        >
          {/* Station Search Bar */}
          <div style={{ marginBottom: 18, position: 'relative' }}>
            <label
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#666666',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 8,
              }}
            >
              <Search size={14} color="#DA362A" /> Cari Stasiun / Halte / Koridor
            </label>

            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                placeholder="Cari stasiun (misal: Sudirman, Monas, Lebak Bulus, Manggarai)..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#FDF0ED',
                  border: '1.5px solid #E5D5C5',
                  borderRadius: 14,
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#1E1E1E',
                  outline: 'none',
                  fontFamily: 'var(--font-inter)',
                  transition: 'all 0.15s ease',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: 12,
                    background: 'transparent',
                    border: 'none',
                    color: '#666666',
                    fontSize: 13,
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  ✕ Clear
                </button>
              )}
            </div>

            {/* Instant Station Search Dropdown Results */}
            {isSearchFocused && searchedStations.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: 6,
                  background: '#FFFFFF',
                  border: '1.5px solid #E5D5C5',
                  borderRadius: 14,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                  zIndex: 50,
                  maxHeight: 280,
                  overflowY: 'auto',
                }}
              >
                {searchedStations.map((st) => {
                  const IconComp = transportIcons[st.type] || MapPin;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onMouseDown={() => {
                        handleSelectStation(st.id);
                        setSelectedType(st.type);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        textAlign: 'left',
                        padding: '11px 16px',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: '1px solid #F0E2D5',
                        color: '#1E1E1E',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ color: '#DA362A' }}>
                          <IconComp size={16} />
                        </div>
                        <div>
                          <strong style={{ fontSize: 14, color: '#1E1E1E', display: 'block' }}>{st.name}</strong>
                          <span style={{ fontSize: 12, color: '#666666' }}>
                            {st.line || TRANSPORT_TYPE_LABELS[st.type]} · {st.city}
                          </span>
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          background: '#FDF0ED',
                          color: '#DA362A',
                          padding: '3px 8px',
                          borderRadius: 999,
                          fontWeight: 700,
                        }}
                      >
                        Lihat Jadwal
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Transport Type Filter Chips */}
          <div>
            <span style={{ fontSize: 13, color: '#666666', display: 'block', marginBottom: 10, fontWeight: 600 }}>
              Filter Jenis Moda:
            </span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => { setSelectedType('all'); setSelectedStationId(null); }}
                className="font-jockey"
                style={{
                  padding: '7px 16px',
                  fontSize: 15,
                  borderRadius: 999,
                  background: selectedType === 'all' ? '#DA362A' : '#FFFFFF',
                  color: selectedType === 'all' ? '#FFFFFF' : '#1E1E1E',
                  border: selectedType === 'all' ? '1.5px solid #DA362A' : '1.5px solid #E5D5C5',
                  cursor: 'pointer',
                  boxShadow: selectedType === 'all' ? '0 4px 12px rgba(218, 54, 42, 0.25)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Semua Moda
              </button>

              {presentTypes.map((t) => {
                const isActive = selectedType === t;
                const IconComp = transportIcons[t] || MapPin;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setSelectedType(t); setSelectedStationId(null); }}
                    className="font-jockey"
                    style={{
                      padding: '7px 16px',
                      fontSize: 15,
                      borderRadius: 999,
                      background: isActive ? '#DA362A' : '#FFFFFF',
                      color: isActive ? '#FFFFFF' : '#1E1E1E',
                      border: isActive ? '1.5px solid #DA362A' : '1.5px solid #E5D5C5',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: isActive ? '0 4px 12px rgba(218, 54, 42, 0.25)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <IconComp size={15} />
                    {TRANSPORT_TYPE_LABELS[t]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {selectedStation && selectedRoute && (
          <div
            className="rutein-slide-in-2"
            style={{
              marginBottom: 32,
              background: '#FFFFFF',
              border: '2px solid #DA362A',
              borderRadius: 20,
              padding: '28px 32px',
              boxShadow: '0 8px 24px rgba(218, 54, 42, 0.12)',
              position: 'relative',
              zIndex: 10,
            }}
          >
            {/* Station Title & Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14, marginBottom: 16 }}>
              <div>
                <span
                  style={{
                    background: '#FDF0ED',
                    color: '#DA362A',
                    border: '1.5px solid rgba(218, 54, 42, 0.3)',
                    padding: '4px 12px',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 8,
                  }}
                >
                  <MapPin size={13} /> {TRANSPORT_TYPE_LABELS[selectedStation.type]}
                </span>
                <h2 className="font-jockey" style={{ fontSize: 30, color: '#1E1E1E', margin: '4px 0 2px 0' }}>
                  {selectedStation.name}
                </h2>
                <p style={{ color: '#666666', fontSize: 14, margin: 0, fontWeight: 500 }}>
                  {selectedRoute.line} · {selectedStation.city}, {selectedStation.province}
                </p>
              </div>

              {/* Action Button: Start Journey from Station */}
              <button
                type="button"
                onClick={() => handleStartRouteFromStation(selectedStation)}
                className="font-jockey"
                style={{
                  padding: '9px 20px',
                  fontSize: 16,
                  borderRadius: 999,
                  background: '#DA362A',
                  color: '#FFFFFF',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 14px rgba(218, 54, 42, 0.3)',
                }}
              >
                Coba Rute dari Stasiun Ini <ArrowRight size={16} />
              </button>
            </div>

            {/* Fare & Headway Meta */}
            <div
              style={{
                display: 'flex',
                gap: 20,
                padding: '12px 18px',
                background: '#FDF0ED',
                border: '1.5px solid #E5D5C5',
                borderRadius: 14,
                marginBottom: 20,
                fontSize: 14,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <span style={{ color: '#666666', fontSize: 12, display: 'block', fontWeight: 600 }}>Estimasi Tarif:</span>
                <strong style={{ color: '#DA362A', fontSize: 15 }}>{FARE_ESTIMATE[selectedStation.type]}</strong>
              </div>
              <div style={{ borderLeft: '1px solid #E5D5C5', paddingLeft: 20 }}>
                <span style={{ color: '#666666', fontSize: 12, display: 'block', fontWeight: 600 }}>Status Operasional:</span>
                <strong style={{ color: '#1E1E1E', fontSize: 15 }}>Beroperasi Normal (05:00 - 23:00 WIB)</strong>
              </div>
            </div>

            {/* Upcoming Departures Section */}
            {selectedRoute.hasDirections && (
              <div style={{ marginBottom: 24 }}>
                <h3
                  className="font-jockey"
                  style={{
                    fontSize: 22,
                    color: '#1E1E1E',
                    marginBottom: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Clock size={18} color="#DA362A" /> Keberangkatan Terdekat Hari Ini
                </h3>

                {upcomingDepartures.length === 0 ? (
                  <p style={{ color: '#666666', fontSize: 14 }}>Tidak ada jadwal keberangkatan lagi untuk hari ini.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                    {upcomingDepartures.map((dep) => (
                      <div
                        key={dep.id}
                        className="rutein-scale-in"
                        style={{
                          background: '#FFFFFF',
                          border: '1.5px solid #E5D5C5',
                          borderRadius: 14,
                          padding: '14px 16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 17, fontWeight: 700, color: '#1E1E1E' }}>
                            {dep.time} <span style={{ fontSize: 12, color: '#666666' }}>WIB</span>
                          </div>
                          <div style={{ fontSize: 12, color: '#666666', marginTop: 2, fontWeight: 500 }}>
                            {dep.directionLabel}
                          </div>
                          <div style={{ fontSize: 12, color: '#DA362A', fontWeight: 600, marginTop: 4 }}>
                            {dep.humanText}
                          </div>
                        </div>

                        <StatusBadge status={dep.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedRoute.hasDirections && fullDayGrouped && (
              <div style={{ paddingTop: 16, borderTop: '1.5px solid #E5D5C5' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                  <h3
                    className="font-jockey"
                    style={{
                      fontSize: 22,
                      color: '#1E1E1E',
                      margin: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <CalendarDays size={18} color="#DA362A" /> Jadwal Lengkap Harian
                  </h3>

                  {/* Direction Tabs */}
                  <div style={{ display: 'flex', background: '#FDF0ED', padding: 3, borderRadius: 10, border: '1px solid #E5D5C5' }}>
                    <button
                      type="button"
                      onClick={() => setActiveDirection('outbound')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 8,
                        background: activeDirection === 'outbound' ? '#DA362A' : 'transparent',
                        color: activeDirection === 'outbound' ? '#FFFFFF' : '#1E1E1E',
                        border: 'none',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      Arah {selectedRoute.destinationLabel}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveDirection('inbound')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 8,
                        background: activeDirection === 'inbound' ? '#DA362A' : 'transparent',
                        color: activeDirection === 'inbound' ? '#FFFFFF' : '#1E1E1E',
                        border: 'none',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      Arah {selectedRoute.originLabel}
                    </button>
                  </div>
                </div>

                {/* Grouped Hourly Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
                  {Object.keys(fullDayGrouped[activeDirection])
                    .sort()
                    .map((hour) => (
                      <div
                        key={hour}
                        style={{
                          background: '#FFFFFF',
                          border: '1px solid #E5D5C5',
                          borderRadius: 12,
                          padding: '10px 12px',
                        }}
                      >
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#DA362A', display: 'block', marginBottom: 4 }}>
                          Jam {hour}:00
                        </span>
                        <div style={{ fontSize: 12, color: '#1E1E1E', fontWeight: 600, lineHeight: 1.4 }}>
                          {fullDayGrouped[activeDirection][hour].map((e) => e.time.slice(3)).join(', ')}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="rutein-fade-up-2">
          <h2
            className="font-jockey"
            style={{
              fontSize: 26,
              color: '#1E1E1E',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Compass size={22} color="#DA362A" /> Daftar Koridor & Stasiun ({filteredRoutes.length})
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filteredRoutes.map((route) => {
              const IconComp = transportIcons[route.type] || MapPin;
              return (
                <div
                  key={route.key}
                  className="rutein-scale-in"
                  style={{
                    background: '#FFFFFF',
                    border: '1.5px solid #E5D5C5',
                    borderRadius: 20,
                    padding: '22px 26px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: '#FDF0ED',
                          border: '1.5px solid #E5D5C5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#DA362A',
                        }}
                      >
                        <IconComp size={18} />
                      </div>
                      <div>
                        <strong className="font-jockey" style={{ fontSize: 20, color: '#1E1E1E', display: 'block' }}>
                          {route.line}
                        </strong>
                        {route.hasDirections && (
                          <span style={{ fontSize: 13, color: '#666666' }}>
                            {route.originLabel} ↔ {route.destinationLabel}
                          </span>
                        )}
                      </div>
                    </div>

                    <span
                      style={{
                        background: '#FDF0ED',
                        color: '#DA362A',
                        padding: '4px 12px',
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {TRANSPORT_TYPE_LABELS[route.type]} · {route.stops.length} Stasiun
                    </span>
                  </div>

                  {/* Station Chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                    {route.stops.map((stop) => {
                      const isSelected = selectedStationId === stop.id;
                      return (
                        <button
                          key={stop.id}
                          type="button"
                          onClick={() => handleSelectStation(stop.id)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: 999,
                            border: isSelected ? '1.5px solid #DA362A' : '1.5px solid #E5D5C5',
                            background: isSelected ? '#DA362A' : '#FFFFFF',
                            color: isSelected ? '#FFFFFF' : '#1E1E1E',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {stop.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {filteredRoutes.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', background: '#FFFFFF', borderRadius: 20, border: '1.5px dashed #E5D5C5' }}>
                <p style={{ color: '#666666', margin: 0, fontSize: 15 }}>
                  Tidak ada stasiun atau koridor yang cocok dengan kata kunci <strong>"{searchQuery}"</strong>.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: DepartureStatus }) {
  switch (status) {
    case 'on_time':
      return (
        <span
          style={{
            background: 'rgba(52, 211, 153, 0.15)',
            color: '#059669',
            border: '1px solid rgba(52, 211, 153, 0.4)',
            padding: '4px 10px',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <CheckCircle2 size={12} /> Tepat Waktu
        </span>
      );
    case 'delayed':
      return (
        <span
          style={{
            background: 'rgba(245, 166, 35, 0.15)',
            color: '#D97706',
            border: '1px solid rgba(245, 166, 35, 0.4)',
            padding: '4px 10px',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <AlertTriangle size={12} /> Terlambat
        </span>
      );
    case 'cancelled':
      return (
        <span
          style={{
            background: 'rgba(218, 54, 42, 0.15)',
            color: '#DA362A',
            border: '1px solid rgba(218, 54, 42, 0.4)',
            padding: '4px 10px',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <XCircle size={12} /> Dibatalkan
        </span>
      );
  }
}