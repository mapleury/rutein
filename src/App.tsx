import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { SidebarMapProvider, useSidebarMapControls } from '@/contexts/SidebarMapContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';

import LandingPage from '@/pages/LandingPage';
import { Login, TransportPreference, ProfileSelect } from '@/pages/Auth';
import MapDashboard from '@/pages/MapDashboard';
import RouteComparison from '@/pages/RouteComparison';
import RouteDetail from '@/pages/RouteDetail';
import BudgetPlanner from '@/pages/BudgetPlanner';
import Schedule from '@/pages/Schedule';
import Disruptions from '@/pages/Disruptions';
import ConfusedMode from '@/pages/ConfusedMode';
import SavedPlaces from '@/pages/SavedPlaces';
import Profile from '@/pages/Profile';

function AppLayout({ children }: { children: React.ReactNode }) {
  const mapControls = useSidebarMapControls();

  return (
    <ProtectedRoute>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
        <Sidebar
          activeTypes={mapControls.activeTypes}
          onToggleType={mapControls.onToggleType}
          onShowAllTypes={mapControls.onShowAllTypes}
          onSelectSavedPlace={mapControls.onSelectSavedPlace}
          onSelectOperator={mapControls.onSelectOperator}
          savedPlacesTrigger={mapControls.savedPlacesTrigger}
        />
        <main style={{ flex: 1, minWidth: 0, height: '100vh', overflowY: 'auto' }}>{children}</main>
      </div>
    </ProtectedRoute>
  );
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
              <Route path="/login" element={<Login />} />
              <Route path="/onboarding/transport" element={<TransportPreference />} />
              <Route path="/onboarding/profile" element={<ProfileSelect />} />
              <Route path="/dashboard" element={<AppLayout><MapDashboard /></AppLayout>} />
              <Route path="/map" element={<AppLayout><MapDashboard /></AppLayout>} />
              <Route path="/routes" element={<AppLayout><RouteComparison /></AppLayout>} />
              <Route path="/routes/:searchId" element={<AppLayout><RouteDetail /></AppLayout>} />
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