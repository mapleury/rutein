import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PlaceSearchInput from '@/components/PlaceSearchInput';
import RouteOptionCard from '@/components/RouteOptionCard';
import { getCurrentPosition } from '@/services/locationService';
import { reverseGeocode } from '@/services/geocodingService';
import { planAndCompareRoutes, saveRouteSearch, type LogicalRouteComparisonResult, type LogicalRouteOption, type RouteCategory } from '@/services/routeService';
import { useAuth } from '@/contexts/AuthContext';
import type { PlaceResult } from '@/types/domain.types';

const CATEGORY_ORDER: RouteCategory[] = ['efficient', 'cheapest', 'hurry'];

export default function RouteComparison() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const navState = location.state as { origin?: PlaceResult; destination?: PlaceResult } | null;
  const initialOrigin = navState?.origin ?? null;
  const initialDestination = navState?.destination ?? null;

  const [origin, setOrigin] = useState<PlaceResult | null>(initialOrigin);
  const [destination, setDestination] = useState<PlaceResult | null>(initialDestination);
  const [result, setResult] = useState<LogicalRouteComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingCurrentLocation, setUsingCurrentLocation] = useState(false);

  useEffect(() => {
    if (initialOrigin) return;

    (async () => {
      setUsingCurrentLocation(true);
      try {
        const point = await getCurrentPosition();
        const place = await reverseGeocode(point.lat, point.lng);
        setOrigin((current) => current ?? place ?? { ...point, label: 'Current location', address: 'Current location' });
      } catch {
      } finally {
        setUsingCurrentLocation(false);
      }
    })();
  }, [initialOrigin]);

  useEffect(() => {
    if (origin && destination) {
      void runComparison();
    }
  }, [origin, destination]);

  async function runComparison() {
    if (!origin || !destination) return;
    setLoading(true);
    setError(null);
    try {
      const comparison = await planAndCompareRoutes(origin, destination);
      setResult(comparison);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No routes found. Try a different destination.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelect(option: LogicalRouteOption) {
    if (!origin || !destination) return;
    try {
      const saved = user ? await saveRouteSearch(user.id, origin, destination, option) : null;
      navigate(saved ? `/routes/${saved.id}` : '/routes/preview', { state: { origin, destination, option } });
    } catch {
      navigate('/routes/preview', { state: { origin, destination, option } });
    }
  }

  return (
    <div className="container" style={{ paddingTop: 28, paddingBottom: 80 }}>
      <h1 style={{ fontSize: 'clamp(26px, 4vw, 34px)', marginBottom: 6 }}>Compare routes</h1>
      <p style={{ color: 'var(--color-text-muted)', marginTop: 0, marginBottom: 24, fontSize: 14 }}>
        Three ways to get there: the efficient pick, the cheapest, and the fastest if you're in a hurry.
      </p>

      <div className="card" style={{ marginBottom: 24, background: '#FFFFFF', borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label className="label">From</label>
          <PlaceSearchInput value={origin?.label} placeholder={usingCurrentLocation ? 'Detecting current location…' : 'Origin'} onSelect={setOrigin} />
        </div>
        <div>
          <label className="label">To</label>
          <PlaceSearchInput value={destination?.label} placeholder="Destination" onSelect={setDestination} />
        </div>
      </div>

      {loading && <p style={{ color: 'var(--color-text-muted)' }}>Finding your best options…</p>}
      {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}

      {result && result.options.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {CATEGORY_ORDER.map((cat) => {
            const opt = result.options.find((o) => o.category === cat);
            if (!opt) return null;
            return <RouteOptionCard key={opt.id} option={opt} onSelect={() => handleSelect(opt)} />;
          })}
        </div>
      )}

      {result && result.options.length === 0 && !loading && (
        <p style={{ color: 'var(--color-text-muted)' }}>No route options found between these points yet.</p>
      )}
    </div>
  );
}