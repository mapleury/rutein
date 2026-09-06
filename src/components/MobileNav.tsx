import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, User } from 'lucide-react';
import { useMobileSidebar } from '@/contexts/SidebarMapContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import logoRuteinSvg from '@/assets/images/logo-rutein.svg';

const MAP_ROUTES = ['/dashboard', '/map', '/'];

export function MobileTopBar() {
  const { openMobileSidebar } = useMobileSidebar();
  const location = useLocation();
  const isMap = MAP_ROUTES.includes(location.pathname);

  if (isMap) return null;

  return (
    <>
      <style>{mobileNavStyles}</style>
      <header className="mobile-top-bar" style={topBarWrapper}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={openMobileSidebar}
            className="mobile-top-menu-btn"
            aria-label="Buka Menu"
            title="Buka Menu"
            style={menuBtnStyle}
          >
            <Menu size={20} color="#DA362A" />
          </button>
          <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center' }}>
            <img
              src={logoRuteinSvg}
              alt="Rutein"
              style={{ height: 22, width: 'auto', display: 'block' }}
            />
          </Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LanguageSwitcher variant="white" size="sm" />
          <Link
            to="/profile"
            aria-label="Profil"
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#FDF0ED',
              border: '1.5px solid #E5D5C5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#DA362A',
            }}
          >
            <User size={16} />
          </Link>
        </div>
      </header>
    </>
  );
}

// Style
const mobileNavStyles = `
  /* Strictly hide on tablet (>=768px) and desktop */
  @media (min-width: 768px) {
    .mobile-top-bar {
      display: none !important;
    }
  }

  @media (max-width: 767px) {
    .mobile-top-bar {
      display: flex !important;
    }
  }

  .mobile-top-menu-btn:active {
    transform: scale(0.95);
    background-color: #F8E4DF !important;
  }
`;

const topBarWrapper: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  left: 0,
  right: 0,
  height: 54,
  background: '#FFFFFF',
  borderBottom: '1.5px solid #E5D5C5',
  padding: '0 16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  zIndex: 9980,
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
};

const menuBtnStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 10,
  border: '1.5px solid #E5D5C5',
  background: '#FDF0ED',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};
