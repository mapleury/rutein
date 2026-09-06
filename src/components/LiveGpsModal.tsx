import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { watchPosition, distanceMeters, isGeolocationSupported } from '@/services/locationService';

import type { GeoPoint } from '@/types/domain.types';
import type { GeoServiceError } from '@/services/locationService';

interface Waypoint extends GeoPoint {
  label: string;
}

interface Props {
  waypoints: Waypoint[];
  onClose: () => void;
}

const WAYPOINT_ARRIVAL_RADIUS_M = 60;

const userIcon = new L.DivIcon({
  className: '',
  html: '<div style="width:16px;height:16px;border-radius:50%;background:#DA362A;border:3px solid #fff;box-shadow:0 0 0 4px rgba(218,54,42,0.3);"></div>',
  iconSize: [16, 16],
});

const waypointIcon = new L.DivIcon({
  className: '',
  html: '<div style="width:12px;height:12px;border-radius:50%;background:#0D9488;border:2px solid #FFFFFF;box-shadow:0 1px 4px rgba(0,0,0,0.25);"></div>',
  iconSize: [12, 12],
});

function FollowUser({ point }: { point: GeoPoint | null }) {
  const map = useMap();
  useEffect(() => {
    if (point) map.setView([point.lat, point.lng], map.getZoom() < 14 ? 16 : map.getZoom());
  }, [point, map]);
  return null;
}

export default function LiveGpsModal({ waypoints, onClose }: Props) {
  const [status, setStatus] = useState<'requesting' | 'tracking' | 'error'>('requesting');
  const [error, setError] = useState<GeoServiceError | null>(null);
  const [currentPosition, setCurrentPosition] = useState<GeoPoint | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [waypointIndex, setWaypointIndex] = useState(0);
  const stopWatchRef = useRef<(() => void) | null>(null);
  const tileConfig = getTileLayerConfig();

  const startTracking = () => {
    if (!isGeolocationSupported()) {
      setStatus('error');
      setError({ type: 'unsupported', message: 'Geolocation tidak didukung oleh browser ini.' });
      return;
    }

    setStatus('requesting');
    setError(null);
    stopWatchRef.current?.();

    stopWatchRef.current = watchPosition(
      (point, acc) => {
        setStatus('tracking');
        setError(null);
        setCurrentPosition(point);
        setAccuracy(acc);
      },
      (err) => {
        setStatus('error');
        setError(err);
      }
    );
  };

  useEffect(() => {
    startTracking();
    return () => {
      stopWatchRef.current?.();
    };
  }, []);

  useEffect(() => {
    if (!currentPosition || waypointIndex >= waypoints.length) return;
    const target = waypoints[waypointIndex];
    const dist = distanceMeters(currentPosition, target);
    if (dist <= WAYPOINT_ARRIVAL_RADIUS_M) {
      setWaypointIndex((i) => Math.min(i + 1, waypoints.length));
    }
  }, [currentPosition, waypointIndex, waypoints]);

  const nextWaypoint = waypoints[waypointIndex];
  const distanceToNext = currentPosition && nextWaypoint ? distanceMeters(currentPosition, nextWaypoint) : null;

  function handleClose() {
    stopWatchRef.current?.();
    onClose();
  }

  return (
    <div style={overlay}>
      <div style={modal} className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 18 }}>Live Journey Tracking</h3>
          <button onClick={handleClose} style={closeBtn}>✕</button>
        </div>

        {status === 'requesting' && (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Meminta izin lokasi GPS…
          </div>
        )}

        {status === 'error' && error && (
          <div style={{ padding: '16px 0' }}>
            <p style={{ color: 'var(--color-danger)', fontWeight: 700, marginBottom: 8, fontSize: 16 }}>{errorTitle(error.type)}</p>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 13, lineHeight: 1.5, marginBottom: 16 }}>
              {error.message}
            </p>
            {error.type === 'permission_denied' && (
              <div style={{ background: 'rgba(218, 54, 42, 0.1)', border: '1px solid rgba(218, 54, 42, 0.3)', borderRadius: 10, padding: 14, fontSize: 13, marginBottom: 16, color: 'var(--color-text)' }}>
                <strong>Cara Mengaktifkan Izin Lokasi di Browser:</strong>
                <ol style={{ margin: '8px 0 0 0', paddingLeft: 18, lineHeight: 1.6 }}>
                  <li>Klik ikon gembok/setelan 🔒 di sebelah kiri URL browser (address bar atas).</li>
                  <li>Ubah menu <strong>Lokasi (Location)</strong> dari <em>Blokir</em> menjadi <strong>Izinkan (Allow)</strong>.</li>
                  <li>Klik tombol <strong>Coba Lagi</strong> di bawah ini atau refresh halaman.</li>
                </ol>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={startTracking}
                style={{
                  background: 'var(--color-primary)',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 16px',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Coba Lagi
              </button>
              <button
                type="button"
                onClick={handleClose}
                style={{
                  background: 'transparent',
                  color: 'var(--color-text-muted)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                  padding: '8px 16px',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        )}

        {status === 'tracking' && currentPosition && (
          <>
            <div style={{ height: 320, borderRadius: 12, overflow: 'hidden', marginBottom: 14 }}>
              <MapContainer center={[currentPosition.lat, currentPosition.lng]} zoom={16} style={{ height: '100%', width: '100%' }}>
                <TileLayer url={tileConfig.url} attribution={tileConfig.attribution} />
                <FollowUser point={currentPosition} />
                <Marker position={[currentPosition.lat, currentPosition.lng]} icon={userIcon} />
                {waypoints.map((wp, i) => (
                  <Marker key={i} position={[wp.lat, wp.lng]} icon={waypointIcon} />
                ))}
                {waypoints.length > 1 && (
                  <Polyline positions={waypoints.map((w) => [w.lat, w.lng])} pathOptions={{ color: '#2DD4BF', weight: 3, dashArray: '6 6' }} />
                )}
              </MapContainer>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span>Akurasi GPS: {accuracy ? `±${Math.round(accuracy)}m` : '—'}</span>
              {nextWaypoint ? (
                <span>Tujuan Berikutnya: {nextWaypoint.label} — {distanceToNext ? `${Math.round(distanceToNext)}m` : '—'}</span>
              ) : (
                <span style={{ color: 'var(--color-success)' }}>Semua titik telah dicapai ✓</span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function errorTitle(type: GeoServiceError['type']): string {
  switch (type) {
    case 'permission_denied': return 'Izin Lokasi Di-blokir Browser';
    case 'position_unavailable': return 'Lokasi Tidak Ditemukan';
    case 'timeout': return 'Waktu Permintaan Lokasi Habis';
    case 'unsupported': return 'Browser Tidak Mendukung GPS';
  }
}

const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 100,
  padding: 16,
};

const modal: React.CSSProperties = {
  width: '100%',
  maxWidth: 520,
  maxHeight: '90vh',
  overflowY: 'auto',
};

const closeBtn: React.CSSProperties = {
  background: 'var(--color-surface-raised)',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  width: 30,
  height: 30,
  color: 'var(--color-text)',
  cursor: 'pointer',
};

export function getTileLayerConfig() {
  return {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
  };
}

export function getMapStyle(): string {
  const style = (import.meta.env.VITE_MAP_STYLE as string) || 'positron';
  return `https://tiles.openfreemap.org/styles/${style}`;
}