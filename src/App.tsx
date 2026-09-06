import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { SidebarMapProvider, useSidebarMapControls, useMobileSidebar } from '@/contexts/SidebarMapContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';

import LandingPage from '@/pages/LandingPage';
import { Login, Register, TransportPreference, ProfileSelect } from '@/pages/Auth';
import MapDashboard from '@/pages/MapDashboard';
import RouteComparison from '@/pages/RouteComparison';
import RouteDetail from '@/pages/RouteDetail';
import BudgetPlanner from '@/pages/BudgetPlanner';
import Schedule from '@/pages/Schedule';
import Disruptions from '@/pages/Disruptions';
import ConfusedMode from '@/pages/ConfusedMode';
import SavedPlaces from '@/pages/SavedPlaces';
import Profile from '@/pages/Profile';

import { MobileTopBar } from '@/components/MobileNav';

const MAP_PATHS = ['/dashboard', '/map', '/'];

function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const mapControls = useSidebarMapControls();
  const { isMobileSidebarOpen, closeMobileSidebar } = useMobileSidebar();
  const isMap = MAP_PATHS.includes(location.pathname);
  const isNoScrollPage = isMap || location.pathname === '/confused';

  return (
    <ProtectedRoute>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)', color: 'var(--color-text)', position: 'relative' }}>
        <Sidebar
          activeTypes={mapControls.activeTypes}
          onToggleType={mapControls.onToggleType}
          onShowAllTypes={mapControls.onShowAllTypes}
          onSelectSavedPlace={mapControls.onSelectSavedPlace}
          onSelectOperator={mapControls.onSelectOperator}
          savedPlacesTrigger={mapControls.savedPlacesTrigger}
          mobileOpen={isMobileSidebarOpen}
          onCloseMobile={closeMobileSidebar}
        />
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, height: '100vh', overflow: 'hidden', position: 'relative' }}>
          <MobileTopBar />
          <main
            className={`app-main-content ${isMap ? 'is-map' : ''} ${location.pathname === '/confused' ? 'is-confused' : ''}`}
            style={{
              flex: 1,
              minWidth: 0,
              height: '100%',
              overflowY: isNoScrollPage ? 'hidden' : 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

function LogoutHandler() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    signOut().finally(() => {
      navigate('/beranda', { replace: true });
    });
  }, [signOut, navigate]);

  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <SidebarMapProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<AppLayout><MapDashboard /></AppLayout>} />
              <Route path="/beranda" element={<LandingPage />} />
              <Route path="/landing" element={<Navigate to="/beranda" replace />} />
              <Route path="/logout" element={<LogoutHandler />} />
              <Route path="/keluar" element={<LogoutHandler />} />
              <Route path="/login" element={<Login />} />
              <Route path="/daftar" element={<Register />} />
              <Route path="/register" element={<Navigate to="/daftar" replace />} />
              <Route path="/signup" element={<Navigate to="/daftar" replace />} />
              <Route path="/onboarding/transport" element={<TransportPreference />} />
              <Route path="/onboarding/profile" element={<ProfileSelect />} />
              <Route path="/dashboard" element={<AppLayout><MapDashboard /></AppLayout>} />
              <Route path="/map" element={<AppLayout><MapDashboard /></AppLayout>} />
              <Route path="/budget" element={<AppLayout><BudgetPlanner /></AppLayout>} />
              <Route path="/schedule" element={<AppLayout><Schedule /></AppLayout>} />
              <Route path="/disruptions" element={<AppLayout><Disruptions /></AppLayout>} />
              <Route path="/disruption" element={<AppLayout><Disruptions /></AppLayout>} />
              <Route path="/confused" element={<AppLayout><ConfusedMode /></AppLayout>} />
              <Route path="/places" element={<AppLayout><SavedPlaces /></AppLayout>} />
              <Route path="/profile" element={<AppLayout><Profile /></AppLayout>} />
            </Routes>
          </BrowserRouter>
        </SidebarMapProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}