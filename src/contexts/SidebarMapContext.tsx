// contexts/SidebarMapContext.tsx
// Bridges the map page's local state (which transport types are active,
// which operator was picked, etc.) to the Sidebar, which now lives in
// AppLayout instead of inside the map page.
//
// - Wrap your app in <SidebarMapProvider> once, above <AppLayout>.
// - AppLayout reads the current controls with useSidebarMapControls()
//   and forwards them to <Sidebar />.
// - Your Dashboard/Map page calls usePublishSidebarMapControls({...})
//   with its real state+handlers. Every other page simply never calls it,
//   so Sidebar falls back to harmless no-op defaults — which is fine,
//   since Sidebar only shows the operator/filter section on map routes
//   anyway.

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { IndonesiaTransportType } from '@/data/indonesiaTransportData';

export interface SidebarMapControls {
  activeTypes: Set<IndonesiaTransportType>;
  onToggleType: (type: IndonesiaTransportType) => void;
  onShowAllTypes: () => void;
  onSelectSavedPlace: (lat: number, lng: number, name?: string, address?: string) => void;
  onSelectOperator: (type: IndonesiaTransportType) => void;
  savedPlacesTrigger: number;
}

const noop = () => {};

const DEFAULT_CONTROLS: SidebarMapControls = {
  activeTypes: new Set<IndonesiaTransportType>(),
  onToggleType: noop,
  onShowAllTypes: noop,
  onSelectSavedPlace: noop,
  onSelectOperator: noop,
  savedPlacesTrigger: 0,
};

interface ContextValue {
  controls: SidebarMapControls;
  setControls: (partial: Partial<SidebarMapControls>) => void;
  resetControls: () => void;
  isMobileSidebarOpen: boolean;
  openMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  toggleMobileSidebar: () => void;
}

const SidebarMapContext = createContext<ContextValue>({
  controls: DEFAULT_CONTROLS,
  setControls: noop,
  resetControls: noop,
  isMobileSidebarOpen: false,
  openMobileSidebar: noop,
  closeMobileSidebar: noop,
  toggleMobileSidebar: noop,
});

export function SidebarMapProvider({ children }: { children: React.ReactNode }) {
  const [controls, setControlsState] = useState<SidebarMapControls>(DEFAULT_CONTROLS);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const setControls = useCallback((partial: Partial<SidebarMapControls>) => {
    setControlsState((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetControls = useCallback(() => {
    setControlsState(DEFAULT_CONTROLS);
  }, []);

  const openMobileSidebar = useCallback(() => setIsMobileSidebarOpen(true), []);
  const closeMobileSidebar = useCallback(() => setIsMobileSidebarOpen(false), []);
  const toggleMobileSidebar = useCallback(() => setIsMobileSidebarOpen((prev) => !prev), []);

  return (
    <SidebarMapContext.Provider
      value={{
        controls,
        setControls,
        resetControls,
        isMobileSidebarOpen,
        openMobileSidebar,
        closeMobileSidebar,
        toggleMobileSidebar,
      }}
    >
      {children}
    </SidebarMapContext.Provider>
  );
}

/** Hook to control mobile sidebar drawer from anywhere */
export function useMobileSidebar() {
  const { isMobileSidebarOpen, openMobileSidebar, closeMobileSidebar, toggleMobileSidebar } = useContext(SidebarMapContext);
  return { isMobileSidebarOpen, openMobileSidebar, closeMobileSidebar, toggleMobileSidebar };
}

/** Used by AppLayout to read whatever the current page has published. */
export function useSidebarMapControls() {
  return useContext(SidebarMapContext).controls;
}

/**
 * Used by the Dashboard/Map page to publish its live map state into the
 * sidebar. Call this once near the top of that page's component, passing
 * the same values you used to pass directly as <MapSidebar /> props.
 *
 * It also resets the controls back to the harmless defaults when the map
 * page unmounts, so navigating away doesn't leave stale filters visible
 * (moot anyway, since Sidebar hides that section off the map routes).
 */
export function usePublishSidebarMapControls(controls: SidebarMapControls) {
  const { setControls, resetControls } = useContext(SidebarMapContext);
  const controlsRef = useRef(controls);
  controlsRef.current = controls;

  useEffect(() => {
    setControls(controlsRef.current);
  });

  useEffect(() => {
    return () => resetControls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}