import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import NavBar from '@/components/NavBar';

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
import Preferences from '@/pages/Preferences';
import Profile from '@/pages/Profile';

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div style={{ minHeight: '100vh', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
        <NavBar />
        <main>{children}</main>
      </div>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<ProtectedRoute><MapDashboard /></ProtectedRoute>} />
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/onboarding/transport" element={<ProtectedRoute><TransportPreference /></ProtectedRoute>} />
            <Route path="/onboarding/profile" element={<ProtectedRoute><ProfileSelect /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><MapDashboard /></ProtectedRoute>} />
            <Route path="/map" element={<ProtectedRoute><MapDashboard /></ProtectedRoute>} />
            <Route path="/routes" element={<AppLayout><RouteComparison /></AppLayout>} />
            <Route path="/routes/:searchId" element={<AppLayout><RouteDetail /></AppLayout>} />
            <Route path="/budget" element={<AppLayout><BudgetPlanner /></AppLayout>} />
            <Route path="/schedule" element={<AppLayout><Schedule /></AppLayout>} />
            <Route path="/disruptions" element={<AppLayout><Disruptions /></AppLayout>} />
            <Route path="/disruption" element={<AppLayout><Disruptions /></AppLayout>} />
            <Route path="/confused" element={<AppLayout><ConfusedMode /></AppLayout>} />
            <Route path="/places" element={<AppLayout><SavedPlaces /></AppLayout>} />
            <Route path="/preferences" element={<AppLayout><Preferences /></AppLayout>} />
            <Route path="/profile" element={<AppLayout><Profile /></AppLayout>} />
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </AuthProvider>
  );
}
