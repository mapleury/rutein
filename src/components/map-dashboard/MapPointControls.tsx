import React from 'react';
import { Plus, Minus, Layers, Navigation, Bookmark, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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

export default function MapPointControls({
  onZoomIn,
  onZoomOut,
  onToggleMapStyle,
  onReCenterUserLocation,
  onSaveRoute,
  baseLayer,
}: MapPointControlsProps) {
  const navigate = useNavigate();

  return (
    <div style={controlsWrapperStyle}>
      {/* SECTION 1: Confused Mode (Floating White Card Button with Red Rutein Bird Icon) */}
      <button
        onClick={() => navigate('/confused')}
        style={confusedBtnStyle}
        title="Tanya AI Rutein (Confused Mode)"
      >
        <img
          src={merpatiSvg}
          alt="Confused Mode"
          style={{ height: 22, width: 'auto', objectFit: 'contain' }}
        />
      </button>

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
        <button
          onClick={onToggleMapStyle}
          style={actionBtnStyle}
          title={`Switch to ${baseLayer === 'street' ? 'Satellite' : 'Streets'}`}
        >
          <Layers size={18} color="#DA362A" />
        </button>

        {/* My Location GPS */}
        <button
          onClick={onReCenterUserLocation}
          style={actionBtnStyle}
          title="Posisiku (GPS)"
        >
          <Navigation size={18} color="#DA362A" />
        </button>

        {/* Save Route / Saved Places */}
        <button
          onClick={onSaveRoute}
          style={actionBtnStyle}
          title="Simpan Rute Perjalanan (Saved Places)"
        >
          <Bookmark size={18} color="#DA362A" />
        </button>

        {/* Peringatan Hambatan Jalan (Disruptions) */}
        <button
          onClick={() => navigate('/disruptions')}
          style={actionBtnStyle}
          title="Peringatan Hambatan Jalan (Disruptions)"
        >
          <AlertTriangle size={18} color="#DA362A" />
        </button>
      </div>
    </div>
  );
}

// STYLES — Bottom-Right Aligned with 3 Separated Sections
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
