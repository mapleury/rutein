import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bus,
  TrainFront,
  TramFront,
  Train,
  PlaneTakeoff,
  Ship,
  Building2,
  MapPin,
  Check,
  Zap,
  PiggyBank,
  Scale,
  AlertCircle,
  Plus,
  Minus,
  ArrowRight,
  Info,
  Navigation2,
  Calendar,
  Compass,
  Home,
  Briefcase,
  GraduationCap,
  Edit3
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import PlaceSearchInput from '@/components/PlaceSearchInput';
import { getCurrentPosition } from '@/services/locationService';
import { reverseGeocode } from '@/services/geocodingService';
import { listSavedPlaces } from '@/services/savedPlacesService';
import { planAndCompareRoutes } from '@/services/routeService';
import { createBudgetPlan, listBudgetPlans } from '@/services/budgetService';
import {
  evaluateBudgetOptions,
  formatRupiah,
  calculateLongTermProjection,
  CANDIDATE_JOURNEYS,
  type BudgetEvaluationResult,
  type BudgetRouteCandidate
} from '@/services/budgetEvaluator';
import type { IndonesiaTransportType } from '@/data/indonesiaTransportData';
import type { PlaceResult } from '@/types/domain.types';
import type { SavedPlace } from '@/types/database.types';

export const transportIcons: Record<IndonesiaTransportType, React.ComponentType<any>> = {
  transjakarta: Bus,
  bus: Bus,
  krl: TrainFront,
  mrt: TramFront,
  lrt: Train,
  train: TrainFront,
  airport_rail: PlaneTakeoff,
  ferry: Ship,
  terminal: Building2,
  other: MapPin,
};

const PRESET_BUDGETS = [5000, 10000, 15000, 20000, 30000];

export default function BudgetPlanner() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const userKey = user ? user.id : 'guest';
  const localStorageBudgetKey = `rutein_applied_budget_${userKey}`;
  const localStorageDestKey = `rutein_budget_destination_${userKey}`;
  const localStorageOrigKey = `rutein_budget_origin_${userKey}`;

  const [origin, setOriginState] = useState<PlaceResult | null>(null);
  const [destination, setDestinationState] = useState<PlaceResult | null>(null);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [isDetectingLocation, setIsDetectingLocation] = useState<boolean>(false);
  const [isEditingDestination, setIsEditingDestination] = useState<boolean>(false);
  const [locationWarning, setLocationWarning] = useState<string | null>(null);

  const [inputBudget, setInputBudget] = useState<number>(20000);
  const [appliedBudget, setAppliedBudget] = useState<number>(20000);
  const [justApplied, setJustApplied] = useState<boolean>(false);
  const [isSavingSupabase, setIsSavingSupabase] = useState<boolean>(false);
  const [calculatedCandidates, setCalculatedCandidates] = useState<BudgetRouteCandidate[] | null>(null);
  const [isCalculatingRoutes, setIsCalculatingRoutes] = useState<boolean>(false);

  const setOrigin = (place: PlaceResult | null) => {
    setOriginState(place);
    if (place) {
      localStorage.setItem(localStorageOrigKey, JSON.stringify(place));
    } else {
      localStorage.removeItem(localStorageOrigKey);
    }
  };

  const setDestination = (place: PlaceResult | null) => {
    setDestinationState(place);
    if (place) {
      localStorage.setItem(localStorageDestKey, JSON.stringify(place));
    } else {
      localStorage.removeItem(localStorageDestKey);
    }
  };

  useEffect(() => {
    const savedDest = localStorage.getItem(localStorageDestKey);
    if (savedDest) {
      try {
        const parsed = JSON.parse(savedDest);
        if (parsed && parsed.label) {
          setDestinationState(parsed);
        }
      } catch {}
    } else {
      setDestinationState(null);
    }

    const savedOrig = localStorage.getItem(localStorageOrigKey);
    let hasSavedOrigin = false;
    if (savedOrig) {
      try {
        const parsed = JSON.parse(savedOrig);
        if (parsed && parsed.label) {
          setOriginState(parsed);
          hasSavedOrigin = true;
        }
      } catch {}
    }

    if (!hasSavedOrigin) {
      setIsDetectingLocation(true);
      getCurrentPosition()
        .then(async (point) => {
          const place = await reverseGeocode(point.lat, point.lng);
          const detected = place ?? { ...point, label: 'Lokasi Terkini Saya', address: 'Lokasi Terkini Saya' };
          setOriginState(detected);
          localStorage.setItem(localStorageOrigKey, JSON.stringify(detected));
        })
        .catch(() => {
          const defaultOrigin = { lat: -6.2088, lng: 106.8456, label: 'Stasiun Sudirman (Default)', address: 'Sudirman, Jakarta' };
          setOriginState(defaultOrigin);
        })
        .finally(() => setIsDetectingLocation(false));
    }

    const savedLocal = localStorage.getItem(localStorageBudgetKey);
    let hasLocalBudget = false;
    if (savedLocal) {
      const parsed = parseInt(savedLocal, 10);
      if (!isNaN(parsed) && parsed > 0) {
        setInputBudget(parsed);
        setAppliedBudget(parsed);
        hasLocalBudget = true;
      }
    }

    if (user) {
      listSavedPlaces(user.id).then(setSavedPlaces).catch(() => {});

      listBudgetPlans(user.id)
        .then((plans) => {
          if (plans && plans.length > 0) {
            const latest = plans[0];
            if (!hasLocalBudget && latest.estimated_daily_cost) {
              const dailyBudget = Math.round(latest.estimated_daily_cost / (latest.trips_per_period || 2));
              if (dailyBudget > 0) {
                setInputBudget(dailyBudget);
                setAppliedBudget(dailyBudget);
                localStorage.setItem(localStorageBudgetKey, dailyBudget.toString());
              }
            }
          }
        })
        .catch(() => {});
    }
  }, [user, localStorageBudgetKey, localStorageDestKey, localStorageOrigKey]);

  useEffect(() => {
    if (origin && destination) {
      setLocationWarning(null);
      setIsCalculatingRoutes(true);
      planAndCompareRoutes(origin, destination)
        .then((comp) => {
          const newCandidates: BudgetRouteCandidate[] = [];
          if (comp.cheapest) {
            newCandidates.push({
              id: comp.cheapest.id,
              title: comp.cheapest.label || 'Rute Paling Hemat',
              totalCostIdr: comp.cheapest.totalCostIdr,
              totalDurationMins: Math.round(comp.cheapest.totalDurationS / 60),
              transfers: comp.cheapest.transfers,
              walkingDistanceM: Math.round(comp.cheapest.walkingDistanceM),
              modes: (comp.cheapest.modesUsed.map((m) => (m === 'walk' ? 'other' : m)) as IndonesiaTransportType[]),
              description: comp.cheapest.description,
              routeOptionRef: comp.cheapest,
            });
          }
          if (comp.efficient) {
            newCandidates.push({
              id: comp.efficient.id,
              title: comp.efficient.label || 'Rute Seimbang',
              totalCostIdr: comp.efficient.totalCostIdr,
              totalDurationMins: Math.round(comp.efficient.totalDurationS / 60),
              transfers: comp.efficient.transfers,
              walkingDistanceM: Math.round(comp.efficient.walkingDistanceM),
              modes: (comp.efficient.modesUsed.map((m) => (m === 'walk' ? 'other' : m)) as IndonesiaTransportType[]),
              description: comp.efficient.description,
              routeOptionRef: comp.efficient,
            });
          }
          if (comp.hurry) {
            newCandidates.push({
              id: comp.hurry.id,
              title: comp.hurry.label || 'Rute Lebih Cepat',
              totalCostIdr: comp.hurry.totalCostIdr,
              totalDurationMins: Math.round(comp.hurry.totalDurationS / 60),
              transfers: comp.hurry.transfers,
              walkingDistanceM: Math.round(comp.hurry.walkingDistanceM),
              modes: (comp.hurry.modesUsed.map((m) => (m === 'walk' ? 'other' : m)) as IndonesiaTransportType[]),
              description: comp.hurry.description,
              routeOptionRef: comp.hurry,
            });
          }
          if (newCandidates.length > 0) {
            setCalculatedCandidates(newCandidates);
          }
        })
        .catch(() => {})
        .finally(() => setIsCalculatingRoutes(false));
    }
  }, [origin, destination]);

  const evaluation = useMemo(() => {
    return evaluateBudgetOptions(appliedBudget, calculatedCandidates || CANDIDATE_JOURNEYS);
  }, [appliedBudget, calculatedCandidates]);

  const selectedCost = evaluation.balanced?.route.totalCostIdr || evaluation.cheapest?.route.totalCostIdr || appliedBudget;
  const projection = useMemo(() => {
    return calculateLongTermProjection(selectedCost);
  }, [selectedCost]);

  const persistBudgetState = async (val: number) => {
    setAppliedBudget(val);
    localStorage.setItem(localStorageBudgetKey, val.toString());
    window.dispatchEvent(new Event('rutein_budget_changed'));

    setJustApplied(true);
    setTimeout(() => setJustApplied(false), 2000);

    if (user) {
      setIsSavingSupabase(true);
      try {
        await createBudgetPlan({
          userId: user.id,
          name: `Budget (${destination ? destination.label : formatRupiah(val)})`,
          destinationLabel: destination?.label || 'Tujuan Komuter',
          destinationLat: destination?.lat || -6.2088,
          destinationLng: destination?.lng || 106.8456,
          originLabel: origin?.label,
          originLat: origin?.lat,
          originLng: origin?.lng,
          travelPeriod: 'daily',
          tripsPerPeriod: 2,
          preferredRouteType: 'balanced',
          calculation: {
            costPerTrip: selectedCost,
            dailyCost: selectedCost * 2,
            weeklyCost: selectedCost * 10,
            monthlyCost: selectedCost * 43.3,
          },
        });
      } catch (err) {
      } finally {
        setIsSavingSupabase(false);
      }
    }
  };

  const handleApply = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    persistBudgetState(inputBudget);
  };

  const handlePresetSelect = (val: number) => {
    setInputBudget(val);
    persistBudgetState(val);
  };

  const handleStepBudget = (delta: number) => {
    const nextVal = Math.max(0, inputBudget + delta);
    setInputBudget(nextVal);
  };

  const handleSelectDestination = (place: PlaceResult) => {
    setDestination(place);
    setIsEditingDestination(false);
    setLocationWarning(null);
  };

  const handleSelectSavedPlace = (place: SavedPlace) => {
    setDestination({
      lat: place.latitude,
      lng: place.longitude,
      label: place.name,
      address: place.address || place.name,
    });
    setIsEditingDestination(false);
    setLocationWarning(null);
  };

  const handleStartJourney = (result: BudgetEvaluationResult) => {
    if (!destination) {
      setLocationWarning('Pilih lokasi tujuan di atas terlebih dahulu untuk menghitung jarak nyata di Peta!');
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }

    if (origin && destination) {
      navigate('/routes', { state: { origin, destination, selectedCategory: result.category } });
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FCF4ED',
        color: '#1E1E1E',
        fontFamily: 'var(--font-body)',
        paddingTop: 32,
        paddingBottom: 80,
      }}
    >
      <div className="container" style={{ maxWidth: 780, paddingLeft: 20, paddingRight: 20, margin: '0 auto' }}>
        {/* --- HEADER --- */}
        <div className="rutein-slide-in" style={{ textAlign: 'center', marginBottom: 36 }}>
          <h1
            className="font-jockey"
            style={{
              fontSize: 'clamp(32px, 5vw, 44px)',
              color: '#1E1E1E',
              margin: '0 0 8px 0',
              lineHeight: 1.1,
              letterSpacing: '0.01em',
            }}
          >
            Budget <span style={{ color: '#DA362A' }}>Planner</span>
          </h1>
          <p
            style={{
              color: '#4A4A4A',
              fontSize: 'clamp(15px, 1.8vw, 17px)',
              margin: 0,
              fontWeight: 500,
              fontFamily: 'var(--font-inter)',
            }}
          >
            Perjalananmu, tetap sesuai budget.
          </p>
        </div>

        {/* --- SECTION 1: LOKASI PERJALANAN (ORIGIN & DESTINATION) --- */}
        <div
          className="rutein-slide-in-1"
          style={{
            marginBottom: 24,
            background: '#FFFFFF',
            border: locationWarning ? '2px solid #DA362A' : '1.5px solid #E5D5C5',
            borderRadius: 20,
            padding: '24px 28px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
            transition: 'border-color 0.2s ease',
            position: 'relative',
            zIndex: 30,
          }}
        >
          <h2
            className="font-jockey"
            style={{
              fontSize: 22,
              color: '#1E1E1E',
              margin: '0 0 16px 0',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Compass size={20} color="#DA362A" /> Lokasi Perjalanan
          </h2>

          {locationWarning && (
            <div
              className="rutein-alert-in"
              style={{
                background: '#FDF0ED',
                border: '1px solid #DA362A',
                color: '#DA362A',
                borderRadius: 12,
                padding: '10px 14px',
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <AlertCircle size={16} />
              {locationWarning}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Origin Input */}
            <div style={{ position: 'relative', zIndex: 25 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#666666', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Navigation2 size={13} color="#3B82F6" /> Asal
              </label>
              <PlaceSearchInput
                value={origin?.label}
                placeholder={isDetectingLocation ? 'Mendeteksi GPS Lokasi Terkini…' : 'Pilih Lokasi Asal'}
                onSelect={setOrigin}
              />
            </div>

            {/* Destination Input & Active Selected Pill */}
            <div style={{ position: 'relative', zIndex: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#666666', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <MapPin size={13} color="#DA362A" /> Tujuan
              </label>

              {destination && !isEditingDestination ? (
                <div
                  style={{
                    background: '#FDF0ED',
                    border: '1.5px solid #DA362A',
                    borderRadius: 14,
                    padding: '12px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: '#DA362A',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Check size={18} strokeWidth={3} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <strong style={{ fontSize: 15, color: '#1E1E1E', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {destination.label}
                      </strong>
                      <span style={{ fontSize: 12, color: '#666666', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {destination.address || 'Tujuan Terpilih'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsEditingDestination(true)}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E5D5C5',
                      color: '#DA362A',
                      borderRadius: 8,
                      padding: '6px 12px',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      flexShrink: 0,
                    }}
                  >
                    <Edit3 size={13} /> Ubah
                  </button>
                </div>
              ) : (
                <PlaceSearchInput
                  value={destination?.label}
                  placeholder="Pilih Tempat Tujuan (misal: Sudirman, Monas, atau Rumah)"
                  onSelect={handleSelectDestination}
                />
              )}
            </div>

            {/* Quick Destination Chips from Saved Places */}
            {savedPlaces.length > 0 && (
              <div style={{ marginTop: 4 }}>
                <span style={{ fontSize: 12, color: '#666666', display: 'block', marginBottom: 8, fontWeight: 500 }}>
                  Pilih Cepat Tujuan Tersimpan:
                </span>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {savedPlaces.map((place) => (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => handleSelectSavedPlace(place)}
                      style={{
                        padding: '6px 14px',
                        fontSize: 13,
                        borderRadius: 999,
                        background: destination?.label === place.name ? '#FDF0ED' : '#FFFFFF',
                        color: destination?.label === place.name ? '#DA362A' : '#1E1E1E',
                        border: destination?.label === place.name ? '1.5px solid #DA362A' : '1.5px solid #E5D5C5',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        fontWeight: 600,
                      }}
                    >
                      {categoryIcon(place.category)} {place.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* --- SECTION 2: BUDGET INPUT & ADJUSTMENT CARD --- */}
        <div
          className="rutein-slide-in-2"
          style={{
            marginBottom: 32,
            background: '#FFFFFF',
            border: '2px solid #DA362A',
            borderRadius: 20,
            padding: '28px 32px',
            boxShadow: '0 8px 24px rgba(218, 54, 42, 0.12)',
            position: 'relative',
            zIndex: 10,
          }}
        >
          <form onSubmit={handleApply}>
            <div style={{ marginBottom: 20 }}>
              <label
                className="font-jockey"
                style={{
                  fontSize: 20,
                  letterSpacing: '0.02em',
                  color: '#1E1E1E',
                  marginBottom: 10,
                  display: 'block',
                }}
              >
                Budget Perjalanan Hari Ini
              </label>

              {/* Main Interactive Budget Input Control */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#FDF0ED',
                    border: '1.5px solid #E5D5C5',
                    borderRadius: 14,
                    padding: '6px 16px',
                    flex: 1,
                    minWidth: 220,
                  }}
                >
                  <span
                    className="font-jockey"
                    style={{
                      fontSize: 26,
                      color: '#DA362A',
                      marginRight: 8,
                      userSelect: 'none',
                    }}
                  >
                    Rp
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={inputBudget === 0 ? '' : inputBudget}
                    onChange={(e) => setInputBudget(parseInt(e.target.value) || 0)}
                    placeholder="0"
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: '#1E1E1E',
                      fontFamily: 'var(--font-jockey)',
                      fontSize: 'clamp(28px, 4.5vw, 36px)',
                      fontWeight: 700,
                    }}
                  />
                </div>

                {/* Adjust +/- Buttons */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => handleStepBudget(-2500)}
                    title="Kurangi Rp2.500"
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: '#FFFFFF',
                      border: '1.5px solid #E5D5C5',
                      color: '#1E1E1E',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Minus size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStepBudget(2500)}
                    title="Tambah Rp2.500"
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: '#FFFFFF',
                      border: '1.5px solid #E5D5C5',
                      color: '#1E1E1E',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Preset Chips Row */}
            <div style={{ marginBottom: 26 }}>
              <span style={{ fontSize: 13, color: '#666666', display: 'block', marginBottom: 10, fontWeight: 500 }}>
                Pilihan Cepat Nominal:
              </span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {PRESET_BUDGETS.map((preset) => {
                  const isActive = inputBudget === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      className="font-jockey"
                      onClick={() => handlePresetSelect(preset)}
                      style={{
                        padding: '8px 18px',
                        fontSize: 16,
                        borderRadius: 999,
                        background: isActive ? '#DA362A' : '#FFFFFF',
                        color: isActive ? '#FFFFFF' : '#1E1E1E',
                        border: isActive ? '1.5px solid #DA362A' : '1.5px solid #E5D5C5',
                        cursor: 'pointer',
                        boxShadow: isActive ? '0 4px 12px rgba(218, 54, 42, 0.25)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {formatRupiah(preset)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Primary Action CTA Button */}
            <button
              type="submit"
              className="font-jockey"
              style={{
                width: '100%',
                padding: '15px 28px',
                fontSize: 20,
                letterSpacing: '0.02em',
                borderRadius: 12,
                background: '#DA362A',
                color: '#FFFFFF',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                boxShadow: '0 6px 20px rgba(218, 54, 42, 0.35)',
                transition: 'all 0.15s ease',
              }}
            >
              {justApplied ? (
                <>
                  <Check size={20} strokeWidth={3} />
                  Budget {formatRupiah(appliedBudget)} Diterapkan!
                </>
              ) : (
                <>
                  Terapkan Budget
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* --- SECTION 3: PROYEKSI BUDGET JANGKA PANJANG --- */}
        <div
          className="rutein-slide-in-3"
          style={{
            marginBottom: 32,
            background: '#FFFFFF',
            border: '1.5px solid #E5D5C5',
            borderRadius: 20,
            padding: '24px 28px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
            position: 'relative',
            zIndex: 5,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 className="font-jockey" style={{ fontSize: 20, color: '#1E1E1E', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={18} color="#DA362A" /> Proyeksi Pengeluaran Komuter
            </h2>
            <span style={{ fontSize: 12, color: '#666666' }}>Est. 2 Trip/Hari</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
            <StatBox label="Per Perjalanan" value={projection.formattedPerTrip} accent="#3B82F6" />
            <StatBox label="Estimasi Mingguan" value={projection.formattedWeekly} accent="#F5A623" />
            <StatBox label="Estimasi Bulanan" value={projection.formattedMonthly} accent="#DA362A" highlight />
          </div>
        </div>

        {/* --- SECTION 4: RESULTS SECTION (RUTEIN MENEMUKAN) --- */}
        <div className="rutein-slide-in-4" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
            <h2
              className="font-jockey"
              style={{
                fontSize: 28,
                color: '#1E1E1E',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              RUTEIN <span style={{ color: '#DA362A' }}>menemukan:</span>
            </h2>
            <div
              style={{
                background: '#FFFFFF',
                border: '1.5px solid #E5D5C5',
                borderRadius: 999,
                padding: '6px 16px',
                fontSize: 13,
                fontWeight: 600,
                color: '#4A4A4A',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>Budget Aktif:</span>
              <strong style={{ color: '#DA362A' }}>{formatRupiah(appliedBudget)}</strong>
              {isSavingSupabase && <span style={{ fontSize: 11, color: '#999' }}>(Syncing…)</span>}
            </div>
          </div>

          {isCalculatingRoutes && (
            <p style={{ color: '#666666', textAlign: 'center', padding: 20 }}>
              Menghitung rute terbaik dari {origin?.label} ke {destination?.label}…
            </p>
          )}

          {/* Insufficient Budget Empty State */}
          {!evaluation.hasInBudgetOptions ? (
            <div
              className="rutein-alert-in"
              style={{
                textAlign: 'center',
                padding: '40px 24px',
                background: '#FFFFFF',
                border: '1.5px dashed #E5D5C5',
                borderRadius: 20,
                boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
              }}
            >
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  background: '#FFF8ED',
                  border: '1.5px solid #E5A020',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 14,
                  color: '#D97706',
                }}
              >
                <AlertCircle size={24} />
              </div>
              <h3 className="font-jockey" style={{ fontSize: 22, color: '#1E1E1E', margin: '0 0 8px 0' }}>
                Budget Belum Mencukupi
              </h3>
              <p style={{ color: '#666666', fontSize: 14, maxWidth: 460, margin: '0 auto 20px', fontFamily: 'var(--font-inter)', lineHeight: 1.6 }}>
                Nominal {formatRupiah(appliedBudget)} berada di bawah tarif minimum transportasi publik (minimal Rp3.500). Coba tingkatkan budget perjalanan Anda.
              </p>
              <button
                type="button"
                className="font-jockey"
                onClick={() => handlePresetSelect(10000)}
                style={{
                  background: '#FFFFFF',
                  border: '1.5px solid #DA362A',
                  color: '#DA362A',
                  borderRadius: 999,
                  padding: '10px 24px',
                  fontSize: 16,
                  cursor: 'pointer',
                }}
              >
                Set Budget Rp10.000
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {evaluation.cheapest && (
                <RecommendationCard item={evaluation.cheapest} icon={PiggyBank} onStartJourney={() => handleStartJourney(evaluation.cheapest!)} />
              )}
              {evaluation.balanced && (
                <RecommendationCard item={evaluation.balanced} icon={Scale} onStartJourney={() => handleStartJourney(evaluation.balanced!)} />
              )}
              {evaluation.fastest && (
                <RecommendationCard item={evaluation.fastest} icon={Zap} onStartJourney={() => handleStartJourney(evaluation.fastest!)} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, accent, highlight = false }: { label: string; value: string; accent: string; highlight?: boolean }) {
  return (
    <div
      style={{
        background: highlight ? '#FDF0ED' : '#FFFFFF',
        border: highlight ? `1.5px solid ${accent}` : '1.5px solid #E5D5C5',
        borderRadius: 14,
        padding: '14px 18px',
      }}
    >
      <div style={{ fontSize: 12, color: '#666666', fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <div className="font-jockey" style={{ fontSize: 22, color: accent }}>
        {value}
      </div>
    </div>
  );
}

function categoryIcon(category: string) {
  switch (category) {
    case 'home':
      return <Home size={13} color="#DA362A" />;
    case 'workplace':
      return <Briefcase size={13} color="#3B82F6" />;
    case 'school':
      return <GraduationCap size={13} color="#F5A623" />;
    default:
      return <MapPin size={13} color="#666666" />;
  }
}

interface CardProps {
  item: BudgetEvaluationResult;
  icon: React.ElementType;
  onStartJourney: () => void;
}

function RecommendationCard({ item, icon: CategoryIcon, onStartJourney }: CardProps) {
  const { route, isOverBudget, categoryTitle, costFormatted, durationFormatted } = item;

  return (
    <div
      className="rutein-scale-in"
      style={{
        background: '#FFFFFF',
        border: isOverBudget ? '2px solid #E5A020' : '1.5px solid #E5D5C5',
        borderRadius: 20,
        padding: '24px 28px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
        transition: 'all 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        {/* Title, Badge & Meta */}
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
            <span
              className="font-jockey"
              style={{
                fontSize: 24,
                color: '#1E1E1E',
                letterSpacing: '0.01em',
              }}
            >
              {categoryTitle}
            </span>

            {/* Category Tag */}
            <span
              style={{
                background: '#FDF0ED',
                color: '#DA362A',
                border: '1.5px solid rgba(218, 54, 42, 0.3)',
                padding: '4px 12px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                fontFamily: 'var(--font-inter)',
              }}
            >
              <CategoryIcon size={13} style={{ marginRight: 4 }} />
              {categoryTitle}
            </span>

            {/* Over Budget Warning Tag */}
            {isOverBudget && (
              <span
                style={{
                  background: '#FFF8ED',
                  color: '#D97706',
                  border: '1.5px solid #E5A020',
                  padding: '4px 12px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  fontFamily: 'var(--font-inter)',
                }}
              >
                <Info size={12} style={{ marginRight: 4 }} />
                Melebihi budget
              </span>
            )}
          </div>

          {/* Price & Duration */}
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: isOverBudget ? '#D97706' : '#DA362A',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 10,
              fontFamily: 'var(--font-inter)',
            }}
          >
            <span>{costFormatted}</span>
            <span style={{ color: '#E5D5C5', fontWeight: 400 }}>·</span>
            <span style={{ color: '#1E1E1E', fontWeight: 700 }}>{durationFormatted}</span>
          </div>

          {/* Details */}
          <div style={{ fontSize: 13, color: '#666666', display: 'flex', gap: 14, flexWrap: 'wrap', fontFamily: 'var(--font-inter)' }}>
            <span>⇄ {route.transfers} transit</span>
            <span>🚶 ~{route.walkingDistanceM}m jalan kaki</span>
          </div>
        </div>

        {/* Transport Mode Sequence Icons & Action Button */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {route.modes.map((mode, idx) => {
              const IconComp = transportIcons[mode] || MapPin;
              return (
                <React.Fragment key={idx}>
                  <div
                    title={mode}
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      background: '#FFFFFF',
                      border: '1.5px solid #E5D5C5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#4A4A4A',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                    }}
                  >
                    <IconComp size={19} />
                  </div>
                  {idx < route.modes.length - 1 && (
                    <span style={{ color: '#999999', fontSize: 14, fontWeight: 700 }}>+</span>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* CTA Action Button to Map */}
          <button
            type="button"
            onClick={onStartJourney}
            className="font-jockey"
            style={{
              padding: '8px 18px',
              fontSize: 15,
              borderRadius: 999,
              background: '#DA362A',
              color: '#FFFFFF',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 4px 12px rgba(218, 54, 42, 0.25)',
              transition: 'transform 0.15s ease',
            }}
          >
            Mulai Perjalanan <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}