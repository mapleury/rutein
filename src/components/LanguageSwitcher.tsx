import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface LanguageSwitcherProps {
  style?: React.CSSProperties;
  buttonStyle?: React.CSSProperties;
  variant?: 'red' | 'white';
  size?: 'normal' | 'sm';
}

export default function LanguageSwitcher({
  style,
  buttonStyle,
  variant = 'red',
  size = 'normal',
}: LanguageSwitcherProps) {
  const { lang, setLang } = useLanguage();
  const isWhite = variant === 'white';
  const isSm = size === 'sm';

  const containerHeight = isSm ? 25 : 32;
  const buttonHeight = isSm ? 21 : 27;
  const padding = isSm ? 2 : 2.5;
  const btnPadding = isSm ? '0 7px' : '0 10px';
  const fontSize = isSm ? 10.5 : 12;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: isWhite ? '#FFFFFF' : '#DA362A',
        borderRadius: 999,
        padding,
        height: containerHeight,
        boxSizing: 'border-box',
        boxShadow: isWhite
          ? '0 2px 8px rgba(0, 0, 0, 0.12)'
          : '0 2px 8px rgba(218, 54, 42, 0.25)',
        flexShrink: 0,
        ...style,
      }}
    >
      <button
        type="button"
        style={{
          border: 'none',
          height: buttonHeight,
          padding: btnPadding,
          borderRadius: 999,
          fontSize,
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
          background:
            lang === 'ID' ? (isWhite ? '#DA362A' : '#FFFFFF') : 'transparent',
          color:
            lang === 'ID' ? (isWhite ? '#FFFFFF' : '#DA362A') : isWhite ? '#DA362A' : '#FFFFFF',
          boxShadow:
            lang === 'ID'
              ? isWhite
                ? '0 2px 5px rgba(218, 54, 42, 0.3)'
                : '0 1.5px 5px rgba(0, 0, 0, 0.15)'
              : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1,
          ...buttonStyle,
        }}
        onClick={() => setLang('ID')}
        title="Bahasa Indonesia"
      >
        ID
      </button>
      <button
        type="button"
        style={{
          border: 'none',
          height: buttonHeight,
          padding: btnPadding,
          borderRadius: 999,
          fontSize,
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
          background:
            lang === 'EN' ? (isWhite ? '#DA362A' : '#FFFFFF') : 'transparent',
          color:
            lang === 'EN' ? (isWhite ? '#FFFFFF' : '#DA362A') : isWhite ? '#DA362A' : '#FFFFFF',
          boxShadow:
            lang === 'EN'
              ? isWhite
                ? '0 2px 5px rgba(218, 54, 42, 0.3)'
                : '0 1.5px 5px rgba(0, 0, 0, 0.15)'
              : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1,
          ...buttonStyle,
        }}
        onClick={() => setLang('EN')}
        title="English"
      >
        EN
      </button>
    </div>
  );
}
