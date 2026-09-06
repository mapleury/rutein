import React, { useEffect, useRef, useState, useCallback, useMemo, Suspense, lazy } from 'react';
import { setWorkerUrl, type LngLatBounds } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
setWorkerUrl(workerUrl);

import Map, { Marker, Popup, Source, Layer, type MapRef, type MapLayerMouseEvent } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { AlertTriangle, X, ArrowRight, Navigation, CheckCircle2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { createSavedPlace } from '@/services/savedPlacesService';

import { usePublishSidebarMapControls } from '@/contexts/SidebarMapContext';
import MapTopSearch from '@/components/map-dashboard/MapTopSearch';
import MapPointControls from '@/components/map-dashboard/MapPointControls';
import MapRouteDetailBar from '@/components/map-dashboard/MapRouteDetailBar';
import TransportMarkerIcon, { LegModeMarker, LEG_MODE_COLOR, TRANSPORT_TYPE_COLOR } from '@/components/transportMarkerIcon';
import { getMapStyle, walkingDirections, drivingDirections, type DirectionsResult } from '@/services/mapService';
import { getCurrentPosition, isGeolocationSupported, distanceMeters } from '@/services/locationService';
import {
  INDONESIA_TRANSPORT_DATA,
  TRANSPORT_TYPE_LABELS,
  type IndonesiaTransportType,
  type IndonesiaTransportLocation,
} from '@/data/indonesiaTransportData';
import { INDONESIA_ROAD_DISRUPTIONS, SEVERITY_COLORS } from '@/data/indonesiaRoadDisruption';
import type { GeoPoint, RouteOption, RouteLeg, PlaceResult } from '@/types/domain.types';

const StreetViewModal = lazy(() => import('@/components/StreetViewModal'));

const JAKARTA_CENTER: GeoPoint = { lat: -6.2088, lng: 106.8456 };
type BaseLayer = 'street' | 'satellite';

const SATELLITE_STYLE = {
  version: 8 as const,
  sources: {
    'esri-satellite': {
      type: 'raster' as const,
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
      attribution: 'Esri, Maxar, Earthstar Geographics, and the GIS User Community',
    },
  },
  layers: [{ id: 'esri-satellite-layer', type: 'raster' as const, source: 'esri-satellite' }],
};

const ALL_TRANSPORT_TYPES = Object.keys(TRANSPORT_TYPE_LABELS) as IndonesiaTransportType[];
const MAX_RENDERED_MARKERS = 200;
const STREET_VIEW_CONFIRM_RADIUS_M = 40;

function legCoordinates(leg: RouteLeg): [number, number][] {
  const points = leg.geometry && leg.geometry.length >= 2 ? leg.geometry : [leg.from, leg.to];
  return points.map((p) => [p.lng, p.lat]);
}

export default function MapDashboard() {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const { user } = useAuth();
  const mapRef = useRef<MapRef>(null);

  const [userLocation, setUserLocation] = useState<GeoPoint | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [baseLayer, setBaseLayer] = useState<BaseLayer>('street');
  const [popupTarget, setPopupTarget] = useState<'user' | 'place' | null>(null);

  // Directions state
  const [directions, setDirections] = useState<DirectionsResult | null>(null);
  const [loadingDirections, setLoadingDirections] = useState(false);
  const [travelMode, setTravelMode] = useState<'walk' | 'ojek' | 'transit'>('ojek');
  const [budgetPreference, setBudgetPreference] = useState<'cheapest' | 'fastest' | 'efficient'>('efficient');

  // Saved places trigger & Toast Notification state
  const [savedPlacesTrigger, setSavedPlacesTrigger] = useState(0);
  const [toast, setToast] = useState<{ type: 'warning' | 'success' | 'error'; message: string } | null>(null);
  const [showRouteDisruptionNotif, setShowRouteDisruptionNotif] = useState(true);

  useEffect(() => {
    if (selectedPlace) {
      setShowRouteDisruptionNotif(true);
    }
  }, [selectedPlace]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const itineraryOption = (routerLocation.state as { option?: RouteOption } | null)?.option ?? null;

  // Active transport operator filters
  const [activeTypes, setActiveTypes] = useState<Set<IndonesiaTransportType>>(new Set(ALL_TRANSPORT_TYPES));
  const [selectedOperatorForSchedule, setSelectedOperatorForSchedule] = useState<IndonesiaTransportType | null>(null);
  const [mapBounds, setMapBounds] = useState<LngLatBounds | null>(null);
  const [hoveredStopId, setHoveredStopId] = useState<string | null>(null);
  const [hoveredDisruptionId, setHoveredDisruptionId] = useState<string | null>(null);

  // Street view modal state
  const [pendingStreetViewPoint, setPendingStreetViewPoint] = useState<GeoPoint | null>(null);
  const [streetViewPoint, setStreetViewPoint] = useState<GeoPoint | null>(null);

  const [viewState, setViewState] = useState({
    latitude: JAKARTA_CENTER.lat,
    longitude: JAKARTA_CENTER.lng,
    zoom: 14,
  });

  // GPS Location fetch
  useEffect(() => {
    if (!isGeolocationSupported()) return;
    getCurrentPosition()
      .then((point) => setUserLocation(point))
      .catch(() => {});
  }, []);

  // Fly to user location initially
  useEffect(() => {
    if (itineraryOption || !userLocation || !mapRef.current) return;
    mapRef.current.flyTo({ center: [userLocation.lng, userLocation.lat], zoom: 14, duration: 800 });
  }, [userLocation, itineraryOption]);

  // Directions calculation effect
  useEffect(() => {
    const origin = userLocation || JAKARTA_CENTER;
    if (itineraryOption || !selectedPlace) {
      setDirections(null);
      return;
    }
    let cancelled = false;
    setLoadingDirections(true);

    const fetchDirections = travelMode === 'walk' ? walkingDirections : drivingDirections;

    fetchDirections(origin, selectedPlace)
      .then((result) => {
        if (cancelled) return;
        setDirections(result);

        if (mapRef.current && result?.geometry && result.geometry.length > 0) {
          const coords = result.geometry;
          let minLng = Math.min(...coords.map((c) => c.lng), origin.lng, selectedPlace.lng);
          let maxLng = Math.max(...coords.map((c) => c.lng), origin.lng, selectedPlace.lng);
          let minLat = Math.min(...coords.map((c) => c.lat), origin.lat, selectedPlace.lat);
          let maxLat = Math.max(...coords.map((c) => c.lat), origin.lat, selectedPlace.lat);

          mapRef.current.fitBounds(
            [
              [minLng, minLat],
              [maxLng, maxLat],
            ],
            {
              padding: { top: 100, bottom: 180, left: 320, right: 80 },
              duration: 800,
            }
          );
        }
      })
      .catch(() => {
        if (!cancelled) setDirections(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingDirections(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userLocation, selectedPlace, travelMode, itineraryOption]);

  // Fit bounds if itinerary option passed
  useEffect(() => {
    if (!itineraryOption || !mapRef.current) return;
    const allPoints = itineraryOption.legs.flatMap((leg) => legCoordinates(leg));
    if (allPoints.length === 0) return;

    let minLng = allPoints[0][0];
    let maxLng = allPoints[0][0];
    let minLat = allPoints[0][1];
    let maxLat = allPoints[0][1];
    for (const [lng, lat] of allPoints) {
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    }
    mapRef.current.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      {
        padding: { top: 100, bottom: 180, left: 320, right: 80 },
        duration: 800,
      }
    );
  }, [itineraryOption]);

  const handleMoveEnd = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map) setMapBounds(map.getBounds());
  }, []);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (map) setMapBounds(map.getBounds());
  }, []);

  const visibleTransportLocations = useMemo(() => {
    if (!mapBounds) return [];
    const filtered = INDONESIA_TRANSPORT_DATA.filter(
      (t) => activeTypes.has(t.type) && mapBounds.contains([t.longitude, t.latitude])
    );
    return filtered.length > MAX_RENDERED_MARKERS ? filtered.slice(0, MAX_RENDERED_MARKERS) : filtered;
  }, [mapBounds, activeTypes]);

  const activeRoadDisruptions = useMemo(() => {
    if (!mapBounds) return [];
    return INDONESIA_ROAD_DISRUPTIONS.filter(
      (d) => d.isActive && d.latitude && d.longitude && mapBounds.contains([d.longitude, d.latitude])
    );
  }, [mapBounds]);

  const activeDisruptionsForRoute = useMemo(() => {
    if (activeRoadDisruptions.length > 0) return activeRoadDisruptions;
    return INDONESIA_ROAD_DISRUPTIONS.filter((d) => d.isActive);
  }, [activeRoadDisruptions]);

  const toggleType = (type: IndonesiaTransportType) => {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const showAllTypes = () => {
    setActiveTypes(new Set(ALL_TRANSPORT_TYPES));
  };

const OPERATOR_SCHEDULE_MOCK: Record<
  string,
  Array<{ line: string; departure: string; estimate: string; station: string }>
> = {
  transjakarta: [
    { line: 'Koridor 1 (Blok M - Kota)', departure: '14:15 WIB', estimate: 'Dalam 5 mnt', station: 'Halte Bundaran HI' },
    { line: 'Koridor 9 (Pinang Ranti - Pluit)', departure: '14:22 WIB', estimate: 'Dalam 12 mnt', station: 'Halte Semanggi' },
  ],
  bus: [
    { line: 'BRT Feeder Sudirman', departure: '14:14 WIB', estimate: 'Dalam 4 mnt', station: 'Halte Tosari' },
    { line: 'Bus Kota Reguler AC', departure: '14:25 WIB', estimate: 'Dalam 15 mnt', station: 'Halte Slipi' },
  ],
  krl: [
    { line: 'Lin Bogor (Jakarta Kota - Bogor)', departure: '14:10 WIB', estimate: 'Dalam 2 mnt', station: 'Stasiun Manggarai' },
    { line: 'Lin Cikarang (Manggarai - Cikarang)', departure: '14:18 WIB', estimate: 'Dalam 8 mnt', station: 'Stasiun Sudirman' },
  ],
  mrt: [
    { line: 'Lin Utara-Selatan (Lebak Bulus - HI)', departure: '14:12 WIB', estimate: 'Dalam 4 mnt', station: 'Stasiun MRT Dukuh Atas' },
    { line: 'Lin Utara-Selatan (HI - Lebak Bulus)', departure: '14:17 WIB', estimate: 'Dalam 9 mnt', station: 'Stasiun MRT Bundaran HI' },
  ],
  lrt: [
    { line: 'LRT Jabodebek (Dukuh Atas - Harjamukti)', departure: '14:16 WIB', estimate: 'Dalam 6 mnt', station: 'Stasiun LRT Dukuh Atas' },
    { line: 'LRT Jabodebek (Dukuh Atas - Jati Mulya)', departure: '14:24 WIB', estimate: 'Dalam 14 mnt', station: 'Stasiun LRT Cikoko' },
  ],
  train: [
    { line: 'KA Argo Parahyangan (Gambir - Bandung)', departure: '14:45 WIB', estimate: 'Tersedia', station: 'Stasiun Gambir' },
    { line: 'KA Taksaka (Gambir - Yogyakarta)', departure: '15:20 WIB', estimate: 'Tersedia', station: 'Stasiun Pasarsenen' },
  ],
  airport_rail: [
    { line: 'KA Bandara Soekarno-Hatta (Manggarai - SHIA)', departure: '14:30 WIB', estimate: 'Dalam 20 mnt', station: 'Stasiun BNI City' },
    { line: 'KA Bandara Soekarno-Hatta (SHIA - Manggarai)', departure: '15:00 WIB', estimate: 'Dalam 50 mnt', station: 'Stasiun Bandara SHIA' },
  ],
};

  const handleSelectSavedPlace = (lat: number, lng: number, name?: string, address?: string) => {
    setSelectedOperatorForSchedule(null);
    setSelectedPlace({
      lat,
      lng,
      label: name || 'Rute Tersimpan',
      address: address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    });
    if (mapRef.current) {
      const origin = userLocation || JAKARTA_CENTER;
      const minLng = Math.min(origin.lng, lng);
      const maxLng = Math.max(origin.lng, lng);
      const minLat = Math.min(origin.lat, lat);
      const maxLat = Math.max(origin.lat, lat);
      mapRef.current.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat],
        ],
        {
          padding: { top: 100, bottom: 180, left: 320, right: 80 },
          duration: 800,
        }
      );
    }
  };

  const handleSaveCurrentRoute = async () => {
    if (!selectedPlace) {
      setToast({
        type: 'warning',
        message: 'Silakan tentukan rute perjalanan terlebih dahulu sebelum menyimpan.',
      });
      return;
    }

    try {
      const isGenericLabel =
        !selectedPlace.label ||
        selectedPlace.label === 'Lokasi Tujuan' ||
        selectedPlace.label.startsWith('-') ||
        /^-?\d+\.\d+/.test(selectedPlace.label);
      const placeName = !isGenericLabel ? selectedPlace.label : selectedPlace.address || 'Rute Perjalanan';
      const placeAddr = selectedPlace.address || `${selectedPlace.lat.toFixed(4)}, ${selectedPlace.lng.toFixed(4)}`;

      const newSavedItem = {
        id: `saved_${Date.now()}`,
        name: placeName,
        address: placeAddr,
        latitude: selectedPlace.lat,
        longitude: selectedPlace.lng,
        category: 'custom' as const,
        created_at: new Date().toISOString(),
      };

      const raw = localStorage.getItem('rutein_saved_places');
      const existing = raw ? JSON.parse(raw) : [];
      const updated = [newSavedItem, ...existing.filter((item: any) => item.name !== placeName)];
      localStorage.setItem('rutein_saved_places', JSON.stringify(updated));

      if (user) {
        createSavedPlace({
          userId: user.id,
          name: placeName,
          category: 'custom',
          address: placeAddr,
          latitude: selectedPlace.lat,
          longitude: selectedPlace.lng,
        }).catch(() => {});
      }

      setSavedPlacesTrigger((prev) => prev + 1);

      setToast({
        type: 'success',
        message: `Rute "${placeName}" berhasil disimpan ke Tempat Tersimpan!`,
      });
    } catch {
      setToast({
        type: 'error',
        message: 'Gagal menyimpan rute perjalanannya.',
      });
    }
  };

  const handleSelectSearchPlace = (place: PlaceResult) => {
    setSelectedOperatorForSchedule(null);
    setSelectedPlace(place);
    setPendingStreetViewPoint({ lat: place.lat, lng: place.lng });
    if (mapRef.current) {
      mapRef.current.flyTo({ center: [place.lng, place.lat], zoom: 15, duration: 800 });
    }
  };

  const handleSelectRouteSearch = (origin: PlaceResult | null, destination: PlaceResult) => {
    setSelectedOperatorForSchedule(null);
    if (origin) {
      setUserLocation({ lat: origin.lat, lng: origin.lng });
    }
    setSelectedPlace(destination);
    if (mapRef.current) {
      mapRef.current.flyTo({ center: [destination.lng, destination.lat], zoom: 15, duration: 800 });
    }
  };

  const handleMapClick = useCallback(
    async (e: MapLayerMouseEvent) => {
      const { lat, lng } = e.lngLat;
      const point: GeoPoint = { lat, lng };

      if (pendingStreetViewPoint && distanceMeters(point, pendingStreetViewPoint) <= STREET_VIEW_CONFIRM_RADIUS_M) {
        setStreetViewPoint(pendingStreetViewPoint);
        return;
      }
      setPendingStreetViewPoint(point);
      setSelectedOperatorForSchedule(null);
      setSelectedPlace({
        lat,
        lng,
        label: 'Lokasi Tujuan',
        address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      });
    },
    [pendingStreetViewPoint]
  );

  // Publish live map state to the globally-mounted Sidebar (rendered once
  // by AppLayout) instead of rendering a sidebar inside this page — that's
  // what was causing the duplicate sidebar on /dashboard, /map, and /.
  usePublishSidebarMapControls({
    activeTypes,
    onToggleType: toggleType,
    onShowAllTypes: showAllTypes,
    onSelectSavedPlace: handleSelectSavedPlace,
    onSelectOperator: (type) => {
      setSelectedPlace(null);
      setSelectedOperatorForSchedule(type);
    },
    savedPlacesTrigger,
  });

  const routeGeoJson = directions
    ? {
        type: 'Feature' as const,
        properties: {},
        geometry: {
          type: 'LineString' as const,
          coordinates: directions.geometry.map((p) => [p.lng, p.lat]),
        },
      }
    : null;

  return (
    <div style={dashboardWrapper}>
      {/* Dynamic Toast Alert Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 9999,
            padding: '10px 16px',
            borderRadius: 12,
            background: toast.type === 'success' ? '#059669' : toast.type === 'warning' ? '#D97706' : '#DC2626',
            color: '#FFFFFF',
            fontSize: 13,
            fontWeight: 600,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 2, marginLeft: 4 }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Map Viewport Area */}
      <main style={mapContainer}>
        {/* 2. Top Floating Search Bar & Filters */}
        <MapTopSearch
          onSelectPlace={handleSelectSearchPlace}
          onSelectRouteSearch={handleSelectRouteSearch}
          travelMode={travelMode}
          onChangeTravelMode={setTravelMode}
          budgetPreference={budgetPreference}
          onChangeBudgetPreference={setBudgetPreference}
          activeTypes={activeTypes}
          onToggleType={toggleType}
          onShowAllTypes={showAllTypes}
        />

        {/* Top-Right Disruption Warning Notification Banner */}
        {selectedPlace && showRouteDisruptionNotif && activeDisruptionsForRoute.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              zIndex: 'var(--z-map-controls)',
              width: 340,
              maxWidth: 'calc(100vw - 32px)',
              background: '#FFFFFF',
              borderRadius: 16,
              padding: '14px 16px',
              boxShadow: '0 10px 30px rgba(218, 54, 42, 0.25)',
              border: '1.5px solid #FCA5A5',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: '#FEE2E2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <AlertTriangle size={16} color="#DC2626" />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#991B1B' }}>
                  Peringatan Hambatan Rute
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowRouteDisruptionNotif(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#666' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ fontSize: 13, fontWeight: 700, color: '#1E1E1E', marginBottom: 4 }}>
              {activeDisruptionsForRoute[0].title}
            </div>
            <p style={{ margin: '0 0 10px', fontSize: 12, color: '#555555', lineHeight: 1.45 }}>
              {activeDisruptionsForRoute[0].description}
            </p>

            <button
              type="button"
              onClick={() => navigate('/disruptions')}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 10,
                background: '#DA362A',
                color: '#FFFFFF',
                border: 'none',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                boxShadow: '0 4px 12px rgba(218, 54, 42, 0.25)',
              }}
            >
              <span>Lihat Detail Hambatan</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* 3. Right Floating Point Controls */}
        <MapPointControls
          onZoomIn={() => mapRef.current?.zoomIn()}
          onZoomOut={() => mapRef.current?.zoomOut()}
          onToggleMapStyle={() => setBaseLayer((prev) => (prev === 'street' ? 'satellite' : 'street'))}
          onReCenterUserLocation={() => {
            if (userLocation && mapRef.current) {
              mapRef.current.flyTo({ center: [userLocation.lng, userLocation.lat], zoom: 15, duration: 800 });
            }
          }}
          onSaveRoute={handleSaveCurrentRoute}
          onToggleRoute={() => {
            if (selectedPlace && mapRef.current) {
              const origin = userLocation || JAKARTA_CENTER;
              const minLng = Math.min(origin.lng, selectedPlace.lng);
              const maxLng = Math.max(origin.lng, selectedPlace.lng);
              const minLat = Math.min(origin.lat, selectedPlace.lat);
              const maxLat = Math.max(origin.lat, selectedPlace.lat);
              mapRef.current.fitBounds(
                [
                  [minLng, minLat],
                  [maxLng, maxLat],
                ],
                {
                  padding: { top: 100, bottom: 180, left: 320, right: 80 },
                  duration: 800,
                }
              );
            }
          }}
          baseLayer={baseLayer}
        />

        {/* 4. Bottom Container: Operator Schedule Overview Card OR Route Detail Bar (Single Container, No Stacking) */}
        {selectedOperatorForSchedule ? (
          <div
            style={{
              position: 'absolute',
              bottom: 24,
              left: 20,
              zIndex: 'var(--z-panel)',
              background: '#FFFFFF',
              borderRadius: 18,
              padding: '16px 20px',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.2)',
              border: '1.5px solid #E5D5C5',
              width: 360,
              maxWidth: 'calc(100vw - 40px)',
              animation: 'slideUpFade 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: TRANSPORT_TYPE_COLOR[selectedOperatorForSchedule],
                  }}
                />
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1E1E1E', fontFamily: 'var(--font-body)' }}>
                  Jadwal {TRANSPORT_TYPE_LABELS[selectedOperatorForSchedule]}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOperatorForSchedule(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                title="Tutup ringkasan jadwal"
              >
                <X size={16} color="#666" />
              </button>
            </div>

            {/* 2 Upcoming Schedule Items or Empty State */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {(() => {
                const items = OPERATOR_SCHEDULE_MOCK[selectedOperatorForSchedule];
                if (!items || items.length === 0) {
                  return (
                    <div
                      style={{
                        padding: '14px 12px',
                        borderRadius: 10,
                        background: '#F9FAFB',
                        border: '1px dashed #E5E7EB',
                        textAlign: 'center',
                        color: '#6B7280',
                        fontSize: 12,
                        fontWeight: 500,
                      }}
                    >
                      Jadwal keberangkatan tidak tersedia saat ini.
                    </div>
                  );
                }
                return items.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 10,
                      background: '#F9FAFB',
                      border: '1px solid #F3F4F6',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#1E1E1E' }}>{item.line}</div>
                      <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{item.station}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#DA362A' }}>{item.departure}</div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: '#059669', marginTop: 2 }}>
                        {item.estimate}
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  navigate('/schedule', { state: { selectedType: selectedOperatorForSchedule } });
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#DA362A',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 0',
                }}
              >
                <span>Lihat jadwal lainnya</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ) : (
          <MapRouteDetailBar
            destination={selectedPlace}
            directions={directions}
            loading={loadingDirections}
            travelMode={travelMode}
            budgetPreference={budgetPreference}
            onOpenDetails={() => {
              if (selectedPlace) {
                navigate('/routes', { state: { destination: selectedPlace } });
              }
            }}
            onOpenPreview={() => {
              if (selectedPlace) {
                setStreetViewPoint({ lat: selectedPlace.lat, lng: selectedPlace.lng });
              }
            }}
            onCloseRoute={() => {
              setSelectedPlace(null);
              setDirections(null);
            }}
          />
        )}

        <Map
          ref={mapRef}
          {...viewState}
          onMove={(evt) => setViewState(evt.viewState)}
          onMoveEnd={handleMoveEnd}
          onClick={handleMapClick}
          attributionControl={false}
          mapStyle={baseLayer === 'satellite' ? SATELLITE_STYLE : getMapStyle()}
          style={{ width: '100%', height: '100%' }}
        >

          {/* Render Route Line if directions available */}
          {!itineraryOption && routeGeoJson && (
            <Source id="single-route" type="geojson" data={routeGeoJson}>
              <Layer
                id="single-route-casing"
                type="line"
                layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                paint={{
                  'line-color': '#FFFFFF',
                  'line-width': 9,
                  'line-opacity': 0.9,
                }}
              />
              <Layer
                id="single-route-line"
                type="line"
                layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                paint={{
                  'line-color': '#DA362A',
                  'line-width': 5,
                  'line-opacity': 1.0,
                }}
              />
            </Source>
          )}

          {/* Multi-leg itinerary rendering if passed */}
          {itineraryOption &&
            itineraryOption.legs.map((leg, i) => {
              const coords = legCoordinates(leg);
              const color = LEG_MODE_COLOR[leg.mode] ?? LEG_MODE_COLOR.other;
              const isDashed = leg.mode === 'walk' || !!leg.geometryIsEstimate;
              const midIdx = Math.floor(coords.length / 2);
              const mid = coords[midIdx];
              const boundaryPoint = coords[0];

              return (
                <React.Fragment key={i}>
                  <Source
                    id={`leg-${i}`}
                    type="geojson"
                    data={{
                      type: 'Feature',
                      properties: {},
                      geometry: { type: 'LineString', coordinates: coords },
                    }}
                  >
                    <Layer
                      id={`leg-line-${i}`}
                      type="line"
                      layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                      paint={{
                        'line-color': color,
                        'line-width': 5,
                        'line-opacity': 0.9,
                        'line-dasharray': isDashed ? [2, 2] : [1, 0],
                      }}
                    />
                  </Source>

                  {leg.mode !== 'walk' && mid && (
                    <Marker longitude={mid[0]} latitude={mid[1]} anchor="center">
                      <LegModeMarker mode={leg.mode} />
                    </Marker>
                  )}

                  {i > 0 && boundaryPoint && (
                    <Marker longitude={boundaryPoint[0]} latitude={boundaryPoint[1]} anchor="center">
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: '#fff',
                          border: `3px solid ${color}`,
                        }}
                      />
                    </Marker>
                  )}
                </React.Fragment>
              );
            })}

          {/* User GPS location dot */}
          {userLocation && (
            <Marker
              latitude={userLocation.lat}
              longitude={userLocation.lng}
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                setPopupTarget('user');
              }}
            >
              <div className="maplibregl-user-location-dot" />
            </Marker>
          )}

          {userLocation && popupTarget === 'user' && (
            <Popup
              latitude={userLocation.lat}
              longitude={userLocation.lng}
              onClose={() => setPopupTarget(null)}
              closeButton={false}
            >
              Posisiku Saat Ini
            </Popup>
          )}

          {/* Selected Destination Marker */}
          {selectedPlace && (
            <Marker latitude={selectedPlace.lat} longitude={selectedPlace.lng}>
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: '#DA362A',
                  border: '3px solid #FFFFFF',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                }}
              />
            </Marker>
          )}

          {/* Road Disruptions Layer */}
          {activeRoadDisruptions.map((d) => (
            <Marker
              key={d.id}
              latitude={d.latitude!}
              longitude={d.longitude!}
              onClick={(e) => e.originalEvent.stopPropagation()}
            >
              <div
                onMouseEnter={() => setHoveredDisruptionId(d.id)}
                onMouseLeave={() => setHoveredDisruptionId((id) => (id === d.id ? null : id))}
                style={{
                  width: hoveredDisruptionId === d.id ? 30 : 24,
                  height: hoveredDisruptionId === d.id ? 30 : 24,
                  borderRadius: '50%',
                  background: SEVERITY_COLORS[d.severity],
                  border: '2px solid #0B1220',
                  boxShadow:
                    hoveredDisruptionId === d.id
                      ? '0 0 0 5px rgba(255,255,255,0.15), 0 2px 6px rgba(0,0,0,0.4)'
                      : '0 2px 5px rgba(0,0,0,0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 120ms ease',
                }}
              >
                <AlertTriangle
                  size={Math.round((hoveredDisruptionId === d.id ? 30 : 24) * 0.55)}
                  color="#fff"
                  strokeWidth={2.5}
                />
              </div>
            </Marker>
          ))}

          {hoveredDisruptionId && (() => {
            const d = activeRoadDisruptions.find((s) => s.id === hoveredDisruptionId);
            if (!d || !d.latitude || !d.longitude) return null;
            return (
              <Popup
                latitude={d.latitude}
                longitude={d.longitude}
                closeButton={false}
                closeOnClick={false}
                offset={20}
                anchor="bottom"
                style={{ zIndex: 'var(--z-popover)' }}
              >
                <div style={{ minWidth: 160, maxWidth: 220 }}>
                  <strong>{d.title}</strong>
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, marginBottom: 4 }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: SEVERITY_COLORS[d.severity] + '22',
                        color: SEVERITY_COLORS[d.severity],
                      }}
                    >
                      {d.severity}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>{d.description}</div>
                </div>
              </Popup>
            );
          })()}

          {/* Transport Operator Locations */}
          {visibleTransportLocations.map((stop: IndonesiaTransportLocation) => (
            <Marker
              key={stop.id}
              latitude={stop.latitude}
              longitude={stop.longitude}
              onClick={(e) => e.originalEvent.stopPropagation()}
            >
              <div
                onMouseEnter={() => setHoveredStopId(stop.id)}
                onMouseLeave={() => setHoveredStopId((id) => (id === stop.id ? null : id))}
              >
                <TransportMarkerIcon type={stop.type} highlighted={hoveredStopId === stop.id} />
              </div>
            </Marker>
          ))}

          {hoveredStopId && (() => {
            const stop = visibleTransportLocations.find((s) => s.id === hoveredStopId);
            if (!stop) return null;
            return (
              <Popup
                latitude={stop.latitude}
                longitude={stop.longitude}
                closeButton={false}
                closeOnClick={false}
                offset={20}
                anchor="bottom"
              >
                <div style={{ minWidth: 160 }}>
                  <strong>{stop.name}</strong>
                  <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>{TRANSPORT_TYPE_LABELS[stop.type]}</div>
                  {stop.line && <div style={{ fontSize: 12, color: '#555' }}>{stop.line}</div>}
                  <div style={{ fontSize: 12, color: '#555' }}>
                    {stop.city}, {stop.province}
                  </div>
                </div>
              </Popup>
            );
          })()}

          {/* Street view indicator dot */}
          {pendingStreetViewPoint && (
            <Marker latitude={pendingStreetViewPoint.lat} longitude={pendingStreetViewPoint.lng}>
              <div
                title="Click again for street view"
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: '#F97316',
                  border: '3px solid #0B1220',
                  boxShadow: '0 0 0 6px rgba(249,115,22,0.25)',
                }}
              />
            </Marker>
          )}
        </Map>

        {/* Street view modal */}
        {streetViewPoint && (
          <Suspense fallback={<div style={overlayLoadingFallback}>Loading street view…</div>}>
            <StreetViewModal
              point={streetViewPoint}
              onClose={() => setStreetViewPoint(null)}
            />
          </Suspense>
        )}
      </main>
    </div>
  );
}

const dashboardWrapper: React.CSSProperties = {
  width: '100%',
  height: '100%',
  overflow: 'hidden',
};

const mapContainer: React.CSSProperties = {
  flex: 1,
  height: '100%',
  position: 'relative',
};

const overlayLoadingFallback: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.75)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff',
  fontSize: 14,
  zIndex: 'var(--z-modal)',
};