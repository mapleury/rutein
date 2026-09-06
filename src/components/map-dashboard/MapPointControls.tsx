import React, { useState } from 'react';
import { Plus, Minus, Layers, Navigation, Bookmark, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import merpatiSvg from '@/assets/images/merpati-terbang.svg';

interface MapPointControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onToggleMapStyle: () => void;
  onReCenterUserLocation: () => void;
  onSaveRoute?: () => void;
  onToggleRoute?: () => void;
  baseLayer: 'street' | 'satellite';
}

interface ControlButtonWithTooltipProps {
  onClick?: () => void;
  tooltipText: string;
  children: React.ReactNode;
  btnStyle: React.CSSProperties;
}

function ControlButtonWithTooltip({
  onClick,
  tooltipText,
  children,
  btnStyle,
}: ControlButtonWithTooltipProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <div
        className="control-tooltip"
        style={{
          position: 'absolute',
          right: 'calc(100% + 10px)',
          top: '50%',
          transform: `translateY(-50%) translateX(${isHovered ? '0px' : '6px'})`,
          opacity: isHovered ? 1 : 0,
          visibility: isHovered ? 'visible' : 'hidden',
          transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
          background: '#1E1E1E',
          color: '#FFFFFF',
          padding: '6px 12px',
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 600,
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.18)',
          pointerEvents: 'none',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {tooltipText}
        <div
          style={{
            position: 'absolute',
            left: '100%',
            top: '50%',
            transform: 'translateY(-50%)',
            borderWidth: '5px 0 5px 5px',
            borderStyle: 'solid',
            borderColor: 'transparent transparent transparent #1E1E1E',
          }}
        />
      </div>

      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={btnStyle}
      >
        {children}
      </button>
    </div>
  );
}

export default function MapPointControls({
  onZoomIn,
  onZoomOut,
  onToggleMapStyle,
  onReCenterUserLocation,
  onSaveRoute,
}: MapPointControlsProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="map-point-controls-wrapper" style={controlsWrapperStyle}>
      <style>{pointControlsStyles}</style>
      {/* SECTION 1: Confused Mode (Floating White Card Button with Red Rutein Bird Icon) */}
      <ControlButtonWithTooltip
        onClick={() => navigate('/confused')}
        tooltipText={t('controls.confused_mode')}
        btnStyle={confusedBtnStyle}
      >
        <img
          src={merpatiSvg}
          alt="Confused Mode"
          style={{ height: 22, width: 'auto', objectFit: 'contain' }}
        />
      </ControlButtonWithTooltip>

      {/* SECTION 2: Zoom Controls Card (White Container) */}
      <div style={zoomCardStyle}>
        <button onClick={onZoomIn} style={zoomBtnStyle} title="Zoom In">
          <Plus size={18} color="#1E1E1E" strokeWidth={2.5} />
        </button>
        <div style={zoomDividerStyle} />
        <button onClick={onZoomOut} style={zoomBtnStyle} title="Zoom Out">
          <Minus size={18} color="#1E1E1E" strokeWidth={2.5} />
        </button>
      </div>

      {/* SECTION 3: Main Action Buttons (Solid Red Container with White Circular Buttons) */}
      <div style={redActionCardStyle}>
        {/* Map Style Switcher */}
        <ControlButtonWithTooltip
          onClick={onToggleMapStyle}
          tooltipText={t('controls.map_style')}
          btnStyle={actionBtnStyle}
        >
          <Layers size={18} color="#DA362A" />
        </ControlButtonWithTooltip>

        {/* My Location GPS */}
        <ControlButtonWithTooltip
          onClick={onReCenterUserLocation}
          tooltipText={t('controls.my_location')}
          btnStyle={actionBtnStyle}
        >
          <Navigation size={18} color="#DA362A" />
        </ControlButtonWithTooltip>

        {/* Save Route / Saved Places */}
        <ControlButtonWithTooltip
          onClick={onSaveRoute}
          tooltipText={t('controls.saved_places')}
          btnStyle={actionBtnStyle}
        >
          <Bookmark size={18} color="#DA362A" />
        </ControlButtonWithTooltip>

        {/* Peringatan Hambatan Jalan (Disruptions) */}
        <ControlButtonWithTooltip
          onClick={() => navigate('/disruptions')}
          tooltipText={t('controls.disruptions')}
          btnStyle={actionBtnStyle}
        >
          <AlertTriangle size={18} color="#DA362A" />
        </ControlButtonWithTooltip>
      </div>
    </div>
  );
}

// STYLES — Bottom-Right Aligned with 3 Separated Sections
const pointControlsStyles = `
  @media (hover: none) and (pointer: coarse) {
    .control-tooltip {
      display: none !important;
    }
  }
  @media (max-width: 767px) {
    .map-point-controls-wrapper {
      right: 12px !important;
      bottom: 20px !important;
      gap: 8px !important;
    }
  }
`;

const controlsWrapperStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: 24,
  right: 16,
  zIndex: 'var(--z-map-controls)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 10,
};

const confusedBtnStyle: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 14,
  border: 'none',
  background: '#FFFFFF',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
  transition: 'transform 0.15s ease',
};

const zoomCardStyle: React.CSSProperties = {
  background: '#FFFFFF',
  borderRadius: 14,
  padding: '4px 2px',
  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};

const zoomBtnStyle: React.CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 10,
  border: 'none',
  background: 'transparent',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'background-color 0.15s ease',
};

const zoomDividerStyle: React.CSSProperties = {
  width: 22,
  height: 1,
  background: '#E5E5E5',
  margin: '1px 0',
};

const redActionCardStyle: React.CSSProperties = {
  background: '#DA362A',
  borderRadius: 22,
  padding: '6px 5px',
  boxShadow: '0 8px 24px rgba(218, 54, 42, 0.4)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 6,
};

const actionBtnStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: '50%',
  border: 'none',
  background: '#FFFFFF',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
  transition: 'transform 0.15s ease',
};
