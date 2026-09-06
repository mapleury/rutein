import React, { useEffect, useRef, useState, useCallback, useMemo, Suspense, lazy } from 'react';
import { setWorkerUrl, type LngLatBounds } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
setWorkerUrl(workerUrl);

import Map, { Marker, Popup, Source, Layer, NavigationControl, type MapRef, type MapLayerMouseEvent } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { AlertTriangle } from 'lucide-react';

import PlaceSearchInput from '@/components/PlaceSearchInput';
import TransportFilter from '@/components/TransportFilter';
import TransportMarkerIcon, { LegModeMarker, LEG_MODE_COLOR } from '@/components/transportMarkerIcon';
import { getMapStyle, walkingDirections, drivingDirections, type DirectionsResult } from '@/services/mapService';
import { getCurrentPosition, isGeolocationSupported, distanceMeters } from '@/services/locationService';
import { findNearbyStops } from '@/services/transportService';
import { reverseGeocode } from '@/services/geocodingService';
import { INDONESIA_TRANSPORT_DATA, TRANSPORT_TYPE_LABELS, type IndonesiaTransportType, type IndonesiaTransportLocation } from '@/data/indonesiaTransportData';
import { INDONESIA_ROAD_DISRUPTIONS, SEVERITY_COLORS, DISRUPTION_SEVERITY_LABELS, DISRUPTION_CAUSE_LABELS } from '@/data/indonesiaRoadDisruption';
import type { PlaceResult, GeoPoint, RouteOption, RouteLeg } from '@/types/domain.types';
import type { TransportStop } from '@/types/database.types';
import { useNavigate, useLocation } from 'react-router-dom';

const StreetViewModal = lazy(() => import('@/components/StreetViewModal'));

const JAKARTA_CENTER: GeoPoint = { lat: -6.2088, lng: 106.8456 };
type TravelMode = 'walk' | 'ojek';
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

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 1) return '<1 min';
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h} hr ${m} min` : `${h} hr`;
}

function formatDistance(meters: number): string {
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
}

function getRouteMidpoint(geometry: GeoPoint[]): GeoPoint | null {
  if (geometry.length === 0) return null;
  if (geometry.length === 1) return geometry[0];

  const segmentLengths: number[] = [];
  let total = 0;
  for (let i = 0; i < geometry.length - 1; i++) {
    const d = distanceMeters(geometry[i], geometry[i + 1]);
    segmentLengths.push(d);
    total += d;
  }
  if (total === 0) return geometry[0];

  const half = total / 2;
  let walked = 0;
  for (let i = 0; i < segmentLengths.length; i++) {
    const segLen = segmentLengths[i];
    if (walked + segLen >= half) {
      const t = segLen === 0 ? 0 : (half - walked) / segLen;
      const a = geometry[i];
      const b = geometry[i + 1];
      return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t };
    }
    walked += segLen;
  }
  return geometry[geometry.length - 1];
}

function legCoordinates(leg: RouteLeg): [number, number][] {
  const points = leg.geometry && leg.geometry.length >= 2 ? leg.geometry : [leg.from, leg.to];
  return points.map((p) => [p.lng, p.lat]);
}

export default function MapPage() {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const mapRef = useRef<MapRef>(null);
  const [userLocation, setUserLocation] = useState<GeoPoint | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [nearbyStops, setNearbyStops] = useState<TransportStop[]>([]);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [loadingStops, setLoadingStops] = useState(false);
  const [travelMode, setTravelMode] = useState<TravelMode>('walk');
  const [baseLayer, setBaseLayer] = useState<BaseLayer>('street');
  const [directions, setDirections] = useState<DirectionsResult | null>(null);
  const [loadingDirections, setLoadingDirections] = useState(false);
  const [directionsError, setDirectionsError] = useState<string | null>(null);
  const [popupTarget, setPopupTarget] = useState<'user' | 'place' | null>(null);

  const itineraryOption = (routerLocation.state as { option?: RouteOption } | null)?.option ?? null;

  const [activeTypes, setActiveTypes] = useState<Set<IndonesiaTransportType>>(new Set(ALL_TRANSPORT_TYPES));
  const [filterOpen, setFilterOpen] = useState(false);
  const [mapBounds, setMapBounds] = useState<LngLatBounds | null>(null);
  const [hoveredStopId, setHoveredStopId] = useState<string | null>(null);
  
  const [hoveredDisruptionId, setHoveredDisruptionId] = useState<string | null>(null);

  const [pendingStreetViewPoint, setPendingStreetViewPoint] = useState<GeoPoint | null>(null);
  const [streetViewPoint, setStreetViewPoint] = useState<GeoPoint | null>(null);
  const [streetViewLabel, setStreetViewLabel] = useState<string | undefined>(undefined);

  const [viewState, setViewState] = useState({
    latitude: JAKARTA_CENTER.lat,
    longitude: JAKARTA_CENTER.lng,
    zoom: 14,
  });

  useEffect(() => {
    if (!isGeolocationSupported()) {
      setLocationError('Geolocation is not supported by this browser.');
      return;
    }
    getCurrentPosition()
      .then((point) => setUserLocation(point))
      .catch((err) => setLocationError(err.message ?? 'Could not get your location.'));
  }, []);

  useEffect(() => {
    const center = selectedPlace ?? userLocation;
    if (!center) return;
    setLoadingStops(true);
    findNearbyStops(center, 1200)
      .then(setNearbyStops)
      .catch(() => setNearbyStops([]))
      .finally(() => setLoadingStops(false));
  }, [selectedPlace, userLocation]);

  useEffect(() => {
    if (itineraryOption) return;
    const point = selectedPlace ?? userLocation;
    if (!point || !mapRef.current) return;
    mapRef.current.flyTo({ center: [point.lng, point.lat], zoom: 15, duration: 800 });
  }, [selectedPlace, userLocation, itineraryOption]);

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
      { padding: 60, duration: 800 }
    );
  }, [itineraryOption]);

  useEffect(() => {
    if (itineraryOption) {
      setDirections(null);
      return;
    }
    if (!userLocation || !selectedPlace) {
      setDirections(null);
      return;
    }
    let cancelled = false;
    setLoadingDirections(true);
    setDirectionsError(null);

    const fetchDirections = travelMode === 'walk' ? walkingDirections : drivingDirections;

    fetchDirections(userLocation, selectedPlace)
      .then((result) => {
        if (!cancelled) setDirections(result);
      })
      .catch(() => {
        if (!cancelled) setDirectionsError('Could not calculate a route for this destination.');
      })
      .finally(() => {
        if (!cancelled) setLoadingDirections(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userLocation, selectedPlace, travelMode, itineraryOption]);

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

  function toggleType(type: IndonesiaTransportType) {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  const handleMapClick = useCallback(async (e: MapLayerMouseEvent) => {
    const { lat, lng } = e.lngLat;
    const point: GeoPoint = { lat, lng };

    if (pendingStreetViewPoint && distanceMeters(point, pendingStreetViewPoint) <= STREET_VIEW_CONFIRM_RADIUS_M) {
      setStreetViewLabel(selectedPlace?.label);
      setStreetViewPoint(pendingStreetViewPoint);
      return;
    }

    setPendingStreetViewPoint(point);
    const place = await reverseGeocode(lat, lng);
    setSelectedPlace(place ?? { lat, lng, label: 'Selected location', address: `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
  }, [pendingStreetViewPoint, selectedPlace]);

  async function handleSearchSelect(place: PlaceResult) {
    setSelectedPlace(place);
    setPendingStreetViewPoint({ lat: place.lat, lng: place.lng });
  }

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

  const routeMidpoint = useMemo(
    () => (directions ? getRouteMidpoint(directions.geometry) : null),
    [directions]
  );

  const routeColor = travelMode === 'walk' ? '#38BDF8' : '#F97316';

  return (
    <div className="container" style={{ paddingTop: 28, paddingBottom: 80 }}>
      <h1 style={{ fontSize: 'clamp(26px, 4vw, 34px)', marginBottom: 6 }}>Map</h1>
      <p style={{ color: 'var(--color-text-muted)', marginTop: 0, marginBottom: 20, fontSize: 14 }}>
        {itineraryOption
          ? 'Showing your planned route below — walk, transit, and ojek legs are color-coded.'
          : 'Click a spot once to select it, click it again to look around at street level.'}
      </p>

      {!itineraryOption && (
        <div className="card" style={{ marginBottom: 16, background: '#FFFFFF', borderRadius: 16 }}>
          <PlaceSearchInput placeholder="Search a place or address…" onSelect={handleSearchSelect} />
        </div>
      )}

      {locationError && (
        <div className="card" style={{ marginBottom: 16, borderColor: 'var(--color-amber)' }}>
          <span className="badge badge-fallback">Location unavailable</span>
          <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>{locationError}</p>
        </div>
      )}

      <div style={{ position: 'relative', height: 500, borderRadius: 14, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 1, display: 'flex', gap: 8 }}>
          <button
            className="btn btn-secondary"
            style={mapOverlayBtn}
            onClick={() => setBaseLayer((prev) => (prev === 'street' ? 'satellite' : 'street'))}
          >
            {baseLayer === 'street' ? '🛰️ Satellite' : '🗺️ Streets'}
          </button>

          <button className="btn btn-secondary" style={mapOverlayBtn} onClick={() => setFilterOpen((v) => !v)}>
            🚏 Transport ({activeTypes.size}/{ALL_TRANSPORT_TYPES.length})
          </button>
        </div>

        <TransportFilter
          open={filterOpen}
          activeTypes={activeTypes}
          onToggle={toggleType}
          onShowAll={() => setActiveTypes(new Set(ALL_TRANSPORT_TYPES))}
          onClose={() => setFilterOpen(false)}
        />

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
          <NavigationControl position="top-right" showCompass={false} />

          {/* Single-destination walk/ojek route (search-driven flow). Hidden
              entirely when a full multi-leg itinerary is loaded instead. */}
          {!itineraryOption && routeGeoJson && (
            <Source id="route" type="geojson" data={routeGeoJson}>
              <Layer
                id="route-line"
                type="line"
                layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                paint={{
                  'line-color': routeColor,
                  'line-width': 5,
                  'line-opacity': 0.85,
                  'line-dasharray': directions?.isEstimate ? [2, 2] : [1, 0],
                }}
              />
            </Source>
          )}

          {!itineraryOption && routeMidpoint && directions && (
            <Marker latitude={routeMidpoint.lat} longitude={routeMidpoint.lng} anchor="center">
              <div
                style={{
                  background: routeColor,
                  color: '#FFFFFF',
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: 8,
                  border: '2px solid #FFFFFF',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                  pointerEvents: 'none',
                }}
              >
                {formatDuration(directions.durationS)}
              </div>
            </Marker>
          )}

          {/* Full multi-leg itinerary — each leg gets its own accurate
              polyline, colored + dashed by mode, with an icon marker at its
              midpoint (skipped for plain walking legs to avoid clutter) and
              a small dot marking the transfer/board/alight point between
              consecutive legs. */}
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

          {userLocation && (
            <Marker
              latitude={userLocation.lat}
              longitude={userLocation.lng}
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                setPopupTarget('user');
              }}
            >
              {/* Reuses MapLibre's built-in "you are here" dot styling
                  (pulsing animation + white ring), already loaded via
                  maplibre-gl.css — no custom icon asset needed. */}
              <div className="maplibregl-user-location-dot" />
            </Marker>
          )}
          {userLocation && popupTarget === 'user' && (
            <Popup latitude={userLocation.lat} longitude={userLocation.lng} onClose={() => setPopupTarget(null)} closeButton={false}>
              You are here
            </Popup>
          )}

          {!itineraryOption && selectedPlace && (
            <Marker
              latitude={selectedPlace.lat}
              longitude={selectedPlace.lng}
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                setPopupTarget('place');
              }}
            >
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#F97316', border: '2px solid #FFFFFF', boxShadow: '0 2px 6px rgba(0,0,0,0.25)' }} />
            </Marker>
          )}
          {!itineraryOption && selectedPlace && popupTarget === 'place' && (
            <Popup latitude={selectedPlace.lat} longitude={selectedPlace.lng} onClose={() => setPopupTarget(null)} closeButton={false}>
              {selectedPlace.label}
            </Popup>
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
                  border: '2px solid #FFFFFF',
                  boxShadow: hoveredDisruptionId === d.id 
                    ? '0 0 0 5px rgba(255,255,255,0.15), 0 2px 6px rgba(0,0,0,0.4)' 
                    : '0 2px 5px rgba(0,0,0,0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 120ms ease',
                }}
              >
                <AlertTriangle size={Math.round((hoveredDisruptionId === d.id ? 30 : 24) * 0.55)} color="#fff" strokeWidth={2.5} />
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
                style={{ zIndex: 100 }}
              >
                <div style={{ minWidth: 160, maxWidth: 220 }}>
                  <strong>{d.title}</strong>
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, marginBottom: 4 }}>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: SEVERITY_COLORS[d.severity] + '22',
                      color: SEVERITY_COLORS[d.severity],
                    }}>
                      {DISRUPTION_SEVERITY_LABELS[d.severity] ?? d.severity}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>
                    {d.description}
                  </div>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 6 }}>
                    Kategori: {DISRUPTION_CAUSE_LABELS[d.cause] ?? d.cause}
                  </div>
                </div>
              </Popup>
            );
          })()}

          {/* Live transport network (transjakarta, MRT, LRT, KRL, etc.) —
              viewport-filtered against the static curated dataset. */}
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
                  <div style={{ fontSize: 12, color: '#555' }}>{stop.city}, {stop.province}</div>
                </div>
              </Popup>
            );
          })()}

          {!itineraryOption && pendingStreetViewPoint &&
            (!selectedPlace || distanceMeters(pendingStreetViewPoint, selectedPlace) > 1) && (
              <Marker latitude={pendingStreetViewPoint.lat} longitude={pendingStreetViewPoint.lng}>
                <div
                  title="Click again for street view"
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: '#F97316',
                    border: '3px solid #FFFFFF',
                    boxShadow: '0 0 0 6px rgba(249,115,22,0.3)',
                  }}
                />
              </Marker>
          )}
        </Map>
      </div>

      {itineraryOption && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ margin: 0, fontSize: 15 }}>Route legend</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 10 }}>
            {itineraryOption.modesUsed.map((mode) => (
              <div key={mode} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <span
                  style={{
                    width: 18,
                    height: 4,
                    borderRadius: 2,
                    background: LEG_MODE_COLOR[mode] ?? LEG_MODE_COLOR.other,
                    display: 'inline-block',
                  }}
                />
                <span style={{ textTransform: 'capitalize' }}>{mode}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!itineraryOption && userLocation && selectedPlace && (
        <div className="card" style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <h3 style={{ margin: 0, fontSize: 15 }}>Route to {selectedPlace.label}</h3>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className={travelMode === 'walk' ? 'btn btn-primary' : 'btn btn-secondary'}
                style={{ padding: '4px 10px', fontSize: 12 }}
                onClick={() => setTravelMode('walk')}
              >
                Walk
              </button>
              <button
                className={travelMode === 'ojek' ? 'btn btn-primary' : 'btn btn-secondary'}
                style={{ padding: '4px 10px', fontSize: 12 }}
                onClick={() => setTravelMode('ojek')}
              >
                Ojek
              </button>
            </div>
          </div>

          {loadingDirections && (
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 8 }}>Calculating route…</p>
          )}
          {directionsError && (
            <p style={{ fontSize: 13, color: 'var(--color-amber)', marginTop: 8 }}>{directionsError}</p>
          )}
          {!loadingDirections && directions && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, fontSize: 13 }}>
              <span style={{ fontWeight: 600 }}>{formatDuration(directions.durationS)}</span>
              <span style={{ color: 'var(--color-text-muted)' }}>{formatDistance(directions.distanceM)}</span>
              {directions.isEstimate && <span className="badge badge-fallback">Estimated (no live routing key)</span>}
            </div>
          )}
        </div>
      )}

      {!itineraryOption && (
        <div className="card" style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 15 }}>Nearby transit stops</h3>
            {loadingStops && <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Searching…</span>}
          </div>
          {!loadingStops && nearbyStops.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
              No stops found within 1.2km. Click anywhere on the map to check a different spot.
            </p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
            {nearbyStops.map((stop) => (
              <div key={stop.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span>{stop.stop_name}</span>
                <span style={{ color: 'var(--color-text-muted)' }}>{stop.is_transfer_point ? 'Transfer point' : 'Stop'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!itineraryOption && selectedPlace && (
        <button className="btn btn-primary" style={{ marginTop: 16, width: '100%' }} onClick={() => navigate('/routes', { state: { destination: selectedPlace } })}>
          Plan a route to {selectedPlace.label}
        </button>
      )}

      {streetViewPoint && (
        <Suspense fallback={<div style={overlayLoadingFallback}>Loading street view…</div>}>
          <StreetViewModal
            point={streetViewPoint}
            locationLabel={streetViewLabel}
            onClose={() => setStreetViewPoint(null)}
          />
        </Suspense>
      )}
    </div>
  );
}

const mapOverlayBtn: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1.5px solid var(--color-border)',
  color: 'var(--color-text)',
  borderRadius: 8,
  padding: '6px 12px',
  fontSize: 12,
  fontWeight: 600,
  boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
  cursor: 'pointer',
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
  zIndex: 200,
};