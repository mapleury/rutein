import React, { useState, useEffect, useRef } from 'react';
import { Search, SlidersHorizontal, ArrowUpDown, X, Navigation, Footprints, Car, Check, Menu } from 'lucide-react';
import { searchPlaces, debounce } from '@/services/geocodingService';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMobileSidebar } from '@/contexts/SidebarMapContext';
import { TRANSPORT_TYPE_LABELS, type IndonesiaTransportType } from '@/data/indonesiaTransportData';
import { TRANSPORT_TYPE_COLOR } from '@/components/transportMarkerIcon';
import type { PlaceResult } from '@/types/domain.types';

const ALL_TRANSPORT_TYPES = Object.keys(TRANSPORT_TYPE_LABELS) as IndonesiaTransportType[];

interface MapTopSearchProps {
  onSelectPlace: (place: PlaceResult) => void;
  onSelectRouteSearch?: (origin: PlaceResult | null, destination: PlaceResult) => void;
  travelMode: 'walk' | 'ojek' | 'transit';
  onChangeTravelMode: (mode: 'walk' | 'ojek' | 'transit') => void;
  budgetPreference: 'cheapest' | 'fastest' | 'efficient';
  onChangeBudgetPreference: (pref: 'cheapest' | 'fastest' | 'efficient') => void;
  activeTypes?: Set<IndonesiaTransportType>;
  onToggleType?: (type: IndonesiaTransportType) => void;
  onShowAllTypes?: () => void;
}

export default function MapTopSearch({
  onSelectPlace,
  onSelectRouteSearch,
  travelMode,
  onChangeTravelMode,
  budgetPreference,
  onChangeBudgetPreference,
  activeTypes,
  onToggleType,
  onShowAllTypes,
}: MapTopSearchProps) {
  const { t } = useLanguage();
  const { openMobileSidebar } = useMobileSidebar();
  const [query, setQuery] = useState('');
  const [originQuery, setOriginQuery] = useState('');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeInput, setActiveInput] = useState<'dest' | 'origin'>('dest');
  const [openDropdown, setOpenDropdown] = useState(false);
  const [isRouteMode, setIsRouteMode] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const [selectedOrigin, setSelectedOrigin] = useState<PlaceResult | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<PlaceResult | null>(null);

  const debouncedSearch = useRef(
    debounce(async (q: string) => {
      setLoading(true);
      try {
        const res = await searchPlaces(q);
        setResults(res);
        setOpenDropdown(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400)
  ).current;

  useEffect(() => {
    const currentQ = activeInput === 'origin' ? originQuery : query;
    if (currentQ.trim().length >= 2) {
      debouncedSearch(currentQ);
    } else {
      setResults([]);
      setOpenDropdown(false);
    }
  }, [query, originQuery, activeInput]);

  const handleSelectResult = (place: PlaceResult) => {
    if (activeInput === 'origin') {
      setSelectedOrigin(place);
      setOriginQuery(place.label);
    } else {
      setSelectedDestination(place);
      setQuery(place.label);
      onSelectPlace(place);
    }
    setOpenDropdown(false);

    if (isRouteMode && (activeInput === 'origin' ? place : selectedOrigin) && (activeInput === 'dest' ? place : selectedDestination)) {
      if (onSelectRouteSearch) {
        onSelectRouteSearch(
          activeInput === 'origin' ? place : selectedOrigin,
          activeInput === 'dest' ? place : selectedDestination!
        );
      }
    }
  };

  const handleSwapRoute = () => {
    const tempOrigin = selectedOrigin;
    const tempOriginQ = originQuery;
    setSelectedOrigin(selectedDestination);
    setOriginQuery(query);
    setSelectedDestination(tempOrigin);
    setQuery(tempOriginQ);
  };

  return (
    <div className="map-top-search-wrapper" style={topSearchWrapper}>
      <style>{topSearchStyles}</style>

      {/* Mobile Drawer Hamburger Trigger */}
      <button
        type="button"
        onClick={openMobileSidebar}
        className="map-mobile-menu-btn"
        aria-label="Buka Menu"
        title="Buka Menu"
      >
        <Menu size={20} color="#1E1E1E" />
      </button>

      {/* Search Input Pill Container */}
      <div className="map-search-card" style={searchCardStyle}>
        {!isRouteMode ? (
          /* Single Destination Search */
          <div style={singleSearchRow}>
            <Search size={18} color="#DA362A" style={{ flexShrink: 0 }} />
            <input
              placeholder={t('search.placeholder')}
              value={query}
              onChange={(e) => {
                setActiveInput('dest');
                setQuery(e.target.value);
              }}
              onFocus={() => results.length > 0 && setOpenDropdown(true)}
              style={searchInputStyle}
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  setResults([]);
                }}
                style={iconBtnStyle}
              >
                <X size={14} color="#666" />
              </button>
            )}
            <button
              onClick={() => setIsRouteMode(true)}
              style={routeModeToggleBtn}
              title={t('search.route_btn')}
            >
              <Navigation size={14} />
              <span>{t('search.route_btn')}</span>
            </button>
          </div>
        ) : (
          /* A -> B Origin & Destination Search */
          <div style={routeSearchContainer}>
            <div style={routeSearchHeader}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#DA362A' }}>Rute Perjalanan</span>
              <button onClick={() => setIsRouteMode(false)} style={iconBtnStyle}>
                <X size={14} color="#666" />
              </button>
            </div>

            <div style={routeInputGroupWrapper}>
              <div style={routeInputGroup}>
                {/* Origin Input */}
                <div style={routeInputRow}>
                  <div style={{ ...dotStyle, background: '#2563EB' }} />
                  <input
                    placeholder="Lokasi awal (Your location)..."
                    value={originQuery}
                    onChange={(e) => {
                      setActiveInput('origin');
                      setOriginQuery(e.target.value);
                    }}
                    onFocus={() => {
                      setActiveInput('origin');
                      results.length > 0 && setOpenDropdown(true);
                    }}
                    style={searchInputStyle}
                  />
                </div>

                {/* Destination Input */}
                <div style={routeInputRow}>
                  <div style={{ ...dotStyle, background: '#DA362A' }} />
                  <input
                    placeholder="Tujuan perjalanannya..."
                    value={query}
                    onChange={(e) => {
                      setActiveInput('dest');
                      setQuery(e.target.value);
                    }}
                    onFocus={() => {
                      setActiveInput('dest');
                      results.length > 0 && setOpenDropdown(true);
                    }}
                    style={searchInputStyle}
                  />
                </div>
              </div>

              <button onClick={handleSwapRoute} style={swapBtnInlineStyle} title="Tukar Lokasi">
                <ArrowUpDown size={14} color="#444" />
              </button>
            </div>
          </div>
        )}

        {/* Autocomplete Dropdown List */}
        {openDropdown && (results.length > 0 || loading) && (
          <div className="map-search-dropdown" style={dropdownStyle}>
            {loading && <div style={{ padding: 10, fontSize: 12, color: '#888' }}>Mencari lokasi...</div>}
            {results.map((r) => (
              <button
                key={r.placeId ?? `${r.lat},${r.lng}`}
                type="button"
                onMouseDown={() => handleSelectResult(r)}
                style={dropdownItemStyle}
              >
                <div style={{ fontWeight: 600, fontSize: 13, color: '#1E1E1E' }}>{r.label}</div>
                <div style={{ fontSize: 11, color: '#666' }}>{r.address}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filter Button right next to search bar */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowFilterModal((prev) => !prev)}
          className="map-filter-pill-btn"
          style={filterPillBtn}
          title="Filter Rute & Metrik"
        >
          <SlidersHorizontal size={18} color="#DA362A" />
        </button>

        {/* Filter Pop-up Overlay Panel */}
        {showFilterModal && (
          <div className="map-filter-modal" style={filterModalStyle}>
            <div style={filterModalHeader}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1E1E1E' }}>Filter Perjalanan</span>
              <button onClick={() => setShowFilterModal(false)} style={iconBtnStyle}>
                <X size={14} color="#666" />
              </button>
            </div>

            {/* Travel Method Filter */}
            <div style={filterGroupStyle}>
              <label style={filterLabelStyle}>Travel Method</label>
              <div style={filterBtnRow}>
                <button
                  style={filterChoiceBtn(travelMode === 'transit' || travelMode === 'ojek')}
                  onClick={() => onChangeTravelMode('ojek')}
                >
                  <Car size={14} />
                  <span>Vehicle / Transit</span>
                </button>
                <button
                  style={filterChoiceBtn(travelMode === 'walk')}
                  onClick={() => onChangeTravelMode('walk')}
                >
                  <Footprints size={14} />
                  <span>On Foot</span>
                </button>
              </div>
            </div>



            {/* Map Transport Marker Filter */}
            {onToggleType && (
              <div style={{ ...filterGroupStyle, marginTop: 14, paddingTop: 10, borderTop: '1px solid #F0F0F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <label style={filterLabelStyle}>Filter Transport Peta</label>
                  {onShowAllTypes && (
                    <button
                      type="button"
                      onClick={onShowAllTypes}
                      style={{ fontSize: 10, fontWeight: 700, color: '#DA362A', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      Pilih Semua
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {ALL_TRANSPORT_TYPES.map((type) => {
                    const isChecked = activeTypes?.has(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => onToggleType(type)}
                        style={filterChoiceBtn(!!isChecked)}
                      >
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: TRANSPORT_TYPE_COLOR[type],
                            flexShrink: 0,
                          }}
                        />
                        <span>{TRANSPORT_TYPE_LABELS[type]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// STYLES
const topSearchStyles = `
  .map-mobile-menu-btn {
    display: none;
  }
  @media (max-width: 767px) {
    .map-top-search-wrapper {
      top: 12px !important;
      left: 12px !important;
      right: 12px !important;
      gap: 8px !important;
      max-width: none !important;
    }
    .map-search-card {
      flex: 1 !important;
      min-width: 0 !important;
      max-width: none !important;
      padding: 6px 10px !important;
    }
    .map-mobile-menu-btn {
      display: flex !important;
      align-items: center;
      justify-content: center;
      width: 42px;
      height: 42px;
      border-radius: 14px;
      border: 1px solid #E5E5E5;
      background: #FFFFFF;
      box-shadow: var(--shadow-floating);
      cursor: pointer;
      flex-shrink: 0;
      color: #1E1E1E;
      transition: background 0.15s ease, transform 0.1s ease;
    }
    .map-mobile-menu-btn:active {
      transform: scale(0.96);
    }
    .map-filter-pill-btn {
      width: 42px !important;
      height: 42px !important;
      border-radius: 14px !important;
    }
    .map-filter-modal {
      position: fixed !important;
      top: 64px !important;
      left: 12px !important;
      right: 12px !important;
      width: auto !important;
      max-width: none !important;
      max-height: calc(100dvh - 80px) !important;
      overflow-y: auto !important;
      z-index: 9999 !important;
    }
    .map-search-dropdown {
      max-height: 45dvh !important;
    }
  }
`;

const topSearchWrapper: React.CSSProperties = {
  position: 'absolute',
  top: 16,
  left: 16,
  zIndex: 'var(--z-map-controls)',
  display: 'flex',
  alignItems: 'flex-start',
  gap: 10,
  maxWidth: 'calc(100vw - 32px)',
};

const searchCardStyle: React.CSSProperties = {
  position: 'relative',
  background: '#FFFFFF',
  borderRadius: 16,
  boxShadow: 'var(--shadow-floating)',
  padding: '6px 12px',
  minWidth: 320,
  maxWidth: 420,
};

const singleSearchRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  height: 38,
};

const searchInputStyle: React.CSSProperties = {
  width: '100%',
  border: 'none',
  outline: 'none',
  fontSize: 13,
  fontWeight: 600,
  color: '#1E1E1E',
  background: 'transparent',
};

const routeModeToggleBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '5px 10px',
  borderRadius: 20,
  background: '#DA362A',
  color: '#FFFFFF',
  border: 'none',
  fontSize: 11,
  fontWeight: 700,
  cursor: 'pointer',
  flexShrink: 0,
};

const routeSearchContainer: React.CSSProperties = {
  position: 'relative',
  padding: '4px 0',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const routeSearchHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const routeInputGroupWrapper: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const routeInputGroup: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const routeInputRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  background: '#F5F5F7',
  borderRadius: 8,
  padding: '6px 10px',
};

const dotStyle: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: '50%',
  flexShrink: 0,
};

const swapBtnInlineStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: '50%',
  border: '1px solid #E5E5E5',
  background: '#F5F5F7',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  flexShrink: 0,
  transition: 'all 0.15s ease',
  boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
};

const dropdownStyle: React.CSSProperties = {
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  marginTop: 6,
  background: '#FFFFFF',
  borderRadius: 12,
  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
  maxHeight: 240,
  overflowY: 'auto',
  zIndex: 'var(--z-popover)',
};

const dropdownItemStyle: React.CSSProperties = {
  width: '100%',
  textAlign: 'left',
  padding: '10px 12px',
  border: 'none',
  borderBottom: '1px solid #F0F0F0',
  background: 'transparent',
  cursor: 'pointer',
};

const filterPillBtn: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: '50%',
  background: '#FFFFFF',
  border: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: 'var(--shadow-floating)',
  cursor: 'pointer',
};

const filterModalStyle: React.CSSProperties = {
  position: 'absolute',
  top: 52,
  left: 0,
  width: 280,
  background: '#FFFFFF',
  borderRadius: 14,
  padding: 14,
  boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
  zIndex: 'var(--z-popover)',
  animation: 'slideInRight 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
};

const filterModalHeader: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 10,
};

const filterGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const filterLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  color: '#888888',
};

const filterBtnRow: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
};

const filterChoiceBtn = (isActive: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 10px',
  borderRadius: 8,
  border: isActive ? '1.5px solid #DA362A' : '1px solid #E5E5E5',
  background: isActive ? 'rgba(218, 54, 42, 0.08)' : '#F9F9F9',
  color: isActive ? '#DA362A' : '#444444',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
});

const iconBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  padding: 2,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
