import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import PlaceSearchInput from '@/components/PlaceSearchInput';
import { listRecentDestinations, listSavedPlaces, addRecentDestination } from '@/services/savedPlacesService';
import { getActiveDisruptions } from '@/services/transportService';
import { INDONESIA_ROAD_DISRUPTIONS } from '@/data/indonesiaRoadDisruption';
import type { SavedPlace, RecentDestination, Disruption } from '@/types/database.types';
import type { PlaceResult } from '@/types/domain.types';

export default function Dashboard() {
  const { user } = useAuth();
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [recentDestinations, setRecentDestinations] = useState<RecentDestination[]>([]);
  const [disruptions, setDisruptions] = useState<Disruption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    (async () => {
      try {
        const [places, recents, activeDisruptions] = await Promise.all([
          listSavedPlaces(user.id),
          listRecentDestinations(user.id, 4),
          getActiveDisruptions(),
        ]);
        if (!mounted) return;
        setSavedPlaces(places);
        setRecentDestinations(recents);
        const resolvedAlerts: Disruption[] = activeDisruptions.length > 0
          ? activeDisruptions.slice(0, 3)
          : INDONESIA_ROAD_DISRUPTIONS.filter((d) => d.isActive).slice(0, 3).map((d) => ({
              id: d.id,
              title: d.title,
              description: d.description,
              disruption_type: 'traffic' as const,
              severity: d.severity === 'critical' ? 'critical' : d.severity === 'high' ? 'high' : 'moderate',
              affected_route_ids: [],
              affected_route_labels: d.affectedRoads,
              affected_locations: d.affectedRoads,
              status: 'active' as const,
              is_fallback: false,
              source: 'indonesia-traffic-curated',
              starts_at: d.reportedAt,
              last_updated: d.reportedAt,
              resolved_at: null,
              created_at: d.reportedAt,
            }));
        setDisruptions(resolvedAlerts);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to load dashboard data.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user]);

  async function handleDestinationSelect(place: PlaceResult) {
    if (user) {
      await addRecentDestination(user.id, place.label, place.lat, place.lng, place.address).catch(() => {});
    }
    navigate('/routes', { state: { destination: place } });
  }

  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';

  return (
    <div className="container" style={{ paddingTop: 28, paddingBottom: 80 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 'clamp(28px, 4.5vw, 36px)', color: 'var(--color-text)', marginBottom: 6 }}>
          {lang === 'ID' ? `Mau ke mana hari ini, ${userName}?` : `Where are we headed today, ${userName}?`}
        </h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: 0, fontSize: 14 }}>
          {lang === 'ID'
            ? 'Cari lokasi tujuan atau pilih dari rute favoritmu.'
            : 'Search a destination, or pick up where you left off.'}
        </p>
      </div>

      <div className="card" style={{ marginBottom: 24, background: '#FFFFFF', border: '1.5px solid var(--color-border)', borderRadius: 16, padding: '20px' }}>
        <label className="label" style={{ color: 'var(--color-text-muted)', marginBottom: 8 }}>{t('search.destination')}</label>
        <PlaceSearchInput placeholder={t('search.placeholder')} onSelect={handleDestinationSelect} />
      </div>

      <div style={quickGrid}>
        <QuickAction label={t('nav.routes')} icon="⇄" onClick={() => navigate('/routes')} />
        <QuickAction label={t('nav.budget')} icon="฿" onClick={() => navigate('/budget')} />
        <QuickAction label={t('nav.map')} icon="⌖" onClick={() => navigate('/map')} />
        <QuickAction label={t('nav.ask_ai')} icon="?" onClick={() => navigate('/confused')} />
      </div>

      {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}

      {disruptions.length > 0 && (
        <Section title="Peringatan Lalu Lintas & Gangguan" action={{ label: 'Lihat semua', onClick: () => navigate('/disruptions') }}>
          {disruptions.map((d) => (
            <div
              key={d.id}
              className="card hover-lift-card"
              style={{
                marginBottom: 10,
                background: '#FFFFFF',
                borderLeft: `4px solid ${severityColor(d.severity)}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <strong style={{ fontSize: 14, color: 'var(--color-text)' }}>{d.title}</strong>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: severityColor(d.severity) + '1A',
                    color: severityColor(d.severity),
                    border: `1px solid ${severityColor(d.severity)}35`,
                  }}
                >
                  {d.severity === 'critical' ? 'Kritis' : d.severity === 'high' ? 'Tinggi' : d.severity === 'moderate' ? 'Sedang' : 'Info'}
                </span>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>{d.description}</p>
            </div>
          ))}
        </Section>
      )}

      <Section title="Pencarian Terakhir">
        {loading && <p style={{ color: 'var(--color-text-muted)' }}>Memuat data…</p>}
        {!loading && recentDestinations.length === 0 && (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Belum ada pencarian — coba cari tujuan di atas.</p>
        )}
        <div style={chipRow}>
          {recentDestinations.map((r) => (
            <button
              key={r.id}
              className="btn btn-outline"
              style={{ borderRadius: 999, padding: '8px 16px', fontSize: 13, background: '#FFFFFF' }}
              onClick={() =>
                handleDestinationSelect({ lat: r.latitude, lng: r.longitude, label: r.label, address: r.address ?? r.label })
              }
            >
              {r.label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Tempat Tersimpan" action={{ label: 'Kelola', onClick: () => navigate('/places') }}>
        {!loading && savedPlaces.length === 0 && (
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
            Belum ada tempat tersimpan. Tambahkan Rumah atau Kampus/Kantor untuk navigasi instan.
          </p>
        )}
        <div style={chipRow}>
          {savedPlaces.map((p) => (
            <button
              key={p.id}
              className="btn btn-outline"
              style={{ borderRadius: 999, padding: '8px 16px', fontSize: 13, background: '#FFFFFF' }}
              onClick={() =>
                handleDestinationSelect({ lat: p.latitude, lng: p.longitude, label: p.name, address: p.address ?? p.name })
              }
            >
              {categoryIcon(p.category)} {p.name}
            </button>
          ))}
        </div>
      </Section>
    </div>
  );
}

function QuickAction({ label, icon, onClick }: { label: string; icon: string; onClick: () => void }) {
  return (
    <button className="card hover-lift-card" style={quickCard} onClick={onClick}>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: 'rgba(218, 54, 42, 0.09)',
          color: 'var(--color-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
          margin: '0 auto 10px',
        }}
      >
        {icon}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{label}</div>
    </button>
  );
}

function Section({ title, action, children }: { title: string; action?: { label: string; onClick: () => void }; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 17, color: 'var(--color-text)' }}>{title}</h3>
        {action && (
          <button
            onClick={action.onClick}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {action.label} →
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function categoryIcon(category: string) {
  switch (category) {
    case 'home': return '🏠';
    case 'school': return '🎓';
    case 'workplace': return '💼';
    default: return '📍';
  }
}

function severityColor(severity: string) {
  switch (severity) {
    case 'critical': return 'var(--color-danger)';
    case 'high': return 'var(--color-danger)';
    case 'moderate': return 'var(--color-amber)';
    default: return 'var(--color-border)';
  }
}

const quickGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
  gap: 14,
  marginBottom: 28,
};

const quickCard: React.CSSProperties = {
  textAlign: 'center',
  border: '1.5px solid var(--color-border)',
  background: '#FFFFFF',
  padding: '18px 12px',
  borderRadius: 'var(--radius-md)',
  boxShadow: 'var(--shadow-card)',
};

const chipRow: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
};
