import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sliders,
  Bookmark,
  User,
  Check,
  Globe,
  Trash2,
  Bus,
  TrainFront,
  Train,
  TramFront,
  TrainTrack,
  Plane,
  Ship,
} from 'lucide-react';
import {
  TRANSPORT_TYPE_LABELS,
  type IndonesiaTransportType,
} from '@/data/indonesiaTransportData';
import { TRANSPORT_TYPE_COLOR } from '@/components/transportMarkerIcon';
import { listSavedPlaces, deleteSavedPlace } from '@/services/savedPlacesService';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import type { SavedPlace } from '@/types/database.types';
import logoRuteinSvg from '@/assets/images/logo-rutein.svg';
import logoNonTextSvg from '@/assets/images/logo-nontext.svg';

const ALL_TRANSPORT_TYPES = Object.keys(
  TRANSPORT_TYPE_LABELS
) as IndonesiaTransportType[];

function getOperatorIcon(type: IndonesiaTransportType) {
  const iconProps = { size: 19, color: '#FFFFFF', strokeWidth: 2.2 };
  switch (type) {
    case 'transjakarta':
      return <Bus {...iconProps} />;
    case 'bus':
      return <TramFront {...iconProps} />;
    case 'krl':
      return <TrainFront {...iconProps} />;
    case 'mrt':
      return <TrainTrack {...iconProps} />;
    case 'lrt':
      return <TramFront {...iconProps} />;
    case 'train':
      return <Train {...iconProps} />;
    case 'airport_rail':
      return <Plane {...iconProps} />;
    case 'ferry':
      return <Ship {...iconProps} />;
    case 'terminal':
      return <Bus {...iconProps} />;
    default:
      return <Bus {...iconProps} />;
  }
}

type ActiveSection = 'operators' | 'saved' | null;

interface MapSidebarProps {
  activeTypes: Set<IndonesiaTransportType>;
  onToggleType: (type: IndonesiaTransportType) => void;
  onShowAllTypes: () => void;
  onSelectSavedPlace: (lat: number, lng: number, name?: string, address?: string) => void;
  onSelectOperator?: (type: IndonesiaTransportType) => void;
  savedPlacesTrigger?: number;
}

export default function MapSidebar({
  activeTypes,
  onToggleType,
  onShowAllTypes,
  onSelectSavedPlace,
  onSelectOperator,
  savedPlacesTrigger = 0,
}: MapSidebarProps) {
  const { user } = useAuth();
  const { lang, t } = useLanguage();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState<ActiveSection>('operators');
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Nael Muna';

  const loadAllSavedPlaces = async () => {
    setLoadingSaved(true);

    // 1. Get local storage items
    let localItems: SavedPlace[] = [];
    try {
      const raw = localStorage.getItem('rutein_saved_places');
      if (raw) localItems = JSON.parse(raw);
    } catch {}

    // 2. Get Supabase items if logged in
    let remoteItems: SavedPlace[] = [];
    if (user) {
      try {
        remoteItems = await listSavedPlaces(user.id);
      } catch {}
    }

    // Merge without duplicates by name
    const combined = [...localItems];
    for (const remote of remoteItems) {
      if (!combined.some((item) => item.name === remote.name)) {
        combined.push(remote);
      }
    }

    setSavedPlaces(combined);
    setLoadingSaved(false);
  };

  useEffect(() => {
    loadAllSavedPlaces();
  }, [user, savedPlacesTrigger]);

  const handleDeleteSaved = async (e: React.MouseEvent, placeId: string, placeName: string) => {
    e.stopPropagation();

    // Remove from local storage
    try {
      const raw = localStorage.getItem('rutein_saved_places');
      if (raw) {
        const items = JSON.parse(raw);
        const filtered = items.filter((item: any) => item.id !== placeId && item.name !== placeName);
        localStorage.setItem('rutein_saved_places', JSON.stringify(filtered));
      }
    } catch {}

    // Remove from Supabase if real DB id
    if (user && !placeId.startsWith('saved_')) {
      try {
        await deleteSavedPlace(placeId);
      } catch {}
    }

    loadAllSavedPlaces();
  };

  const toggleSection = (section: ActiveSection) => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setActiveSection(section);
      return;
    }
    setActiveSection((prev) => (prev === section ? null : section));
  };

  return (
    <aside style={sidebarContainer(isCollapsed)}>
      {/* Header / Brand Logo & ID/EN Toggle & Expand/Collapse */}
      <div style={headerStyle(isCollapsed)}>
        {!isCollapsed ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center' }} title="Rutein Dashboard">
              <img
                src={logoRuteinSvg}
                alt="Rutein"
                style={{ height: 26, width: 'auto', filter: 'brightness(0) invert(1)' }}
              />
            </Link>
            {/* Global Language Switcher Pill */}
            <LanguageSwitcher variant="white" size="sm" />
          </div>
        ) : (
          <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center' }} title="Rutein Dashboard">
            <img
              src={logoNonTextSvg}
              alt="Rutein"
              style={{ height: 24, width: 'auto', filter: 'brightness(0) invert(1)' }}
            />
          </Link>
        )}

        <button
          onClick={() => setIsCollapsed((prev) => !prev)}
          style={toggleBtnStyle}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Main Navigation Sections */}
      <div style={contentStyle}>
        {/* Operators Sub-menu Navigation Section */}
        <div style={sectionWrapperStyle}>
          <button
            onClick={() => toggleSection('operators')}
            style={navItemStyle(activeSection === 'operators' && !isCollapsed)}
            title={t('sidebar.operators')}
          >
            <div style={navItemLabelGroup}>
              <Sliders size={18} />
              {!isCollapsed && <span>{t('sidebar.operators')}</span>}
            </div>
            {!isCollapsed && (
              <ChevronDown
                size={16}
                style={{
                  transform: activeSection === 'operators' ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                }}
              />
            )}
          </button>

          {!isCollapsed && activeSection === 'operators' && (
            <div style={accordionContentStyle}>
              <div style={operatorsListStyle}>
                {ALL_TRANSPORT_TYPES.map((type) => {
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => onSelectOperator?.(type)}
                      style={operatorSubmenuRowStyle}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {getOperatorIcon(type)}
                        </div>
                        <span style={operatorLabelStyle}>{TRANSPORT_TYPE_LABELS[type]}</span>
                      </div>
                      <ChevronRight size={14} color="rgba(251, 244, 238, 0.5)" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Saved Places Section */}
        <div style={sectionWrapperStyle}>
          <button
            onClick={() => toggleSection('saved')}
            style={navItemStyle(activeSection === 'saved' && !isCollapsed)}
            title={t('sidebar.saved_places')}
          >
            <div style={navItemLabelGroup}>
              <Bookmark size={18} />
              {!isCollapsed && <span>{t('sidebar.saved_places')}</span>}
            </div>
            {!isCollapsed && (
              <ChevronDown
                size={16}
                style={{
                  transform: activeSection === 'saved' ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                }}
              />
            )}
          </button>

          {!isCollapsed && activeSection === 'saved' && (
            <div style={accordionContentStyle}>
              {loadingSaved ? (
                <div style={mutedTextStyle}>{t('sidebar.loading_saved')}</div>
              ) : savedPlaces.length === 0 ? (
                <div style={mutedTextStyle}>{t('sidebar.no_saved')}</div>
              ) : (
                <div style={savedListStyle}>
                  {savedPlaces.map((place) => {
                    const isCoord = (str?: string | null) =>
                      !str ||
                      str === 'Lokasi Tujuan' ||
                      str.startsWith('-') ||
                      /^-?\d+\.\d+/.test(str);

                    let displayName = !isCoord(place.name) ? place.name : '';
                    let displayAddress = !isCoord(place.address) ? place.address : '';

                    if (!displayName && displayAddress) {
                      displayName = displayAddress;
                      displayAddress = '';
                    }

                    if (!displayName) {
                      if (place.latitude < -6.15 && place.latitude > -6.25 && place.longitude > 106.65 && place.longitude < 106.8) {
                        displayName = 'Rute Perjalanan - Tangerang';
                        displayAddress = 'Tangerang, Banten';
                      } else if (place.latitude < -6.1 && place.latitude > -6.25 && place.longitude > 106.8 && place.longitude < 106.9) {
                        displayName = 'Rute Perjalanan - Jakarta';
                        displayAddress = 'DKI Jakarta';
                      } else {
                        displayName = 'Rute Perjalanan Tersimpan';
                        displayAddress = 'Lokasi Terdaftar';
                      }
                    }

                    return (
                      <div
                        key={place.id}
                        onClick={() =>
                          onSelectSavedPlace(
                            place.latitude,
                            place.longitude,
                            displayName,
                            displayAddress || undefined
                          )
                        }
                        style={{
                          ...savedItemStyle,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 8,
                        }}
                        title={`Tampilkan rute ke ${displayName}`}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={savedItemName}>{displayName}</div>
                          {displayAddress && <div style={savedItemAddress}>{displayAddress}</div>}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteSaved(e, place.id, place.name)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--color-sidebar-text-muted)',
                            cursor: 'pointer',
                            padding: 4,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          title="Hapus rute tersimpan"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Anchored at the VERY Bottom */}
      <div style={bottomFooterStyle}>
        {/* Profile Link with Avatar/User Name */}
        <Link to="/profile" style={profileLinkStyle} title={t('nav.profile')}>
          <div style={navItemLabelGroup}>
            <div style={avatarStyle}>
              <User size={14} color="var(--color-sidebar-text)" />
            </div>
            {!isCollapsed && (
              <div style={profileTextGroup}>
                <span style={userNameStyle}>{userName}</span>
                <span style={userSubtextStyle}>{t('sidebar.view_profile')}</span>
              </div>
            )}
          </div>
        </Link>
      </div>
    </aside>
  );
}

// STYLES — STRICTLY USING CSS VARIABLES DEFINED FOR SIDEBAR
const sidebarContainer = (isCollapsed: boolean): React.CSSProperties => ({
  width: isCollapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)',
  minWidth: isCollapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)',
  height: '100vh',
  backgroundColor: 'var(--color-sidebar)',
  color: 'var(--color-sidebar-text)',
  display: 'flex',
  flexDirection: 'column',
  transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  zIndex: 'var(--z-panel)',
  boxShadow: '4px 0 16px rgba(0, 0, 0, 0.25)',
  userSelect: 'none',
});

const headerStyle = (isCollapsed: boolean): React.CSSProperties => ({
  height: 64,
  display: 'flex',
  alignItems: 'center',
  justifyContent: isCollapsed ? 'center' : 'space-between',
  padding: isCollapsed ? '0 12px' : '0 16px',
  borderBottom: '1px solid rgba(251, 244, 238, 0.15)',
});

const brandText: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 22,
  fontWeight: 700,
  color: 'var(--color-sidebar-text)',
  letterSpacing: '-0.02em',
};

const langSwitchContainer: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  background: 'rgba(0, 0, 0, 0.2)',
  borderRadius: 14,
  padding: 2,
};

const langBtnStyle = (isActive: boolean): React.CSSProperties => ({
  border: 'none',
  background: isActive ? 'var(--color-sidebar-active-bg)' : 'transparent',
  color: isActive ? 'var(--color-sidebar-active-text)' : 'var(--color-sidebar-text)',
  borderRadius: 12,
  padding: '2px 7px',
  fontSize: 10,
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
});

const toggleBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--color-sidebar-text)',
  cursor: 'pointer',
  padding: 6,
  borderRadius: 6,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background-color 0.15s ease',
};

const contentStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '16px 10px',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const sectionWrapperStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

const navItemStyle = (isActive: boolean): React.CSSProperties => ({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 14px',
  border: 'none',
  borderRadius: 8,
  backgroundColor: isActive ? 'var(--color-sidebar-active-bg)' : 'transparent',
  color: isActive ? 'var(--color-sidebar-active-text)' : 'var(--color-sidebar-text)',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
});

const disabledNavItemStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 14px',
  border: 'none',
  borderRadius: 8,
  backgroundColor: 'transparent',
  color: 'var(--color-sidebar-text-muted)',
  fontSize: 14,
  fontWeight: 500,
  cursor: 'not-allowed',
  opacity: 0.7,
};

const comingSoonBadge: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  textTransform: 'uppercase',
  padding: '2px 5px',
  borderRadius: 4,
  background: 'rgba(251, 244, 238, 0.15)',
  color: 'var(--color-sidebar-text-muted)',
};

const navLinkItemStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 14px',
  borderRadius: 8,
  backgroundColor: 'transparent',
  color: 'var(--color-sidebar-text)',
  fontSize: 14,
  fontWeight: 600,
  textDecoration: 'none',
  transition: 'background-color 0.15s ease',
};

const profileLinkStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  padding: '8px 14px',
  borderRadius: 8,
  backgroundColor: 'var(--color-sidebar-hover)',
  color: 'var(--color-sidebar-text)',
  textDecoration: 'none',
  marginTop: 4,
  transition: 'opacity 0.15s ease',
};

const avatarStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: '50%',
  background: 'rgba(251, 244, 238, 0.2)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const profileTextGroup: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  marginLeft: 2,
};

const userNameStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--color-sidebar-text)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: 140,
};

const userSubtextStyle: React.CSSProperties = {
  fontSize: 10,
  color: 'var(--color-sidebar-text-muted)',
};

const navItemLabelGroup: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
};

const accordionContentStyle: React.CSSProperties = {
  padding: '8px 12px 12px 14px',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const operatorsListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  maxHeight: 280,
  overflowY: 'auto',
};

const operatorSubmenuRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px 10px',
  borderRadius: 8,
  background: 'transparent',
  border: 'none',
  width: '100%',
  cursor: 'pointer',
  transition: 'background-color 0.15s ease',
  textAlign: 'left',
};

const checkboxStyle: React.CSSProperties = {
  width: 16,
  height: 16,
  cursor: 'pointer',
  accentColor: 'var(--color-sidebar-active-bg)',
};

const operatorLabelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--color-sidebar-text)',
};

const showAllBtnStyle: React.CSSProperties = {
  background: 'var(--color-sidebar-hover)',
  border: 'none',
  borderRadius: 6,
  color: 'var(--color-sidebar-text)',
  padding: '6px 12px',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  marginTop: 4,
  transition: 'opacity 0.15s ease',
};

const savedListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  maxHeight: 220,
  overflowY: 'auto',
};

const savedItemStyle: React.CSSProperties = {
  background: 'var(--color-sidebar-hover)',
  border: 'none',
  borderRadius: 6,
  padding: '8px 10px',
  color: 'var(--color-sidebar-text)',
  textAlign: 'left',
  cursor: 'pointer',
  transition: 'opacity 0.15s ease',
};

const savedItemName: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const savedItemAddress: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--color-sidebar-text-muted)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  marginTop: 2,
};

const mutedTextStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--color-sidebar-text-muted)',
  fontStyle: 'italic',
};

const bottomFooterStyle: React.CSSProperties = {
  marginTop: 'auto',
  padding: '12px 10px 16px 10px',
  borderTop: '1px solid rgba(251, 244, 238, 0.15)',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};
