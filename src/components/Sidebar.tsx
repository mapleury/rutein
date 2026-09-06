// Sidebar.tsx
// Unified left sidebar: replaces both NavBar.tsx and MapSidebar.tsx.
//
// - Main nav (Peta, Rute, Jadwal Transportasi, Budget Planner, Peringatan, Tanya AI)
//   is always visible, so this now IS the app's primary navigation.
// - "Operator & Moda" (transport filter) only renders on map routes
//   ('/dashboard', '/map', '/'). It uses a tree/connector-line layout instead
//   of a flat list, with a small toggle dot per row to control map visibility
//   and a click on the row to jump to that operator (onSelectOperator).
// - "Tempat Tersimpan" (saved places) stays available on every page; picking
//   one navigates to the map first if you're elsewhere.
// - Profile footer mirrors the avatar treatment from Profile.tsx (circular,
//   image with object-fit contain, initial-letter fallback) and opens a small
//   popover with "Lihat profil" / "Keluar".
// - Collapsed state hides the logo entirely and shows an icon-only rail.
// - The scroll track is flipped to the left edge of the sidebar via the
//   direction:rtl / direction:ltr pairing below, and is thin + low-opacity.
//
// Integration: mount this once in your app shell (e.g. replacing <NavBar />),
// give the page content a left margin/padding of var(--sidebar-width)
// (var(--sidebar-width-collapsed) when collapsed if you track that state
// higher up), and pass the map-related props only where you actually have
// map state to hand — they're optional so the component is safe to render
// on non-map pages too.

import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sliders,
  Bookmark,
  User,
  LogOut,
  Trash2,
  Check,
  Bus,
  TrainFront,
  Train,
  TramFront,
  TrainTrack,
  Plane,
  Ship,
  Map as MapIcon,
  ArrowRightLeft,
  Clock,
  Wallet,
  AlertTriangle,
  Sparkles,
  X,
} from 'lucide-react';
import {
  TRANSPORT_TYPE_LABELS,
  type IndonesiaTransportType,
} from '@/data/indonesiaTransportData';
import { TRANSPORT_TYPE_COLOR } from '@/components/transportMarkerIcon';
import { listSavedPlaces, deleteSavedPlace } from '@/services/savedPlacesService';
import { getProfile } from '@/services/preferencesService';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import type { SavedPlace } from '@/types/database.types';
import logoRuteinSvg from '@/assets/images/logo-rutein.svg';

const ALL_TRANSPORT_TYPES = Object.keys(
  TRANSPORT_TYPE_LABELS
) as IndonesiaTransportType[];

// Routes on which the map is actually visible — operator/transport filtering
// only makes sense there.
const MAP_ROUTES = ['/dashboard', '/map', '/'];

function getOperatorIcon(type: IndonesiaTransportType) {
  const iconProps = { size: 16, strokeWidth: 2 };
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

interface SidebarProps {
  /** Which transport types are currently shown on the map. Map pages only. */
  activeTypes?: Set<IndonesiaTransportType>;
  /** Toggle a transport type's visibility on the map. Map pages only. */
  onToggleType?: (type: IndonesiaTransportType) => void;
  /** Reset the filter to show every transport type. Map pages only. */
  onShowAllTypes?: () => void;
  /** Jump the map to a saved place. */
  onSelectSavedPlace?: (lat: number, lng: number, name?: string, address?: string) => void;
  /** Focus the map on a specific operator's routes. Map pages only. */
  onSelectOperator?: (type: IndonesiaTransportType) => void;
  /** Bump this to force a re-fetch of saved places (e.g. after saving one). */
  savedPlacesTrigger?: number;
  /** Controls mobile drawer open state */
  mobileOpen?: boolean;
  /** Callback to close mobile drawer */
  onCloseMobile?: () => void;
}

export default function Sidebar({
  activeTypes = new Set<IndonesiaTransportType>(),
  onToggleType,
  onShowAllTypes,
  onSelectSavedPlace,
  onSelectOperator,
  savedPlacesTrigger = 0,
  mobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const isMapPage = MAP_ROUTES.includes(location.pathname);

  // Tablet (>=768px) and Desktop default to expanded sidebar (isCollapsed: false) to match desktop
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 768
  );

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-close mobile drawer when route changes
  useEffect(() => {
    if (onCloseMobile) onCloseMobile();
  }, [location.pathname]);

  const [activeSection, setActiveSection] = useState<ActiveSection>(
    isMapPage ? 'operators' : null
  );
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const profileRef = useRef<HTMLDivElement>(null);

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Traveler';
  const userInitial = displayName.charAt(0).toUpperCase();

  // Pull the avatar the same way Profile.tsx does, so the two stay in sync.
  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    getProfile(user.id)
      .then((p) => {
        if (isMounted) setAvatarUrl(p?.avatar_url || '');
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Close the profile popover on outside click.
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadAllSavedPlaces = async () => {
    setLoadingSaved(true);

    let localItems: SavedPlace[] = [];
    try {
      const raw = localStorage.getItem('rutein_saved_places');
      if (raw) localItems = JSON.parse(raw);
    } catch {}

    let remoteItems: SavedPlace[] = [];
    if (user) {
      try {
        remoteItems = await listSavedPlaces(user.id);
      } catch {}
    }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, savedPlacesTrigger]);

  const handleDeleteSaved = async (e: React.MouseEvent, placeId: string, placeName: string) => {
    e.stopPropagation();
    try {
      const raw = localStorage.getItem('rutein_saved_places');
      if (raw) {
        const items = JSON.parse(raw);
        const filtered = items.filter(
          (item: any) => item.id !== placeId && item.name !== placeName
        );
        localStorage.setItem('rutein_saved_places', JSON.stringify(filtered));
      }
    } catch {}

    if (user && !placeId.startsWith('saved_')) {
      try {
        await deleteSavedPlace(placeId);
      } catch {}
    }

    loadAllSavedPlaces();
  };

  const handleSelectSavedPlace = (place: SavedPlace, name: string, address?: string) => {
    if (!isMapPage) navigate('/dashboard');
    onSelectSavedPlace?.(place.latitude, place.longitude, name, address);
  };

  const toggleSection = (section: ActiveSection) => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setActiveSection(section);
      return;
    }
    setActiveSection((prev) => (prev === section ? null : section));
  };

  async function handleSignOut() {
    setIsProfileOpen(false);
    if (isMobile && onCloseMobile) onCloseMobile();
    await signOut();
    navigate('/beranda');
  }

  const NAV_ITEMS = [
    { to: '/dashboard', label: t('nav.map') || 'Peta', icon: MapIcon },
    { to: '/routes', label: t('nav.routes') || 'Rute', icon: ArrowRightLeft },
    { to: '/schedule', label: t('nav.schedule') || 'Jadwal Transportasi', icon: Clock },
    { to: '/budget', label: t('nav.budget') || 'Anggaran', icon: Wallet },
    { to: '/disruptions', label: t('nav.disruptions') || 'Peringatan', icon: AlertTriangle },
    { to: '/confused', label: t('nav.ask_ai') || 'Tanya AI', icon: Sparkles },
  ];

  const isPathActive = (to: string) =>
    to === '/dashboard'
      ? MAP_ROUTES.includes(location.pathname)
      : location.pathname === to || location.pathname.startsWith(to + '/');

  return (
    <>
      {isMobile && mobileOpen && (
        <div
          onClick={onCloseMobile}
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(3px)',
            WebkitBackdropFilter: 'blur(3px)',
            zIndex: 9998,
            animation: 'sideFadeIn 0.2s ease forwards',
          }}
        />
      )}
      <aside style={sidebarContainer(isCollapsed, isMobile, mobileOpen)}>
        <style>{sidebarStyles}</style>

        {/* Header — logo disappears entirely when collapsed on desktop */}
        <div style={headerStyle(isCollapsed, isMobile)}>
          {(!isCollapsed || isMobile) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <Link
                to="/dashboard"
                className="side-logo-link"
                title="Rutein Dashboard"
                onClick={() => {
                  if (isMobile && onCloseMobile) onCloseMobile();
                }}
              >
                <img
                  src={logoRuteinSvg}
                  alt="Rutein"
                  style={{ marginLeft: 10, height: 22, width: 'auto', filter: 'brightness(0) invert(1)', flexShrink: 0 }}
                />
              </Link>
              <LanguageSwitcher variant="white" size="sm" style={{ marginLeft: 40 }} />
            </div>
          )}
          {isMobile ? (
            <button
              type="button"
              onClick={onCloseMobile}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                borderRadius: '50%',
                width: 32,
                height: 32,
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                marginLeft: 'auto',
              }}
              aria-label="Tutup menu"
            >
              <X size={18} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsCollapsed((prev) => !prev)}
              className="side-toggle-btn"
              style={toggleBtnStyle(isCollapsed)}
              title={isCollapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          )}
        </div>

        {/* Scrollable body — scrollbar is flipped to the left edge via rtl/ltr */}
        <div className="side-scroll-rtl" style={contentOuterStyle}>
          <div style={contentInnerStyle}>
            {/* Primary navigation */}
            <nav style={navGroupStyle}>
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isPathActive(item.to);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className="side-nav-item"
                    style={navItemStyle(active)}
                    title={item.label}
                    onClick={() => {
                      if (isMobile && onCloseMobile) onCloseMobile();
                    }}
                  >
                    <Icon size={17} strokeWidth={active ? 2.4 : 1.9} />
                    {(!isCollapsed || isMobile) && <span>{item.label}</span>}
                  </NavLink>
                );
              })}
            </nav>

            <div style={dividerStyle} />

            {/* Operator & transport filter — map pages only */}
            {isMapPage && (
              <div style={sectionWrapperStyle}>
                <button
                  type="button"
                  onClick={() => toggleSection('operators')}
                  className="side-nav-item"
                  style={sectionHeaderStyle(activeSection === 'operators' && (!isCollapsed || isMobile))}
                  title="Operator & Moda"
                >
                  <div style={navItemLabelGroup}>
                    <Sliders size={17} />
                    {(!isCollapsed || isMobile) && <span>Operator & Moda</span>}
                  </div>
                  {(!isCollapsed || isMobile) && (
                    <ChevronDown size={14} style={chevronStyle(activeSection === 'operators')} />
                  )}
                </button>

              {(!isCollapsed || isMobile) && activeSection === 'operators' && (
                <div style={accordionContentStyle}>
                  <div style={treeListStyle}>
                    {ALL_TRANSPORT_TYPES.map((type) => (
                      <div key={type} className="op-tree-line">
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            onSelectOperator?.(type);
                            if (isMobile && onCloseMobile) onCloseMobile();
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              onSelectOperator?.(type);
                              if (isMobile && onCloseMobile) onCloseMobile();
                            }
                          }}
                          className="op-tree-row"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '7px 8px',
                            borderRadius: 8,
                            cursor: 'pointer',
                            backgroundColor: 'transparent',
                            color: '#FFFFFF',
                            transition: 'background-color 0.15s ease, transform 0.15s ease',
                          }}
                          title={`Lihat rute & jadwal ${TRANSPORT_TYPE_LABELS[type]}`}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 20,
                              height: 20,
                              color: '#FFFFFF',
                              flexShrink: 0,
                            }}
                          >
                            {getOperatorIcon(type)}
                          </div>
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 500,
                              color: '#FFFFFF',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {TRANSPORT_TYPE_LABELS[type]}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Saved places — available everywhere */}
          <div style={sectionWrapperStyle}>
            <button
              type="button"
              onClick={() => toggleSection('saved')}
              className="side-nav-item"
              style={sectionHeaderStyle(activeSection === 'saved' && (!isCollapsed || isMobile))}
              title="Tempat Tersimpan"
            >
              <div style={navItemLabelGroup}>
                <Bookmark size={17} />
                {(!isCollapsed || isMobile) && <span>Tempat Tersimpan</span>}
              </div>
              {(!isCollapsed || isMobile) && (
                <ChevronDown size={14} style={chevronStyle(activeSection === 'saved')} />
              )}
            </button>

            {(!isCollapsed || isMobile) && activeSection === 'saved' && (
              <div style={accordionContentStyle}>
                {loadingSaved ? (
                  <div style={mutedTextStyle}>Memuat…</div>
                ) : savedPlaces.length === 0 ? (
                  <div style={mutedTextStyle}>Belum ada tempat tersimpan</div>
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
                        displayName = 'Rute Tersimpan';
                        displayAddress = 'Lokasi Terdaftar';
                      }

                      return (
                        <div
                          key={place.id}
                          onClick={() => {
                            handleSelectSavedPlace(place, displayName, displayAddress || undefined);
                            if (isMobile && onCloseMobile) onCloseMobile();
                          }}
                          className="side-saved-item"
                          style={savedItemStyle}
                          title={`Tampilkan rute ke ${displayName}`}
                        >
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={savedItemName}>{displayName}</div>
                            {displayAddress && <div style={savedItemAddress}>{displayAddress}</div>}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteSaved(e, place.id, place.name)}
                            className="side-delete-btn"
                            style={deleteBtnStyle}
                            title="Hapus tempat tersimpan"
                          >
                            <Trash2 size={13} />
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
      </div>

      {/* Profile footer — avatar treatment matches Profile.tsx */}
      <div style={footerStyle} ref={profileRef}>
        {isProfileOpen && (!isCollapsed || isMobile) && (
          <div className="side-profile-popover" style={profilePopoverStyle}>
            <Link
              to="/profile"
              className="side-popover-item"
              style={popoverItemStyle}
              onClick={() => {
                setIsProfileOpen(false);
                if (isMobile && onCloseMobile) onCloseMobile();
              }}
            >
              <User size={15} color="#DA362A" />
              <span>Lihat profil</span>
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="side-popover-item"
              style={{ ...popoverItemStyle, width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <LogOut size={15} color="#DA362A" />
              <span>Keluar dari akun</span>
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => (isCollapsed && !isMobile ? navigate('/profile') : setIsProfileOpen((p) => !p))}
          className="side-profile-btn"
          style={profileBtnStyle}
          title={displayName}
        >
          <div style={avatarStyle}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 5 }}
              />
            ) : (
              <span style={{ fontSize: 13, fontWeight: 400, color: '#DA362A' }}>{userInitial}</span>
            )}
          </div>
          {(!isCollapsed || isMobile) && (
            <div style={profileTextGroup}>
              <span style={userNameStyle}>{displayName}</span>
              <span style={userSubtextStyle}>Lihat profil</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  </>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Injected CSS — hover animation, connector-line tree, and the flipped
// low-opacity scrollbar. Kept scoped to side-* / op-tree-* class names so it
// can't leak into the rest of the app.
// ────────────────────────────────────────────────────────────────────────
const sidebarStyles = `
  .side-logo-link { display: flex; align-items: center; }

  @keyframes sidePopoverIn {
    from { opacity: 0; transform: translateY(6px) scale(0.97); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  .side-profile-popover {
    animation: sidePopoverIn 0.16s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    transform-origin: bottom center;
  }

  .side-toggle-btn { transition: background-color 0.15s ease, transform 0.15s ease; }
  .side-toggle-btn:hover { background-color: rgba(255, 255, 255, 0.12); }

  .side-nav-item {
    transition: background-color 0.15s ease, transform 0.15s ease, color 0.15s ease, border-color 0.15s ease;
  }
  .side-nav-item:hover {
    background-color: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.45) !important;
    transform: translateX(2px);
  }

  .side-show-all { transition: background-color 0.15s ease, transform 0.15s ease; }
  .side-show-all:hover { background-color: rgba(255, 255, 255, 0.16); transform: translateY(-1px); }

  .op-tree-row { transition: background-color 0.15s ease, transform 0.15s ease; }
  .op-tree-row:hover { background-color: rgba(255, 255, 255, 0.08); transform: translateX(2px); }

  .op-tree-toggle { transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.1s ease; }
  .op-tree-toggle:hover { transform: scale(1.12); }

  /* Tree connector lines, matching a nested file-tree look */
  .op-tree-line { position: relative; padding-left: 18px; margin-left: 6px; }
  .op-tree-line::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 50%;
    width: 10px;
    border-left: 1.5px solid rgba(255, 255, 255, 0.28);
    border-bottom: 1.5px solid rgba(255, 255, 255, 0.28);
    border-bottom-left-radius: 8px;
  }
  .op-tree-line::after {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    bottom: -10px;
    border-left: 1.5px solid rgba(255, 255, 255, 0.28);
  }
  .op-tree-line:last-child::after { display: none; }

  .side-saved-item { transition: background-color 0.15s ease, transform 0.15s ease; }
  .side-saved-item:hover { background-color: rgba(255, 255, 255, 0.12); transform: translateX(2px); }
  .side-saved-item .side-delete-btn { opacity: 0; }
  .side-saved-item:hover .side-delete-btn { opacity: 1; }
  .side-delete-btn { transition: background-color 0.15s ease, opacity 0.15s ease, color 0.15s ease; }
  .side-delete-btn:hover { background-color: rgba(0, 0, 0, 0.15); color: #ffffff; }

  .side-profile-btn { transition: background-color 0.15s ease; }
  .side-profile-btn:hover { background-color: rgba(255, 255, 255, 0.1); }

  .side-popover-item { transition: background-color 0.15s ease; }
  .side-popover-item:hover { background-color: #FDF0ED; }

  /* Scrollbar flipped to the left edge, thin and low-opacity */
  .side-scroll-rtl {
    direction: rtl;
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.16) transparent;
  }
  .side-scroll-rtl::-webkit-scrollbar { width: 4px; }
  .side-scroll-rtl::-webkit-scrollbar-track { background: transparent; }
  .side-scroll-rtl::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.16);
    border-radius: 4px;
  }
  .side-scroll-rtl::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.3); }
`;

// ────────────────────────────────────────────────────────────────────────
// Styles
// ────────────────────────────────────────────────────────────────────────
const sidebarContainer = (
  isCollapsed: boolean,
  isMobile: boolean,
  mobileOpen: boolean
): React.CSSProperties => {
  if (isMobile) {
    return {
      position: 'fixed',
      top: 0,
      left: 0,
      bottom: 0,
      width: 280,
      maxWidth: '84vw',
      height: '100dvh',
      backgroundColor: 'var(--color-sidebar, #DA362A)',
      color: 'var(--color-sidebar-text, #FFFDF9)',
      display: 'flex',
      flexDirection: 'column',
      transform: mobileOpen ? 'translateX(0)' : 'translateX(-105%)',
      transition: 'transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
      zIndex: 9999,
      boxShadow: mobileOpen ? '8px 0 32px rgba(0, 0, 0, 0.35)' : 'none',
      userSelect: 'none',
      flexShrink: 0,
      borderRadius: '0 24px 24px 0',
      visibility: mobileOpen ? 'visible' : 'hidden',
    };
  }

  return {
    width: isCollapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)',
    minWidth: isCollapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width)',
    height: '100vh',
    backgroundColor: 'var(--color-sidebar, #DA362A)',
    color: 'var(--color-sidebar-text, #FFFDF9)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    zIndex: 'var(--z-panel)' as any,
    boxShadow: '4px 0 16px rgba(0, 0, 0, 0.15)',
    userSelect: 'none',
    flexShrink: 0,
    borderRadius: '0 24px 24px 0',
  };
};

const headerStyle = (isCollapsed: boolean, isMobile: boolean): React.CSSProperties => ({
  height: 56,
  display: 'flex',
  alignItems: 'center',
  justifyContent: isCollapsed && !isMobile ? 'center' : 'space-between',
  padding: isCollapsed && !isMobile ? '0 10px' : '0 14px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
  flexShrink: 0,
});

const toggleBtnStyle = (isCollapsed: boolean): React.CSSProperties => ({
  background: 'transparent',
  border: 'none',
  color: 'var(--color-sidebar-text, #FFFDF9)',
  cursor: 'pointer',
  padding: 7,
  borderRadius: 8,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginLeft: isCollapsed ? 0 : 'auto',
});

const contentOuterStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  minHeight: 0,
};

const contentInnerStyle: React.CSSProperties = {
  direction: 'ltr',
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  padding: '10px 10px 16px',
};

const navGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
};

const navItemStyle = (isActive: boolean): React.CSSProperties => ({
  textDecoration: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '10px 12px',
  borderRadius: 10,
  fontSize: 14,
  fontWeight: isActive ? 600 : 500,
  color: isActive ? '#DA362A' : 'var(--color-sidebar-text, #FFFDF9)',
  backgroundColor: isActive ? 'var(--color-sidebar-active-bg, #FFFDF9)' : 'transparent',
  textAlign: 'left',
  boxShadow: isActive ? '0 2px 8px rgba(0, 0, 0, 0.12)' : 'none',
  border: '1px solid transparent',
  cursor: 'pointer',
  width: '100%',
  boxSizing: 'border-box',
});

const sectionHeaderStyle = (isActive: boolean): React.CSSProperties => ({
  ...navItemStyle(isActive),
  justifyContent: 'space-between',
});

const navItemLabelGroup: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
};

const chevronStyle = (isOpen: boolean): React.CSSProperties => ({
  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
  transition: 'transform 0.2s ease',
  flexShrink: 0,
});

const dividerStyle: React.CSSProperties = {
  height: 1,
  background: 'rgba(255, 255, 255, 0.15)',
  margin: '10px 4px',
};

const sectionWrapperStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

const accordionContentStyle: React.CSSProperties = {
  padding: '8px 8px 12px 10px',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const showAllBtnStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.1)',
  border: 'none',
  borderRadius: 8,
  color: 'var(--color-sidebar-text, #FFFDF9)',
  padding: '8px 12px',
  fontSize: 12.5,
  fontWeight: 600,
  cursor: 'pointer',
  textAlign: 'left',
  width: '100%',
};

const treeListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  paddingTop: 4,
};

const operatorRowStyle = (isActive: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  padding: '7px 8px',
  borderRadius: 8,
  cursor: 'pointer',
  backgroundColor: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
});

const operatorLabelGroup: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 9,
  flex: 1,
  minWidth: 0,
  textAlign: 'left',
};

const operatorIconBubble = (isActive: boolean, type: IndonesiaTransportType): React.CSSProperties => ({
  width: 22,
  height: 22,
  borderRadius: 7,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  background: isActive ? TRANSPORT_TYPE_COLOR[type] ?? '#FFFDF9' : 'rgba(255, 255, 255, 0.16)',
  color: '#FFFFFF',
});

const operatorLabelStyle = (isActive: boolean): React.CSSProperties => ({
  fontSize: 13,
  fontWeight: isActive ? 600 : 500,
  color: 'var(--color-sidebar-text, #FFFDF9)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

const toggleDotStyle = (isActive: boolean): React.CSSProperties => ({
  width: 16,
  height: 16,
  borderRadius: 5,
  flexShrink: 0,
  border: `1.5px solid ${isActive ? '#FFFDF9' : 'rgba(255, 255, 255, 0.4)'}`,
  background: isActive ? '#FFFDF9' : 'transparent',
  color: '#DA362A',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  padding: 0,
});

const mutedTextStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'rgba(255, 255, 255, 0.6)',
  fontStyle: 'italic',
  padding: '2px 4px',
};

const savedListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const savedItemStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.07)',
  border: 'none',
  borderRadius: 8,
  padding: '9px 10px',
  color: 'var(--color-sidebar-text, #FFFDF9)',
  textAlign: 'left',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
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
  color: 'rgba(255, 255, 255, 0.65)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  marginTop: 2,
};

const deleteBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'rgba(255, 255, 255, 0.75)',
  cursor: 'pointer',
  padding: 5,
  borderRadius: 6,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const footerStyle: React.CSSProperties = {
  position: 'relative',
  marginTop: 'auto',
  padding: 10,
  borderTop: '1px solid rgba(255, 255, 255, 0.15)',
  flexShrink: 0,
};

const profileBtnStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '8px 8px',
  borderRadius: 10,
  background: 'rgba(255, 255, 255, 0.07)',
  border: 'none',
  color: 'var(--color-sidebar-text, #FFFDF9)',
  cursor: 'pointer',
  textAlign: 'left',
};

const avatarStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: '50%',
  background: '#FFFDF9',
  border: '1px solid rgba(255, 255, 255, 0.25)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  flexShrink: 0,
};

const profileTextGroup: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
};

const userNameStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: 140,
};

const userSubtextStyle: React.CSSProperties = {
  fontSize: 10.5,
  color: 'rgba(255, 255, 255, 0.7)',
};

const profilePopoverStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 'calc(100% + 8px)',
  left: 10,
  right: 10,
  background: '#FFFFFF',
  border: '1.5px solid #E5D5C5',
  borderRadius: 14,
  padding: 6,
  boxShadow: '0 12px 28px rgba(0, 0, 0, 0.2)',
  zIndex: 100,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};

const popoverItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '9px 10px',
  borderRadius: 10,
  textDecoration: 'none',
  fontSize: 13,
  fontWeight: 600,
  color: '#1E1E1E',
  textAlign: 'left',
};