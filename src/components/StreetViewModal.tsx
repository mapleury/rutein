import React, { useEffect, useRef, useState } from 'react';
import { Viewer } from 'mapillary-js';
import 'mapillary-js/dist/mapillary.css';
import { findNearestImage, type MapillaryLookupResult } from '@/services/mapillaryService';
import type { GeoPoint } from '@/types/domain.types';

interface Props {
  point: GeoPoint;
  locationLabel?: string;
  onClose: () => void;
}

type ModalState = 'loading' | 'ready' | 'not_found' | 'missing_token' | 'error';

export default function StreetViewModal({ point, locationLabel, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const [state, setState] = useState<ModalState>('loading');
  const [useGoogleFallback, setUseGoogleFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const token = import.meta.env.VITE_MAPILLARY_TOKEN as string;
    if (!token || token === 'ISI_TOKEN_MAPILLARY') {
      setUseGoogleFallback(true);
      setState('ready');
      return;
    }

    findNearestImage(point).then((result: MapillaryLookupResult) => {
      if (cancelled) return;

      if (result.status === 'missing_token' || result.status === 'error') {
        setUseGoogleFallback(true);
        setState('ready');
        return;
      }
      if (result.status === 'not_found') {
        setUseGoogleFallback(true);
        setState('ready');
        return;
      }

      if (!containerRef.current) return;

      try {
        const viewer = new Viewer({
          accessToken: token,
          container: containerRef.current,
          imageId: result.imageId,
        });
        viewerRef.current = viewer;
        setState('ready');
      } catch {
        setUseGoogleFallback(true);
        setState('ready');
      }
    });

    return () => {
      cancelled = true;
      viewerRef.current?.remove();
      viewerRef.current = null;
    };
  }, [point.lat, point.lng]);

  return (
    <div style={overlay}>
      <div style={modal}>
        <div style={header}>
          <div>
            <strong style={{ fontSize: 14 }}>{locationLabel ?? 'Street View 360°'}</strong>
            <div style={{ fontSize: 11, color: '#666' }}>Tampilan panorama 360° tingkat jalan untuk lokasi perjalanan</div>
          </div>
          <button onClick={onClose} style={closeBtn}>✕ Close</button>
        </div>

        <div style={viewerArea}>
          {state === 'loading' && (
            <div style={centeredMessage}>Searching for nearby 360° street imagery…</div>
          )}

          {useGoogleFallback ? (
            <iframe
              src={`https://maps.google.com/maps?q=${point.lat},${point.lng}&layer=c&cbll=${point.lat},${point.lng}&cbp=12,0,0,0,0&output=svembed`}
              width="100%"
              height="100%"
              style={{ border: 0, width: '100%', height: '100%' }}
              allowFullScreen
              title="Street View 360"
            />
          ) : (
            <div ref={containerRef} style={{ ...viewerCanvas, display: state === 'ready' ? 'block' : 'none' }} />
          )}
        </div>
      </div>
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.75)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 200,
  padding: 16,
};

const modal: React.CSSProperties = {
  width: '100%',
  maxWidth: 900,
  height: '80vh',
  maxHeight: 640,
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 16,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
};

const header: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 16px',
  borderBottom: '1px solid var(--color-border)',
  flexShrink: 0,
};

const closeBtn: React.CSSProperties = {
  background: 'var(--color-surface-raised)',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  padding: '6px 12px',
  fontSize: 12,
  color: 'var(--color-text)',
};

const viewerArea: React.CSSProperties = {
  flex: 1,
  position: 'relative',
  background: '#000',
};

const viewerCanvas: React.CSSProperties = {
  width: '100%',
  height: '100%',
};

const centeredMessage: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  color: 'var(--color-text)',
  padding: 24,
};