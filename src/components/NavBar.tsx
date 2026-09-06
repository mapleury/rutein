import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  ArrowRightLeft,
  Clock,
  Wallet,
  AlertTriangle,
  Sparkles,
  User,
  Bookmark,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Home,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import logoRuteinSvg from '@/assets/images/logo-rutein.svg';

export default function NavBar() {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileOpen(false);
  }, [location.pathname]);

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  const userEmail = user?.email || 'Pengguna';
  const displayName = user?.user_metadata?.full_name || userEmail.split('@')[0];
  const userInitial = displayName.charAt(0).toUpperCase();

  const NAV_LINKS = [
    { to: '/dashboard', label: t('nav.map'), icon: Map },
    { to: '/routes', label: t('nav.routes'), icon: ArrowRightLeft },
    { to: '/schedule', label: t('nav.schedule'), icon: Clock },
    { to: '/budget', label: t('nav.budget'), icon: Wallet },
    { to: '/disruptions', label: t('nav.disruptions'), icon: AlertTriangle },
  ];

  return (
    <>
      <header style={topBar}>
        <div style={innerHeader}>
          {/* LEFT: Official Brand Logo */}
          <Link to="/dashboard" style={brandLink} title="Rutein Dashboard">
            <img src={logoRuteinSvg} alt="Rutein" style={{ height: 32, width: 'auto' }} />
          </Link>

          {/* CENTER: Clean Unified Navigation Tabs */}
          <nav className="desktop-nav" style={centerNav}>
            {NAV_LINKS.map((item) => {
              const Icon = item.icon;
              const isItemActive =
                item.to === '/dashboard' || item.to === '/map'
                  ? location.pathname === '/dashboard' || location.pathname === '/map' || location.pathname === '/'
                  : location.pathname === item.to || location.pathname.startsWith(item.to + '/');

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  style={{
                    ...navLinkStyle,
                    color: isItemActive ? '#DA362A' : '#5C5248',
                    backgroundColor: isItemActive ? 'rgba(218, 54, 42, 0.08)' : 'transparent',
                    fontWeight: isItemActive ? 700 : 500,
                  }}
                >
                  <Icon size={16} strokeWidth={isItemActive ? 2.4 : 1.9} color={isItemActive ? '#DA362A' : '#7A6F62'} />
                  <span>{item.label}</span>
                  {isItemActive && (
                    <span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        background: '#DA362A',
                        marginLeft: 1,
                      }}
                    />
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* RIGHT: Language Switcher + Tanya AI CTA + User Profile Dropdown */}
          <div style={rightActions}>
            <LanguageSwitcher />

            {/* Tanya AI Hero Feature Button */}
            <NavLink
              to="/confused"
              className="desktop-nav hover-lift-card"
              style={({ isActive }) => ({
                ...aiCtaButton,
                background: isActive ? '#B82A1F' : '#DA362A',
                boxShadow: isActive
                  ? '0 3px 12px rgba(218, 54, 42, 0.4)'
                  : '0 2px 10px rgba(218, 54, 42, 0.25)',
              })}
              title="Buka Asisten Navigasi AI Rutein"
            >
              <Sparkles size={15} color="#FFFFFF" strokeWidth={2.4} />
              <span>{t('nav.ask_ai')}</span>
            </NavLink>

            {/* User Profile Pill Button */}
            <div style={{ position: 'relative' }} ref={profileDropdownRef}>
              <button
                type="button"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                style={profileButton}
                onMouseOver={(e) => (e.currentTarget.style.borderColor = '#DA362A')}
                onMouseOut={(e) => (e.currentTarget.style.borderColor = '#E5D5C5')}
              >
                <div style={avatarCircle}>
                  {userInitial}
                </div>
                <span style={displayNameStyle}>
                  {displayName}
                </span>
                <ChevronDown
                  size={14}
                  color="#7A6F62"
                  style={{
                    transform: isProfileOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}
                />
              </button>

              {/* Profile Dropdown Card */}
              {isProfileOpen && (
                <div style={dropdownCard}>
                  {/* User Header Info */}
                  <div style={dropdownHeader}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#DA362A', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Akun Pengguna
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1E1E1E', marginTop: 2 }}>
                      {displayName}
                    </div>
                    <div style={{ fontSize: 11, color: '#7A6F62', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {userEmail}
                    </div>
                  </div>

                  {/* Menu Links */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Link
                      to="/profile"
                      style={dropdownItem}
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <User size={15} color="#DA362A" />
                      <span>{t('nav.profile')}</span>
                    </Link>
                    <Link
                      to="/places"
                      style={dropdownItem}
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Bookmark size={15} color="#DA362A" />
                      <span>{t('nav.saved_places')}</span>
                    </Link>
                  </div>

                  {/* Sign Out Button */}
                  <div style={{ borderTop: '1px solid #F0E2D4', marginTop: 6, paddingTop: 6 }}>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      style={{
                        ...dropdownItem,
                        width: '100%',
                        color: '#DA362A',
                        fontWeight: 600,
                        cursor: 'pointer',
                        background: 'none',
                        border: 'none',
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#FDF0ED')}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <LogOut size={15} color="#DA362A" />
                      <span>Keluar dari Akun</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav style={bottomNav} className="mobile-nav">
        <NavLink
          to="/dashboard"
          end
          style={({ isActive }) => ({
            ...bottomNavItem,
            color: isActive ? '#DA362A' : '#7A6F62',
          })}
        >
          {({ isActive }) => (
            <>
              <div style={{ ...mobileIconWrapper, background: isActive ? '#FDF0ED' : 'transparent' }}>
                <LayoutDashboard size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span style={{ fontSize: 11, fontWeight: isActive ? 700 : 500 }}>Home</span>
            </>
          )}
        </NavLink>

        <NavLink
          to="/map"
          style={({ isActive }) => ({
            ...bottomNavItem,
            color: isActive ? '#DA362A' : '#7A6F62',
          })}
        >
          {({ isActive }) => (
            <>
              <div style={{ ...mobileIconWrapper, background: isActive ? '#FDF0ED' : 'transparent' }}>
                <Map size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span style={{ fontSize: 11, fontWeight: isActive ? 700 : 500 }}>Peta</span>
            </>
          )}
        </NavLink>

        <NavLink
          to="/routes"
          style={({ isActive }) => ({
            ...bottomNavItem,
            color: isActive ? '#DA362A' : '#7A6F62',
          })}
        >
          {({ isActive }) => (
            <>
              <div style={{ ...mobileIconWrapper, background: isActive ? '#FDF0ED' : 'transparent' }}>
                <ArrowRightLeft size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span style={{ fontSize: 11, fontWeight: isActive ? 700 : 500 }}>Rute</span>
            </>
          )}
        </NavLink>

        <NavLink
          to="/schedule"
          style={({ isActive }) => ({
            ...bottomNavItem,
            color: isActive ? '#DA362A' : '#7A6F62',
          })}
        >
          {({ isActive }) => (
            <>
              <div style={{ ...mobileIconWrapper, background: isActive ? '#FDF0ED' : 'transparent' }}>
                <Clock size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span style={{ fontSize: 11, fontWeight: isActive ? 700 : 500 }}>Jadwal</span>
            </>
          )}
        </NavLink>

        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          style={{
            ...bottomNavItem,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: isMobileMenuOpen ? '#DA362A' : '#7A6F62',
          }}
        >
          <div style={{ ...mobileIconWrapper, background: isMobileMenuOpen ? '#FDF0ED' : 'transparent' }}>
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </div>
          <span style={{ fontSize: 11, fontWeight: isMobileMenuOpen ? 700 : 500 }}>Menu</span>
        </button>
      </nav>

      {/* MOBILE FULL MENU DRAWER SHEET */}
      {isMobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(30, 30, 30, 0.4)',
            backdropFilter: 'blur(6px)',
            zIndex: 99,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            style={{
              background: '#FCF4ED',
              borderTop: '2px solid #E5D5C5',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: '24px 20px calc(80px + env(safe-area-inset-bottom))',
              boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 className="font-jockey" style={{ fontSize: 22, color: '#1E1E1E', margin: 0 }}>
                  Fitur Lengkap Rutein
                </h3>
                <p style={{ fontSize: 12, color: '#7A6F62', margin: 0 }}>Pilih menu yang ingin kamu buka</p>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5D5C5',
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={16} color="#1E1E1E" />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <Link
                to="/confused"
                style={mobileSheetCard}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sparkles size={18} color="#DA362A" />
                  <strong>Tanya AI</strong>
                </div>
                <span style={{ fontSize: 11, color: '#7A6F62' }}>Asisten Navigasi</span>
              </Link>

              <Link
                to="/budget"
                style={mobileSheetCard}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Wallet size={18} color="#DA362A" />
                  <strong>Budget</strong>
                </div>
                <span style={{ fontSize: 11, color: '#7A6F62' }}>Rencana Anggaran</span>
              </Link>

              <Link
                to="/disruptions"
                style={mobileSheetCard}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={18} color="#DA362A" />
                  <strong>Peringatan</strong>
                </div>
                <span style={{ fontSize: 11, color: '#7A6F62' }}>Lalu Lintas Terkini</span>
              </Link>

              <Link
                to="/places"
                style={mobileSheetCard}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Bookmark size={18} color="#DA362A" />
                  <strong>Tersimpan</strong>
                </div>
                <span style={{ fontSize: 11, color: '#7A6F62' }}>Rumah & Kantor</span>
              </Link>

              <Link
                to="/profile"
                style={mobileSheetCard}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <User size={18} color="#DA362A" />
                  <strong>Profil</strong>
                </div>
                <span style={{ fontSize: 11, color: '#7A6F62' }}>Akun Pengguna</span>
              </Link>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 14,
                background: '#FFFFFF',
                border: '1.5px solid #E5D5C5',
                color: '#DA362A',
                fontWeight: 700,
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                cursor: 'pointer',
              }}
            >
              <LogOut size={16} /> Keluar dari Akun
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const topBar: React.CSSProperties = {
  width: '100%',
  borderBottom: '1.5px solid #E5D5C5',
  background: 'rgba(252, 244, 237, 0.94)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  position: 'sticky',
  top: 0,
  zIndex: 45,
  boxShadow: '0 2px 14px rgba(0, 0, 0, 0.03)',
};

const innerHeader: React.CSSProperties = {
  maxWidth: 1240,
  margin: '0 auto',
  padding: '10px 24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
};

const brandLink: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  textDecoration: 'none',
  flexShrink: 0,
};

const centerNav: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
};

const navLinkStyle: React.CSSProperties = {
  textDecoration: 'none',
  fontSize: 13.5,
  padding: '7px 13px',
  borderRadius: 10,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
  transition: 'all 0.16s ease',
  whiteSpace: 'nowrap',
};

const rightActions: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  flexShrink: 0,
};

const aiCtaButton: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  height: 32,
  padding: '0 14px',
  borderRadius: 999,
  color: '#FFFFFF',
  fontSize: 13,
  fontWeight: 700,
  textDecoration: 'none',
  letterSpacing: '0.01em',
  transition: 'all 0.18s ease',
  cursor: 'pointer',
  boxSizing: 'border-box',
};

const profileButton: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  background: '#FFFFFF',
  border: '1.5px solid #E5D5C5',
  borderRadius: 999,
  padding: '4px 12px 4px 4px',
  cursor: 'pointer',
  transition: 'all 0.18s ease',
  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
};

const avatarCircle: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: '50%',
  background: '#DA362A',
  color: '#FFFFFF',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 700,
  fontSize: 12.5,
};

const displayNameStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: '#1E1E1E',
  maxWidth: 110,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const dropdownCard: React.CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 10px)',
  right: 0,
  width: 240,
  background: '#FFFFFF',
  border: '1.5px solid #E5D5C5',
  borderRadius: 16,
  padding: '8px',
  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.1)',
  zIndex: 100,
  animation: 'fadeIn 0.15s ease',
};

const dropdownHeader: React.CSSProperties = {
  padding: '10px 12px',
  borderBottom: '1px solid #F0E2D4',
  marginBottom: 6,
};

const dropdownItem: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '8px 12px',
  borderRadius: 10,
  textDecoration: 'none',
  fontSize: 13,
  fontWeight: 500,
  color: '#1E1E1E',
  transition: 'background-color 0.15s ease',
};

const bottomNav: React.CSSProperties = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  display: 'none', // Overridden to flex on mobile screens via CSS
  justifyContent: 'space-around',
  alignItems: 'center',
  padding: '6px 12px calc(8px + env(safe-area-inset-bottom))',
  background: 'rgba(252, 244, 237, 0.96)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  borderTop: '1.5px solid #E5D5C5',
  zIndex: 45,
  boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.04)',
};

const bottomNavItem: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 2,
  textDecoration: 'none',
  minWidth: 54,
  padding: '4px 0',
  borderRadius: 10,
  transition: 'all 0.15s ease',
};

const mobileIconWrapper: React.CSSProperties = {
  width: 36,
  height: 28,
  borderRadius: 14,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.15s ease',
};

const mobileSheetCard: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1.5px solid #E5D5C5',
  borderRadius: 14,
  padding: '12px 14px',
  textDecoration: 'none',
  color: '#1E1E1E',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  transition: 'all 0.15s ease',
};
