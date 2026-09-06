// Profile page — same design as the auth/onboarding flow.
//
//  - Same design tokens (C), fonts, card shapes, and chip styling as
//    the auth screens.
//  - The "Profil perjalanan" section is completely removed; travel profile type
//    is updated exclusively via the hover-and-click interaction on the profile avatar.
//  - Full name is the only ordinary text input field.
//  - Avatar/Profile picture handling: Hovering over the avatar circle reveals
//    a red overlay with a change icon. Clicking it opens a modal to select
//    between the three predefined profile options.
//  - Transport preferences can be added or removed directly here using interactive chips/modal.
//  - Saved places can be added, viewed, and removed directly here using a modal
//    with a name field, category picker, address search, and optional notes.
//  - Every modal opens and closes with a matching fade/scale animation — the modal
//    stays mounted for the short exit transition instead of disappearing instantly.

import React, { useEffect, useState } from 'react';
import { Home, GraduationCap, Briefcase, MapPin, Trash2, X, LucideIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import PlaceSearchInput from '@/components/PlaceSearchInput';
import { getProfile, updateProfile, getPreferences, upsertPreferences } from '@/services/preferencesService';
import { listSavedPlaces, createSavedPlace, deleteSavedPlace } from '@/services/savedPlacesService';
import { listBudgetPlans } from '@/services/budgetService';
import { TRANSPORT_TYPE_COLOR } from '@/components/transportMarkerIcon';
import type { OnboardingTransportType, OnboardingProfileType } from '@/services/onboardingService';
import type {
  Profile as ProfileType,
  SavedPlace,
  BudgetPlan,
  UserPreferences,
  PlaceCategory,
} from '@/types/database.types';
import type { PlaceResult } from '@/types/domain.types';

import profileSchoolSvg from '@/assets/images/profile-school.svg';
import profileTravelSvg from '@/assets/images/profile-travel.svg';
import profileWorkSvg from '@/assets/images/profile-work.svg';

// ============================================================
// Shared design tokens — copied verbatim from the auth page so
// this screen reads as a continuation of the same brand, not a
// different app.
// ============================================================
const C = {
  bg: '#FCF4ED',
  surface: '#FFFDF9',
  border: '#B7A897',
  text: '#1E1E1E',
  textMuted: '#7A6F62',
  primary: '#DA362A',
  primaryHover: '#C22B20',
};

const bodyFont: React.CSSProperties = { fontFamily: "'Aileron', sans-serif" };

const sharedStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Aileron:wght@400;600;700&display=swap');

  @keyframes profileFadeDown { from { opacity: 0; transform: translateY(-16px); } to { opacity: 1; transform: translateY(0); } }
  .profile-fade { opacity: 0; animation: profileFadeDown 0.5s ease forwards; }

  .profile-input::placeholder { color: #9A9A9A; }
  .profile-input:focus { outline: none; border-color: ${C.primary}; }

  .avatar-container { position: relative; cursor: pointer; }
  .avatar-overlay {
    position: absolute;
    inset: 0;
    background: rgba(218, 54, 42, 0.85);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  .avatar-container:hover .avatar-overlay { opacity: 1; }

  /* Modal open/close animations. Both directions are driven inline per
     modal (via isXModalClosing) so a modal can play its exit transition
     before it actually unmounts, instead of vanishing instantly. */
  @keyframes modalBackdropIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes modalBackdropOut { from { opacity: 1; } to { opacity: 0; } }
  @keyframes modalContentIn {
    from { opacity: 0; transform: translateY(-16px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes modalContentOut {
    from { opacity: 1; transform: translateY(0) scale(1); }
    to { opacity: 0; transform: translateY(-10px) scale(0.97); }
  }

  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(30, 30, 30, 0.4);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
  }

  .modal-content {
    background: ${C.surface};
    border: 1.5px solid ${C.border};
    border-radius: 24px;
    padding: 28px;
    width: 100%;
    max-width: 420px;
    box-sizing: border-box;
  }

  .transport-chip-interactive {
    transition: all 0.15s ease;
    cursor: pointer;
  }
  .transport-chip-interactive:hover {
    opacity: 0.85;
    transform: translateY(-1px);
  }

  .delete-place-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px;
    border-radius: 10px;
    color: ${C.textMuted};
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background-color 0.15s ease, color 0.15s ease;
  }
  .delete-place-btn:hover {
    background: rgba(218, 54, 42, 0.10);
    color: ${C.primary};
  }

  .modal-close-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    border-radius: 8px;
    color: ${C.textMuted};
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.15s ease, color 0.15s ease;
  }
  .modal-close-btn:hover {
    background: rgba(122, 111, 98, 0.10);
    color: ${C.text};
  }

  @media (max-width: 480px) {
    .profile-stats { grid-template-columns: repeat(2, 1fr) !important; }
  }
`;

const PROFILES: { value: OnboardingProfileType; label: string; sub: string; icon: string }[] = [
  { value: 'school', label: 'Pelajar', sub: 'Berangkat ke sekolah/kampus', icon: profileSchoolSvg },
  { value: 'travel', label: 'Penjelajah', sub: 'Suka jalan-jalan & eksplorasi', icon: profileTravelSvg },
  { value: 'work', label: 'Pekerja', sub: 'Commuting ke kantor', icon: profileWorkSvg },
];

const TRANSPORT_LABELS: Record<OnboardingTransportType, string> = {
  transjakarta: 'TransJakarta',
  bus: 'Bus Kota',
  krl: 'KRL Commuter',
  mrt: 'MRT',
  lrt: 'LRT',
  train: 'Kereta Antarkota',
  airport_rail: 'Kereta Bandara',
  ferry: 'Kapal Feri',
  terminal: 'Terminal Bus',
};

const ALL_TRANSPORTS: OnboardingTransportType[] = [
  'transjakarta',
  'bus',
  'krl',
  'mrt',
  'lrt',
  'train',
  'airport_rail',
  'ferry',
  'terminal',
];

const PLACE_CATEGORIES: {
  value: PlaceCategory;
  label: string;
  icon: LucideIcon;
}[] = [
  { value: 'home', label: 'Rumah', icon: Home },
  { value: 'school', label: 'Sekolah', icon: GraduationCap },
  { value: 'workplace', label: 'Kantor', icon: Briefcase },
  { value: 'custom', label: 'Lainnya', icon: MapPin },
];

const cardStyle: React.CSSProperties = {
  background: C.surface,
  border: `1.5px solid ${C.border}`,
  borderRadius: 22,
  padding: 24,
  boxSizing: 'border-box',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '14px 20px',
  borderRadius: 999,
  border: `1.5px solid ${C.border}`,
  background: C.surface,
  color: C.text,
  fontSize: 15,
  fontFamily: "'Aileron', sans-serif",
};

const buttonStyle: React.CSSProperties = {
  padding: '14px 32px',
  borderRadius: 16,
  border: 'none',
  background: C.primary,
  color: '#FFFFFF',
  fontSize: 15,
  fontWeight: 700,
  letterSpacing: '0.02em',
  cursor: 'pointer',
  transition: 'background-color 0.15s ease',
};

const sectionLabelStyle: React.CSSProperties = {
  ...bodyFont,
  fontSize: 12,
  fontWeight: 600,
  color: C.textMuted,
  marginBottom: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.03em',
};

const avatarCircleStyle: React.CSSProperties = {
  width: 64,
  height: 64,
  borderRadius: '50%',
  background: 'rgba(218,54,42,0.08)',
  border: `1.5px solid ${C.border}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  flexShrink: 0,
};

const MODAL_EXIT_MS = 200;

// Plays a modal's exit animation, then unmounts it once the animation
// has actually finished — used by every modal on this page.
function closeWithAnimation(setClosing: (v: boolean) => void, setOpen: (v: boolean) => void) {
  setClosing(true);
  window.setTimeout(() => {
    setOpen(false);
    setClosing(false);
  }, MODAL_EXIT_MS);
}

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [places, setPlaces] = useState<SavedPlace[]>([]);
  const [plans, setPlans] = useState<BudgetPlan[]>([]);
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Modal open state + a matching "closing" flag per modal, so the exit
  // animation can play before the modal unmounts.
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isAvatarModalClosing, setIsAvatarModalClosing] = useState(false);
  const [isTransportModalOpen, setIsTransportModalOpen] = useState(false);
  const [isTransportModalClosing, setIsTransportModalClosing] = useState(false);
  const [isPlaceModalOpen, setIsPlaceModalOpen] = useState(false);
  const [isPlaceModalClosing, setIsPlaceModalClosing] = useState(false);

  // Add-a-saved-place form state.
  const [placeName, setPlaceName] = useState('');
  const [placeCategory, setPlaceCategory] = useState<PlaceCategory>('custom');
  const [placeNotes, setPlaceNotes] = useState('');
  const [pickedPlace, setPickedPlace] = useState<PlaceResult | null>(null);
  const [savingPlace, setSavingPlace] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let isMounted = true;
    (async () => {
      try {
        const [p, prefs, savedPlaces, budgetPlans] = await Promise.all([
          getProfile(user.id).catch(() => null),
          getPreferences(user.id).catch(() => null),
          listSavedPlaces(user.id).catch(() => []),
          listBudgetPlans(user.id).catch(() => []),
        ]);
        if (!isMounted) return;
        if (p) {
          setProfile(p);
          setFullName(p.full_name ?? user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? '');
          setAvatarUrl(p.avatar_url ?? '');
        } else {
          setFullName(user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? '');
        }
        setPreferences(prefs);
        setPlaces(savedPlaces || []);
        setPlans(budgetPlans || []);
      } catch {
        // Fallback
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [user]);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    setSaved(false);
    try {
      const updated = await updateProfile(user.id, { full_name: fullName, avatar_url: avatarUrl || null });
      setProfile(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function handleSelectProfileChoice(profileType: OnboardingProfileType, iconPath: string) {
    if (!user) return;
    setAvatarUrl(iconPath);
    closeWithAnimation(setIsAvatarModalClosing, setIsAvatarModalOpen);
    try {
      const [updatedProfile, updatedPrefs] = await Promise.all([
        updateProfile(user.id, { full_name: fullName, avatar_url: iconPath }),
        upsertPreferences(user.id, { profile_type: profileType }),
      ]);
      setProfile(updatedProfile);
      setPreferences(updatedPrefs);
    } catch (err) {
      console.error('Failed to update profile choice', err);
    }
  }

  async function handleToggleTransport(t: OnboardingTransportType) {
    if (!user) return;
    const currentList = (preferences?.preferred_transport ?? []) as OnboardingTransportType[];
    const newList = currentList.includes(t)
      ? currentList.filter((item) => item !== t)
      : [...currentList, t];

    try {
      const updatedPrefs = await upsertPreferences(user.id, { preferred_transport: newList as any });
      setPreferences(updatedPrefs);
    } catch (err) {
      console.error('Failed to update transport preferences', err);
    }
  }

  async function refreshPlaces() {
    if (!user) return;
    try {
      const data = await listSavedPlaces(user.id);
      setPlaces(data || []);
    } catch (err) {
      console.error('Failed to refresh saved places', err);
    }
  }

  function openPlaceModal() {
    setPlaceError(null);
    setIsPlaceModalOpen(true);
  }

  function closePlaceModal() {
    closeWithAnimation(setIsPlaceModalClosing, setIsPlaceModalOpen);
  }

  async function handleCreatePlace() {
    if (!user) return;
    if (!placeName.trim() || !pickedPlace) {
      setPlaceError('Beri nama dan pilih lokasi terlebih dahulu.');
      return;
    }
    setSavingPlace(true);
    setPlaceError(null);
    try {
      await createSavedPlace({
        userId: user.id,
        name: placeName.trim(),
        category: placeCategory,
        address: pickedPlace.address,
        latitude: pickedPlace.lat,
        longitude: pickedPlace.lng,
        notes: placeNotes.trim() || undefined,
      });
      setPlaceName('');
      setPlaceNotes('');
      setPickedPlace(null);
      setPlaceCategory('custom');
      await refreshPlaces();
      closePlaceModal();
    } catch (err) {
      setPlaceError(err instanceof Error ? err.message : 'Gagal menyimpan tempat.');
    } finally {
      setSavingPlace(false);
    }
  }

  async function handleDeletePlace(id: string) {
    try {
      await deleteSavedPlace(id);
      setPlaces((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Failed to delete saved place', err);
    }
  }

  const transportList = (preferences?.preferred_transport ?? []) as OnboardingTransportType[];

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{sharedStyles}</style>
        <p style={{ ...bodyFont, color: C.textMuted, fontSize: 14 }}>Memuat…</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, padding: 'clamp(16px, 6vw, 40px) 20px', boxSizing: 'border-box' }}>
      <style>{sharedStyles}</style>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <h1
          className="font-jockey profile-fade"
          style={{ fontSize: 'clamp(28px, 7vw, 40px)', margin: '0 0 24px', color: C.text, animationDelay: '0ms' }}
        >
          Profil Pengguna
        </h1>

        {/* Identity with Hover-to-Change Avatar */}
        <div
          className="profile-fade"
          style={{ ...cardStyle, marginBottom: 20, display: 'flex', gap: 16, alignItems: 'center', animationDelay: '60ms' }}
        >
          <div
            className="avatar-container"
            style={avatarCircleStyle}
            onClick={() => setIsAvatarModalOpen(true)}
            title="Klik untuk mengganti profil"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 8 }} />
            ) : (
              <span style={{ fontSize: 24, ...bodyFont, fontWeight: 700, color: C.primary }}>
                {(fullName || profile?.email || '?').charAt(0).toUpperCase()}
              </span>
            )}
            <div className="avatar-overlay">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </div>
          </div>
          <div>
            <div className="font-jockey" style={{ fontSize: 18, color: C.text }}>{fullName || 'Unnamed traveler'}</div>
            <div style={{ ...bodyFont, fontSize: 13, color: C.textMuted }}>{profile?.email}</div>
          </div>
        </div>

        {/* Transport preferences — editable chips */}
        <div className="profile-fade" style={{ marginBottom: 20, animationDelay: '180ms' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ ...sectionLabelStyle, marginBottom: 0 }}>Moda transportasi favorit</div>
            <button
              type="button"
              onClick={() => setIsTransportModalOpen(true)}
              style={{ background: 'none', border: 'none', color: C.primary, fontSize: 13, fontWeight: 600, ...bodyFont, cursor: 'pointer', padding: 0 }}
            >
              Ubah Moda +
            </button>
          </div>
          {transportList.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {transportList.map((t) => (
                <span
                  key={t}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 18px',
                    borderRadius: 999,
                    fontSize: 14,
                    fontWeight: 600,
                    ...bodyFont,
                    border: `1.5px solid ${C.primary}`,
                    background: 'rgba(218,54,42,0.10)',
                    color: C.primary,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: TRANSPORT_TYPE_COLOR[t] ?? C.primary,
                      display: 'inline-block',
                    }}
                  />
                  {TRANSPORT_LABELS[t] ?? t}
                </span>
              ))}
            </div>
          ) : (
            <div style={{ ...cardStyle, ...bodyFont, fontSize: 13, color: C.textMuted }}>
              Belum ada moda transportasi yang dipilih. Klik "Ubah Moda +" untuk menambahkan.
            </div>
          )}
        </div>

        {/* Saved places — add/manage directly here */}
        <div className="profile-fade" style={{ marginBottom: 20, animationDelay: '240ms' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ ...sectionLabelStyle, marginBottom: 0 }}>Tempat tersimpan</div>
            <button
              type="button"
              onClick={openPlaceModal}
              style={{ background: 'none', border: 'none', color: C.primary, fontSize: 13, fontWeight: 600, ...bodyFont, cursor: 'pointer', padding: 0 }}
            >
              Tambah Tempat +
            </button>
          </div>
          {places.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {places.map((p) => {
                const meta = PLACE_CATEGORIES.find((c) => c.value === p.category) ?? PLACE_CATEGORIES[3];
                const Icon = meta.icon;
                return (
                  <div
                    key={p.id}
                    style={{ ...cardStyle, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        background: 'rgba(218,54,42,0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={18} color={C.primary} strokeWidth={2} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="font-jockey" style={{ fontSize: 15, color: C.text }}>{p.name}</div>
                      <div
                        style={{
                          ...bodyFont,
                          fontSize: 12,
                          color: C.textMuted,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {p.address}
                      </div>
                      {p.notes && (
                        <div style={{ ...bodyFont, fontSize: 11, color: C.textMuted, marginTop: 2 }}>{p.notes}</div>
                      )}
                    </div>
                    <button
                      type="button"
                      className="delete-place-btn"
                      onClick={() => handleDeletePlace(p.id)}
                      title="Hapus tempat"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ ...cardStyle, ...bodyFont, fontSize: 13, color: C.textMuted }}>
              Belum ada tempat yang disimpan. Klik "Tambah Tempat +" untuk menambahkan.
            </div>
          )}
        </div>

        {/* Editable fields (Name only) */}
        <div
          className="profile-fade"
          style={{ ...cardStyle, marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 14, animationDelay: '300ms' }}
        >
          <div>
            <label style={{ ...bodyFont, fontSize: 13, color: C.textMuted, display: 'block', marginBottom: 6 }}>
              Nama lengkap
            </label>
            <input
              className="profile-input"
              style={inputStyle}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="font-jockey"
            onClick={handleSave}
            disabled={saving}
            style={{ ...buttonStyle, alignSelf: 'flex-start', opacity: saving ? 0.7 : 1 }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = C.primaryHover)}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = C.primary)}
          >
            {saving ? 'Menyimpan…' : saved ? 'Tersimpan ✓' : 'Simpan profil'}
          </button>
        </div>

        {/* Stats */}
        <div
          className="profile-fade profile-stats"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, animationDelay: '360ms' }}
        >
          <div style={{ ...cardStyle, textAlign: 'center' }}>
            <div className="font-jockey" style={{ fontSize: 24, color: C.text }}>{places.length}</div>
            <div style={{ ...bodyFont, fontSize: 12, color: C.textMuted }}>Tempat tersimpan</div>
          </div>
          <div style={{ ...cardStyle, textAlign: 'center' }}>
            <div className="font-jockey" style={{ fontSize: 24, color: C.text }}>{plans.length}</div>
            <div style={{ ...bodyFont, fontSize: 12, color: C.textMuted }}>Rencana anggaran</div>
          </div>
        </div>
      </div>

      {/* Avatar & Travel Profile Selection Modal */}
      {(isAvatarModalOpen || isAvatarModalClosing) && (
        <div
          className="modal-backdrop"
          style={{ animation: `${isAvatarModalClosing ? 'modalBackdropOut' : 'modalBackdropIn'} 0.2s ease forwards` }}
          onClick={() => closeWithAnimation(setIsAvatarModalClosing, setIsAvatarModalOpen)}
        >
          <div
            className="modal-content"
            style={{ animation: `${isAvatarModalClosing ? 'modalContentOut 0.2s' : 'modalContentIn 0.25s'} ease forwards` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="font-jockey" style={{ fontSize: 20, color: C.text, marginBottom: 6 }}>
              Pilih Profil Perjalanan
            </div>
            <p style={{ ...bodyFont, fontSize: 13, color: C.textMuted, margin: '0 0 20px' }}>
              Pilih jenis profil perjalanan Anda untuk memperbarui ikon dan preferensi Anda.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {PROFILES.map((p) => {
                const isSelected = preferences?.profile_type === p.value;
                return (
                  <div
                    key={p.value}
                    onClick={() => handleSelectProfileChoice(p.value, p.icon)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '12px 16px',
                      borderRadius: 16,
                      border: `1.5px solid ${isSelected ? C.primary : C.border}`,
                      background: isSelected ? 'rgba(218,54,42,0.06)' : C.surface,
                      cursor: 'pointer',
                      transition: 'background 0.15s ease, border-color 0.15s ease',
                    }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(218,54,42,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8, flexShrink: 0 }}>
                      <img src={p.icon} alt={p.label} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <div>
                      <div className="font-jockey" style={{ fontSize: 15, color: C.text }}>{p.label}</div>
                      <div style={{ ...bodyFont, fontSize: 11, color: C.textMuted }}>{p.sub}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              className="font-jockey"
              onClick={() => closeWithAnimation(setIsAvatarModalClosing, setIsAvatarModalOpen)}
              style={{ width: '100%', ...buttonStyle, background: 'transparent', color: C.textMuted, border: `1.5px solid ${C.border}` }}
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Transport Selection Modal */}
      {(isTransportModalOpen || isTransportModalClosing) && (
        <div
          className="modal-backdrop"
          style={{ animation: `${isTransportModalClosing ? 'modalBackdropOut' : 'modalBackdropIn'} 0.2s ease forwards` }}
          onClick={() => closeWithAnimation(setIsTransportModalClosing, setIsTransportModalOpen)}
        >
          <div
            className="modal-content"
            style={{ animation: `${isTransportModalClosing ? 'modalContentOut 0.2s' : 'modalContentIn 0.25s'} ease forwards` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="font-jockey" style={{ fontSize: 23, color: C.text, marginBottom: 6 }}>
              Atur Moda Transportasi
            </div>
            <p style={{ ...bodyFont, fontSize: 13, color: C.textMuted, margin: '0 0 24px' }}>
              Klik moda transportasi untuk menambah atau menghapusnya dari preferensi Anda.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
              {ALL_TRANSPORTS.map((t) => {
                const isSelected = transportList.includes(t);
                return (
                  <span
                    key={t}
                    className="transport-chip-interactive"
                    onClick={() => handleToggleTransport(t)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 16px',
                      borderRadius: 999,
                      fontSize: 13,
                      fontWeight: 600,
                      ...bodyFont,
                      border: `1.5px solid ${isSelected ? C.primary : C.border}`,
                      background: isSelected ? 'rgba(218,54,42,0.10)' : C.surface,
                      color: isSelected ? C.primary : C.textMuted,
                      userSelect: 'none',
                    }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: isSelected ? (TRANSPORT_TYPE_COLOR[t] ?? C.primary) : C.border,
                        display: 'inline-block',
                      }}
                    />
                    {TRANSPORT_LABELS[t] ?? t}
                  </span>
                );
              })}
            </div>
            <button
              type="button"
              className="font-jockey"
              onClick={() => closeWithAnimation(setIsTransportModalClosing, setIsTransportModalOpen)}
              style={{ width: '100%', ...buttonStyle }}
            >
              Selesai
            </button>
          </div>
        </div>
      )}

      {/* Add Saved Place Modal */}
      {(isPlaceModalOpen || isPlaceModalClosing) && (
        <div
          className="modal-backdrop"
          style={{ animation: `${isPlaceModalClosing ? 'modalBackdropOut' : 'modalBackdropIn'} 0.2s ease forwards` }}
          onClick={closePlaceModal}
        >
          <div
            className="modal-content"
            style={{
              animation: `${isPlaceModalClosing ? 'modalContentOut 0.2s' : 'modalContentIn 0.25s'} ease forwards`,
              maxWidth: 460,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <div className="font-jockey" style={{ fontSize: 23, color: C.text }}>Tambah Tempat</div>
              <button type="button" className="modal-close-btn" onClick={closePlaceModal} title="Tutup">
                <X size={20} />
              </button>
            </div>
            <p style={{ ...bodyFont, fontSize: 13, color: C.textMuted, margin: '0 0 20px' }}>
              Simpan lokasi yang sering Anda kunjungi agar mudah.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ ...bodyFont, fontSize: 13, color: C.textMuted, display: 'block', marginBottom: 6 }}>
                  Nama tempat
                </label>
                <input
                  className="profile-input"
                  style={inputStyle}
                  value={placeName}
                  onChange={(e) => setPlaceName(e.target.value)}
                  placeholder="mis. Rumah, Kantor"
                />
              </div>

              <div>
                <label style={{ ...bodyFont, fontSize: 13, color: C.textMuted, display: 'block', marginBottom: 6 }}>
                  Kategori
                </label>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {PLACE_CATEGORIES.map((c) => {
                    const Icon = c.icon;
                    const isSelected = placeCategory === c.value;
                    return (
                      <button
                        key={c.value}
                        type="button"
                        className="transport-chip-interactive"
                        onClick={() => setPlaceCategory(c.value)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 7,
                          padding: '9px 14px',
                          marginTop: 5,
                          borderRadius: 999,
                          fontSize: 13,
                          fontWeight: 600,
                          ...bodyFont,
                          border: `1.5px solid ${isSelected ? C.primary : C.border}`,
                          background: isSelected ? 'rgba(218,54,42,0.10)' : C.surface,
                          color: isSelected ? C.primary : C.textMuted,
                        }}
                      >
                        <Icon size={14} />
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ ...bodyFont, fontSize: 13, color: C.textMuted, display: 'block', marginBottom: 6 }}>
                  Lokasi
                </label>
                <PlaceSearchInput placeholder="Cari alamat…" onSelect={setPickedPlace} />
                {pickedPlace && (
                  <div style={{ ...bodyFont, fontSize: 12, color: C.textMuted, marginTop: 6 }}>
                    {pickedPlace.address}
                  </div>
                )}
              </div>

              <div>
                <label style={{ ...bodyFont, fontSize: 13, color: C.textMuted, display: 'block', marginBottom: 6 }}>
                  Catatan (opsional)
                </label>
                <input
                  className="profile-input"
                  style={inputStyle}
                  value={placeNotes}
                  onChange={(e) => setPlaceNotes(e.target.value)}
                  placeholder="mis. Kode gerbang, pintu masuk"
                />
              </div>

              {placeError && (
                <p style={{ ...bodyFont, fontSize: 13, color: C.primary, margin: 0 }}>{placeError}</p>
              )}

              <button
                type="button"
                className="font-jockey"
                onClick={handleCreatePlace}
                disabled={savingPlace}
                style={{ ...buttonStyle, opacity: savingPlace ? 0.7 : 1, marginTop: 6 }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = C.primaryHover)}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = C.primary)}
              >
                {savingPlace ? 'Menyimpan…' : 'Simpan Tempat'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}