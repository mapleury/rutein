import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface PageLoadingProps {
  message?: string;
  minHeight?: string | number;
}

export default function PageLoading({
  message,
  minHeight = 'calc(100vh - 80px)',
}: PageLoadingProps) {
  const { t } = useLanguage();
  const label = message || t('common.loading') || 'Memuat';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight,
        padding: 40,
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--color-text-muted, #7A6F62)',
          fontFamily: "'Aileron', 'Inter', system-ui, sans-serif",
        }}
      >
        <span>{label}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', marginLeft: 2 }}>
          <span className="loading-dot" />
          <span className="loading-dot" />
          <span className="loading-dot" />
        </span>
      </div>
    </div>
  );
}
