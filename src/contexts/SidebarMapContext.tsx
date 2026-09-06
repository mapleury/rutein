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

const noop = () => { };

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

export function useMobileSidebar() {
  const { isMobileSidebarOpen, openMobileSidebar, closeMobileSidebar, toggleMobileSidebar } = useContext(SidebarMapContext);
  return { isMobileSidebarOpen, openMobileSidebar, closeMobileSidebar, toggleMobileSidebar };
}

export function useSidebarMapControls() {
  return useContext(SidebarMapContext).controls;
}

export function usePublishSidebarMapControls(controls: SidebarMapControls) {
  const { setControls, resetControls } = useContext(SidebarMapContext);
  const controlsRef = useRef(controls);
  controlsRef.current = controls;

  const activeTypesKey = Array.from(controls.activeTypes).sort().join(',');

  useEffect(() => {
    setControls(controlsRef.current);
  }, [activeTypesKey, controls.savedPlacesTrigger, setControls]);

  useEffect(() => {
    return () => resetControls();
  }, []);
}