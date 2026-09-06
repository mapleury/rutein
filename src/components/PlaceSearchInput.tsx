import React, { useEffect, useRef, useState } from 'react';
import { debounce, searchPlaces } from '@/services/geocodingService';
import type { PlaceResult } from '@/types/domain.types';

interface Props {
  placeholder?: string;
  value?: string;
  variant?: 'light' | 'dark';
  onSelect: (place: PlaceResult) => void;
}

export default function PlaceSearchInput({ placeholder = 'Search a place…', value, variant = 'light', onSelect }: Props) {
  const [query, setQuery] = useState(value ?? '');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const isUserTyping = useRef(false);

  const debouncedSearch = useRef(
    debounce(async (q: string) => {
      if (!isUserTyping.current) return;
      setLoading(true);
      setError(null);
      try {
        const res = await searchPlaces(q);
        if (isUserTyping.current) {
          setResults(res);
          setOpen(res.length > 0);
        }
      } catch (err) {
        setError('Pencarian gagal. Periksa koneksi internet Anda.');
      } finally {
        setLoading(false);
      }
    }, 400)
  ).current;

  // Sync with value prop from outside WITHOUT triggering automatic search or opening dropdown
  useEffect(() => {
    isUserTyping.current = false;
    setQuery(value ?? '');
    setOpen(false);
    setResults([]);
  }, [value]);

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        isUserTyping.current = false;
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    isUserTyping.current = true;
    setQuery(val);
    if (val.trim().length >= 2) {
      debouncedSearch(val);
    } else {
      setResults([]);
      setOpen(false);
    }
  };

  const handleSelect = (r: PlaceResult) => {
    isUserTyping.current = false;
    setQuery(r.label);
    setOpen(false);
    setResults([]);
    onSelect(r);
  };

  const handleClear = () => {
    isUserTyping.current = false;
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  const isLight = variant === 'light';

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', zIndex: open ? 9999 : 2 }}>
      <div style={{ position: 'relative', width: '100%' }}>
        <input
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (isUserTyping.current && results.length > 0) {
              setOpen(true);
            }
          }}
          style={{
            width: '100%',
            padding: '12px 42px 12px 16px',
            background: isLight ? '#FDF0ED' : 'var(--color-surface-raised)',
            border: isLight ? '1.5px solid #E5D5C5' : '1px solid var(--color-border)',
            borderRadius: 14,
            fontSize: 14,
            fontWeight: 600,
            color: isLight ? '#1E1E1E' : 'var(--color-text)',
            outline: 'none',
            fontFamily: 'var(--font-inter)',
            transition: 'all 0.15s ease',
            boxShadow: isLight ? 'inset 0 1px 2px rgba(0,0,0,0.02)' : 'none',
            boxSizing: 'border-box',
          }}
        />

        {loading ? (
          <span
            style={{
              position: 'absolute',
              right: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 13,
              color: isLight ? '#888888' : 'var(--color-text-muted)',
              pointerEvents: 'none',
            }}
          >
            …
          </span>
        ) : query ? (
          <button
            type="button"
            onClick={handleClear}
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              color: '#888888',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 700,
              padding: '4px 6px',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Hapus teks"
          >
            ✕
          </button>
        ) : null}
      </div>

      {open && (results.length > 0 || error) && (
        <div
          className="rutein-scale-in"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 6,
            background: isLight ? '#FFFFFF' : 'var(--color-surface-raised)',
            border: isLight ? '1.5px solid #E5D5C5' : '1px solid var(--color-border)',
            borderRadius: 14,
            boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
            zIndex: 100,
            maxHeight: 240,
            overflowY: 'auto',
          }}
        >
          {error && <div style={{ padding: 12, color: '#DA362A', fontSize: 13 }}>{error}</div>}
          {results.map((r) => (
            <button
              key={r.placeId ?? `${r.lat},${r.lng}`}
              type="button"
              onClick={() => handleSelect(r)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '12px 16px',
                background: 'transparent',
                border: 'none',
                borderBottom: isLight ? '1px solid #F0E2D5' : '1px solid var(--color-border)',
                color: isLight ? '#1E1E1E' : 'var(--color-text)',
                cursor: 'pointer',
                transition: 'background 0.12s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#FDF0ED';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 14, color: isLight ? '#1E1E1E' : 'var(--color-text)' }}>{r.label}</div>
              <div style={{ fontSize: 12, color: isLight ? '#666666' : 'var(--color-text-muted)', marginTop: 2 }}>{r.address}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}