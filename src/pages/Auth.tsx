import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Check, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  saveTransportPreference,
  saveProfileType,
  getOnboardingStatus,
  type OnboardingTransportType,
  type OnboardingProfileType,
} from '@/services/onboardingService';
import { TRANSPORT_TYPE_COLOR } from '@/components/transportMarkerIcon';

import authVideo from '@/assets/videos/auth.mov';
import rutinLogo from '@/assets/images/logo-rutein.svg';
import profileSchoolSvg from '@/assets/images/profile-school.svg';
import profileTravelSvg from '@/assets/images/profile-travel.svg';
import profileWorkSvg from '@/assets/images/profile-work.svg';
import relBawahSvg from '@/assets/images/rel-bawah.svg';

// ============================================================
// Shared design tokens — exact colors from the Rutein brand /
// landing page (cream background, red accent), used across
// Login, TransportPreference, and ProfileSelect so the whole
// auth + onboarding flow reads as one continuous experience.
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

  @keyframes authFadeDown {
    from { opacity: 0; transform: translateY(-16px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .auth-fade { opacity: 0; animation: authFadeDown 0.55s ease forwards; }

  @keyframes chipGrowIn {
    0% { opacity: 0; transform: scale(0.3) rotate(-8deg); }
    60% { opacity: 1; transform: scale(1.08) rotate(3deg); }
    100% { opacity: 1; transform: scale(1) rotate(0deg); }
  }
  .chip-grow { opacity: 0; animation: chipGrowIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }

  @keyframes profileFlyIn {
    0% { opacity: 0; transform: translateY(28px) scale(0.85); }
    60% { opacity: 1; transform: translateY(-4px) scale(1.03); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }
  .profile-fly-in { opacity: 0; animation: profileFlyIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }

  @keyframes profileIconBounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
  }
  .profile-icon-bounce { animation: profileIconBounce 1.1s ease-in-out infinite; }

  @keyframes alertPopIn {
    0% { opacity: 0; transform: translateY(-4px) scale(0.98); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }
  .auth-alert { animation: alertPopIn 0.22s ease-out forwards; }
  .auth-alert-info { animation: alertPopIn 0.22s ease-out forwards; }

  .auth-input::placeholder { color: #9A9A9A; }
  .auth-input:focus { outline: none; border-color: ${C.primary}; }

  .auth-logo-link {
    display: inline-flex;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    transition: transform 0.15s ease, opacity 0.15s ease;
  }
  .auth-logo-link:hover { transform: translateY(-2px); opacity: 0.85; }
  .auth-logo-link:focus-visible {
    outline: 2px solid ${C.primary};
    outline-offset: 4px;
    border-radius: 8px;
  }

  /* ---------------- Responsive Styles (Mobile, Tablet, Desktop) ---------------- */
  .auth-shell-root {
    position: relative;
    min-height: 100vh;
    width: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding: clamp(36px, 6vh, 60px) 24px clamp(30px, 4vh, 40px);
    box-sizing: border-box;
  }

  .auth-shell-inner {
    position: relative;
    z-index: 2;
    width: 100%;
    margin: auto 0;
    text-align: center;
    box-sizing: border-box;
  }

  .auth-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    width: 100%;
  }

  .chip-row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: center;
    width: 100%;
  }

  .transport-chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: clamp(9px, 2.2vw, 11px) clamp(14px, 3.5vw, 18px);
    border-radius: 999px;
    font-size: clamp(13px, 2.8vw, 14px);
    font-weight: 600;
    cursor: pointer;
    box-sizing: border-box;
    transition: transform 0.15s ease, background 0.15s ease, border-color 0.15s ease;
  }

  /* Desktop & Tablet: 3 columns grid that scales dynamically without wrapping */
  .profiles-container {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: clamp(12px, 2vw, 16px);
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
    box-sizing: border-box;
  }

  .profile-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    width: 100%;
    padding: clamp(18px, 3vh, 26px) clamp(8px, 1.5vw, 16px);
    border-radius: clamp(16px, 2.2vw, 22px);
    cursor: pointer;
    box-sizing: border-box;
    transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .profile-option-img {
    width: clamp(48px, 6.5vw, 68px);
    height: clamp(48px, 6.5vw, 68px);
    object-fit: contain;
    margin-bottom: 12px;
    flex-shrink: 0;
  }

  .profile-option-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .profile-option-info strong {
    font-size: clamp(16px, 2.2vw, 20px);
  }

  .profile-option-info span {
    font-size: clamp(11px, 1.4vw, 12px);
    margin-top: 4px;
  }

  .auth-mobile-rail {
    display: none !important;
  }

  /* ---------------- Tablet (541px - 1024px) ---------------- */
  @media (min-width: 541px) and (max-width: 1024px) {
    .auth-shell-root {
      padding-top: clamp(80px, 11vh, 100px) !important;
      padding-bottom: clamp(45px, 6vh, 65px) !important;
      padding-left: clamp(20px, 4vw, 36px) !important;
      padding-right: clamp(20px, 4vw, 36px) !important;
    }
    .profiles-container {
      max-width: 560px;
      gap: 12px;
    }
    .profile-option {
      padding: 20px 10px;
    }
    .profile-option-img {
      width: 54px;
      height: 54px;
      margin-bottom: 8px;
    }
  }

  /* ---------------- Mobile (<= 540px) ---------------- */
  @media (max-width: 540px) {
    .auth-shell-root {
      padding-top: clamp(88px, 13vh, 115px) !important;
      padding-bottom: clamp(55px, 8vh, 75px) !important;
      padding-left: 16px !important;
      padding-right: 16px !important;
    }

    .auth-mobile-rail {
      display: flex !important;
      justify-content: center;
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      overflow: hidden;
      pointer-events: none;
      line-height: 0;
      z-index: 1;
    }

    .auth-rail-img {
      width: 100%;
      min-width: 660px;
      height: clamp(28px, 4.5vh, 42px);
      object-fit: cover;
      object-position: center bottom;
      display: block;
    }

    .auth-actions {
      flex-direction: column-reverse !important;
      gap: 10px !important;
    }
    .auth-actions > button {
      width: 100% !important;
      min-width: 100% !important;
    }

    .chip-row {
      gap: 8px !important;
    }
    .transport-chip {
      padding: 8px 14px !important;
      font-size: 13px !important;
    }

    /* Stack cards as sleek horizontal rows on mobile */
    .profiles-container {
      grid-template-columns: 1fr !important;
      gap: 10px !important;
      max-width: 380px !important;
    }

    .profile-option {
      flex-direction: row !important;
      align-items: center !important;
      text-align: left !important;
      padding: 12px 16px !important;
      gap: 14px !important;
      border-radius: 16px !important;
    }

    .profile-option-img {
      width: 44px !important;
      height: 44px !important;
      margin-bottom: 0 !important;
    }

    .profile-option-info {
      align-items: flex-start !important;
      text-align: left !important;
      min-width: 0;
    }

    .profile-option-info strong {
      font-size: 17px !important;
    }

    .profile-option-info span {
      font-size: 12px !important;
      margin-top: 2px !important;
    }
  }

  @media (max-width: 380px) {
    .auth-input {
      padding: 13px 18px !important;
      font-size: 15px !important;
    }
    .profile-option {
      padding: 10px 14px !important;
      gap: 10px !important;
    }
    .profile-option-img {
      width: 40px !important;
      height: 40px !important;
    }
  }

  @media (max-width: 380px) {
    .auth-input {
      padding: 13px 18px !important;
      font-size: 15px !important;
    }
    .profile-option {
      padding: 10px 14px !important;
      gap: 10px !important;
    }
    .profile-option-img {
      width: 42px !important;
      height: 42px !important;
    }
  }
`;

/**
 * Background video used on every auth/onboarding screen.
 *
 * `frozen = false` (Login): the video autoplays once, no `loop`, so it
 * naturally settles on its final frame once playback finishes.
 *
 * `frozen = true` (TransportPreference / ProfileSelect): the video is
 * never played — as soon as its metadata loads we jump straight to the
 * last frame and pause, so it renders as a static "already finished"
 * backdrop the instant these screens mount, matching what the user sees
 * right after logging in / signing up.
 */
function AuthVideoBackground({ frozen = false }: { frozen?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !frozen) return;

    function freezeAtEnd() {
      if (!video) return;
      video.pause();
      video.currentTime = Math.max(0, video.duration - 0.05);
    }

    if (video.readyState >= 1) {
      freezeAtEnd();
    } else {
      video.addEventListener('loadedmetadata', freezeAtEnd, { once: true });
      return () => video.removeEventListener('loadedmetadata', freezeAtEnd);
    }
  }, [frozen]);

  return (
    <video
      ref={videoRef}
      className="auth-bg-video"
      src={authVideo}
      autoPlay={!frozen}
      muted
      playsInline
      preload="auto"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        zIndex: 0,
      }}
    />
  );
}

/**
 * Clean mobile bottom rail:
 * Rendered strictly on mobile phones (<= 540px) to balance the top rail
 * cleanly without cluttering the screen.
 */
function AuthMobileRail() {
  return (
    <div className="auth-mobile-rail" aria-hidden="true">
      <img src={relBawahSvg} alt="" className="auth-rail-img" />
    </div>
  );
}

function AuthShell({
  children,
  maxWidth = 420,
  frozenVideo = false,
}: {
  children: React.ReactNode;
  maxWidth?: number;
  frozenVideo?: boolean;
}) {
  return (
    <div className="auth-shell-root">
      <style>{sharedStyles}</style>
      <AuthVideoBackground frozen={frozenVideo} />
      <AuthMobileRail />
      <div className="auth-shell-inner" style={{ maxWidth }}>
        {children}
      </div>
    </div>
  );
}

/** Small centered loading state shown while we check onboarding status,
 * so the onboarding form never flashes before an already-onboarded user
 * gets redirected home. */
function AuthLoadingScreen() {
  return (
    <AuthShell frozenVideo>
      <p style={{ ...bodyFont, color: C.textMuted, fontSize: 14 }}>Memuat…</p>
    </AuthShell>
  );
}

/**
 * Small clickable brand mark shown above the Login heading. Takes the
 * user back to the marketing landing page — kept as its own component
 * so it can be dropped onto other auth-adjacent screens later without
 * duplicating the markup/behavior.
 */
function AuthLogoLink({ delay = '0ms' }: { delay?: string }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      className="auth-logo-link auth-fade"
      style={{ marginBottom: 'clamp(16px, 3vw, 22px)', animationDelay: delay }}
      onClick={() => navigate('/')}
      aria-label="Kembali ke halaman utama Rutein"
    >
      <img src={rutinLogo} alt="Rutein" style={{ height: 'clamp(28px, 6vw, 34px)', width: 'auto', display: 'block' }} />
    </button>
  );
}

function AuthAlert({ children, tone = 'error' }: { children: React.ReactNode; tone?: 'error' | 'info' }) {
  const isError = tone === 'error';
  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={isError ? 'auth-alert' : 'auth-alert-info'}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '11px 20px',
        borderRadius: 999,
        border: `1.5px solid ${isError ? 'rgba(218, 54, 42, 0.4)' : 'rgba(183, 168, 151, 0.45)'}`,
        background: isError ? 'rgba(218, 54, 42, 0.08)' : 'rgba(183, 168, 151, 0.12)',
        textAlign: 'center',
        boxSizing: 'border-box',
        width: '100%',
      }}
    >
      <AlertTriangle
        size={15}
        strokeWidth={2.4}
        color={isError ? C.primary : C.textMuted}
        style={{ flexShrink: 0 }}
      />
      <span
        style={{
          ...bodyFont,
          fontSize: 13.5,
          fontWeight: 600,
          lineHeight: 1.35,
          color: isError ? C.primary : C.text,
        }}
      >
        {children}
      </span>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: 'clamp(14px, 3.5vw, 18px) clamp(18px, 4.5vw, 26px)',
  borderRadius: 999,
  border: `1.5px solid ${C.border}`,
  background: C.surface,
  color: C.text,
  fontSize: 16,
  fontFamily: "'Aileron', sans-serif",
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
};

const buttonStyle: React.CSSProperties = {
  width: '100%',
  padding: 'clamp(14px, 3.5vw, 16px) 0',
  borderRadius: 16,
  border: 'none',
  background: C.primary,
  color: '#FFFFFF',
  fontSize: 'clamp(16px, 3.8vw, 18px)',
  letterSpacing: '0.02em',
  cursor: 'pointer',
  transition: 'background-color 0.15s ease, transform 0.1s ease',
  boxSizing: 'border-box',
};

function translateAuthError(message: string, mode: 'signin' | 'signup'): string {
  const msg = (message || '').toLowerCase();
  if (
    msg.includes('invalid login credentials') ||
    msg.includes('invalid credentials') ||
    msg.includes('invalid_grant') ||
    msg.includes('user not found')
  ) {
    return 'Email atau kata sandi yang Anda masukkan salah. Silakan periksa kembali.';
  }
  if (
    msg.includes('user already registered') ||
    msg.includes('already registered') ||
    msg.includes('already exists') ||
    msg.includes('unique constraint')
  ) {
    return 'Email ini sudah terdaftar. Silakan masuk menggunakan akun Anda atau gunakan email lain.';
  }
  if (
    msg.includes('password should be at least') ||
    msg.includes('password is too short') ||
    msg.includes('weak password')
  ) {
    return 'Kata sandi minimal harus terdiri dari 6 karakter.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Email belum dikonfirmasi. Silakan periksa kotak masuk atau folder spam email Anda.';
  }
  if (
    msg.includes('invalid format') ||
    msg.includes('validate email') ||
    msg.includes('valid email') ||
    msg.includes('email address')
  ) {
    return 'Format alamat email tidak valid (contoh: nama@domain.com).';
  }
  if (
    msg.includes('rate limit') ||
    msg.includes('too many requests') ||
    msg.includes('over_email_send_rate_limit')
  ) {
    return 'Terlalu banyak percobaan. Silakan tunggu beberapa saat sebelum mencoba lagi.';
  }
  if (
    msg.includes('network') ||
    msg.includes('fetch') ||
    msg.includes('failed to fetch') ||
    msg.includes('connection')
  ) {
    return 'Gagal terhubung ke server. Periksa koneksi internet Anda.';
  }
  if (mode === 'signin') {
    return 'Gagal masuk. Silakan periksa kembali email dan kata sandi Anda.';
  }
  return 'Gagal membuat akun. Silakan periksa kembali data pendaftaran Anda dan coba lagi.';
}

// Login
export function Login({ initialMode = 'signin' }: { initialMode?: 'signin' | 'signup' }) {
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isDaftarPath =
    location.pathname === '/daftar' ||
    location.pathname === '/register' ||
    location.pathname === '/signup';
  const resolvedMode = isDaftarPath ? 'signup' : initialMode;

  const [mode, setMode] = useState<'signin' | 'signup'>(resolvedMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setMode(resolvedMode);
    setError(null);
    setNotice(null);
  }, [location.pathname, resolvedMode]);

  if (user) return <Navigate to="/" replace />;

  function validateForm(): string | null {
    if (mode === 'signup') {
      const trimmedName = fullName.trim();
      if (!trimmedName) {
        return 'Nama lengkap wajib diisi.';
      }
      if (trimmedName.length < 2) {
        return 'Nama lengkap minimal harus terdiri dari 2 karakter.';
      }
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      return 'Alamat email wajib diisi.';
    }

    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(trimmedEmail)) {
      return 'Format email tidak valid (contoh: nama@gmail.com).';
    }

    if (!password) {
      return 'Kata sandi wajib diisi.';
    }

    if (password.length < 6) {
      return 'Kata sandi minimal harus terdiri dari 6 karakter.';
    }

    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    const result =
      mode === 'signin'
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password, fullName.trim());

    if (result.error) {
      setSubmitting(false);
      setError(translateAuthError(result.error.message, mode));
      return;
    }

    if (mode === 'signup') {
      setSubmitting(false);
      if (!result.session) {
        setNotice('Akun berhasil dibuat. Cek email kamu untuk konfirmasi sebelum masuk.');
        return;
      }
      // Brand-new account — always send straight to onboarding.
      navigate('/onboarding/transport');
      return;
    }

    // Sign in: only send returning users through onboarding if they
    // genuinely haven't finished it yet (checked against the real
    // `user_preferences.onboarding_completed_at` column, not client
    // auth metadata, which nothing in the app ever sets).
    try {
      const status = result.user ? await getOnboardingStatus(result.user.id) : { completed: false };
      navigate(status.completed ? '/' : '/onboarding/transport');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell>
      <AuthLogoLink />

      <h1
        className="font-jockey auth-fade"
        style={{ fontSize: 'clamp(28px, 7vw, 44px)', margin: '0 0 clamp(20px, 4vw, 34px)', color: C.text, animationDelay: '40ms' }}
      >
        {mode === 'signin' ? 'Masuk Rutein' : 'Daftar Rutein'}
      </h1>

      {/* key={mode} forces every field below to fully remount on each
          Masuk/Daftar toggle, so the whole form fades down together and
          consistently. */}
      <form key={mode} noValidate onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(14px, 2.5vw, 18px)' }}>
        {mode === 'signup' && (
          <input
            className="auth-input auth-fade"
            style={{
              ...inputStyle,
              animationDelay: '0ms',
              borderColor: error?.toLowerCase().includes('nama') ? C.primary : undefined,
            }}
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Nama lengkap"
          />
        )}
        <input
          className="auth-input auth-fade"
          style={{
            ...inputStyle,
            animationDelay: mode === 'signup' ? '60ms' : '0ms',
            borderColor: error?.toLowerCase().includes('email') ? C.primary : undefined,
          }}
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(null);
          }}
          placeholder="Email"
        />
        <div style={{ position: 'relative', width: '100%' }}>
          <input
            className="auth-input auth-fade"
            style={{
              ...inputStyle,
              paddingRight: 56,
              animationDelay: mode === 'signup' ? '120ms' : '60ms',
              borderColor: error?.toLowerCase().includes('sandi') || error?.toLowerCase().includes('password') ? C.primary : undefined,
            }}
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Kata sandi"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
            style={{
              position: 'absolute',
              right: 18,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              padding: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#7A6F62',
              borderRadius: '50%',
              transition: 'color 0.15s ease',
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = C.primary)}
            onMouseOut={(e) => (e.currentTarget.style.color = '#7A6F62')}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {error && <AuthAlert tone="error">{error}</AuthAlert>}
        {notice && <AuthAlert tone="info">{notice}</AuthAlert>}

        <button
          type="submit"
          disabled={submitting}
          className="font-jockey auth-fade"
          style={{
            ...buttonStyle,
            fontSize: 18,
            animationDelay: mode === 'signup' ? '180ms' : '120ms',
            opacity: submitting ? 0.7 : 1,
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = C.primaryHover)}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = C.primary)}
        >
          {submitting ? 'Mohon tunggu…' : mode === 'signin' ? 'Masuk ke akun' : 'Buat akun'}
        </button>
      </form>

      <p className="auth-fade" style={{ ...bodyFont, color: C.textMuted, fontSize: 14, marginTop: 24, animationDelay: '220ms' }}>
        {mode === 'signin' ? 'Belum punya akun? ' : 'Sudah punya akun? '}
        <button
          type="button"
          onClick={() => {
            setError(null);
            setNotice(null);
            setShowPassword(false);
            const nextMode = mode === 'signin' ? 'signup' : 'signin';
            setMode(nextMode);
            navigate(nextMode === 'signin' ? '/login' : '/daftar');
          }}
          style={{ background: 'none', border: 'none', padding: 0, color: C.primary, fontWeight: 700, cursor: 'pointer', ...bodyFont, fontSize: 14 }}
        >
          {mode === 'signin' ? 'Daftar' : 'Masuk'}
        </button>
      </p>
    </AuthShell>
  );
}

export function Register() {
  return <Login initialMode="signup" />;
}

/**
 * Shared guard for the two onboarding screens: if the signed-in user has
 * already finished onboarding (real DB check, not metadata), redirect
 * home immediately instead of showing the form again — covers direct
 * links, browser back/forward, and bookmarks.
 */
function useOnboardingGuard(): boolean {
  return false;
}

// ============================================================
// ONBOARDING · STEP 1 — TRANSPORT PREFERENCE
// ============================================================
const TRANSPORT_OPTIONS: { value: OnboardingTransportType; label: string }[] = [
  { value: 'transjakarta', label: 'TransJakarta' },
  { value: 'bus', label: 'Bus Kota' },
  { value: 'krl', label: 'KRL Commuter' },
  { value: 'mrt', label: 'MRT' },
  { value: 'lrt', label: 'LRT' },
  { value: 'train', label: 'Kereta Antarkota' },
  { value: 'airport_rail', label: 'Kereta Bandara' },
  { value: 'ferry', label: 'Kapal Feri' },
  { value: 'terminal', label: 'Terminal Bus' },
];

export function TransportPreference() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const checking = useOnboardingGuard();
  const [selected, setSelected] = useState<Set<OnboardingTransportType>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (checking) return <AuthLoadingScreen />;

  function toggle(value: OnboardingTransportType) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  async function handleNext() {
    if (!user) {
      navigate('/onboarding/profile');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveTransportPreference(user.id, Array.from(selected));
      navigate('/onboarding/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan preferensi. Coba lagi.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthShell maxWidth={580} frozenVideo>
      <span className="font-jockey auth-fade" style={{ fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.primary, fontWeight: 700, animationDelay: '0ms' }}>
        Langkah 1 dari 2
      </span>
      <h1 className="font-jockey auth-fade" style={{ fontSize: 'clamp(24px, 6vw, 34px)', margin: '8px 0 12px', color: C.text, animationDelay: '60ms' }}>
        Kamu biasa naik apa?
      </h1>
      <p className="auth-fade" style={{ ...bodyFont, color: C.textMuted, marginBottom: 'clamp(20px, 4vw, 34px)', fontSize: 'clamp(13px, 2.8vw, 14px)', animationDelay: '120ms' }}>
        Pilih moda transportasi favoritmu — boleh lebih dari satu.
      </p>

      <div className="chip-row">
        {TRANSPORT_OPTIONS.map((opt, i) => {
          const active = selected.has(opt.value);
          const dot = TRANSPORT_TYPE_COLOR[opt.value] ?? C.primary;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              className="chip-grow transport-chip"
              style={{
                fontFamily: "'Aileron', sans-serif",
                animationDelay: `${i * 50}ms`,
                border: `1.5px solid ${active ? C.primary : C.border}`,
                background: active ? 'rgba(218,54,42,0.10)' : C.surface,
                color: active ? C.primary : C.text,
                transform: active ? 'scale(1.04)' : 'scale(1)',
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: dot, display: 'inline-block', flexShrink: 0 }} />
              <span>{opt.label}</span>
              {active && <Check size={14} strokeWidth={3} style={{ flexShrink: 0 }} />}
            </button>
          );
        })}
      </div>

      {error && (
        <div style={{ marginTop: 20 }}>
          <AuthAlert tone="error">{error}</AuthAlert>
        </div>
      )}

      <div className="auth-actions" style={{ marginTop: 'clamp(24px, 4.5vw, 36px)' }}>
        <button
          type="button"
          onClick={() => navigate('/onboarding/profile')}
          disabled={saving}
          className="font-jockey"
          style={{
            fontSize: 15,
            padding: '14px 24px',
            borderRadius: 14,
            border: `1.5px solid ${C.border}`,
            background: 'transparent',
            color: C.text,
            cursor: 'pointer',
            boxSizing: 'border-box',
          }}
        >
          Nanti saja
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={saving}
          className="font-jockey"
          style={{
            ...buttonStyle,
            fontSize: 15,
            width: 'auto',
            minWidth: 150,
            padding: '14px 32px',
            opacity: saving ? 0.7 : 1,
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = C.primaryHover)}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = C.primary)}
        >
          {saving ? 'Menyimpan…' : 'Lanjut'}
        </button>
      </div>
    </AuthShell>
  );
}

// ============================================================
// ONBOARDING · STEP 2 — PROFILE SELECT
// ============================================================
const PROFILES: { value: OnboardingProfileType; label: string; sub: string; icon: string }[] = [
  { value: 'school', label: 'Pelajar', sub: 'Berangkat ke sekolah/kampus', icon: profileSchoolSvg },
  { value: 'travel', label: 'Penjelajah', sub: 'Suka jalan-jalan & eksplorasi', icon: profileTravelSvg },
  { value: 'work', label: 'Pekerja', sub: 'Commuting ke kantor', icon: profileWorkSvg },
];

export function ProfileSelect() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const checking = useOnboardingGuard();
  const [selected, setSelected] = useState<OnboardingProfileType | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (checking) return <AuthLoadingScreen />;

  async function finish(profileType: OnboardingProfileType | null) {
    if (!user) {
      navigate('/');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveProfileType(user.id, profileType);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan profil. Coba lagi.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthShell maxWidth={640} frozenVideo>
      <span className="font-jockey auth-fade" style={{ fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.primary, fontWeight: 700, animationDelay: '0ms' }}>
        Langkah 2 dari 2
      </span>
      <h1 className="font-jockey auth-fade" style={{ fontSize: 'clamp(24px, 6vw, 34px)', margin: '8px 0 12px', color: C.text, animationDelay: '60ms' }}>
        Profil mana yang paling cocok buatmu?
      </h1>
      <p className="auth-fade" style={{ ...bodyFont, color: C.textMuted, marginBottom: 'clamp(20px, 4vw, 36px)', fontSize: 'clamp(13px, 2.8vw, 14px)', animationDelay: '120ms' }}>
        Ini membantu RUTEIN memahami gaya perjalananmu — boleh dilewati.
      </p>

      <div className="profiles-container">
        {PROFILES.map((p, i) => {
          const active = selected === p.value;
          return (
            <button
              key={p.value}
              type="button"
              onClick={() => setSelected(p.value)}
              className="profile-fly-in profile-option"
              style={{
                animationDelay: `${i * 120}ms`,
                border: `1.5px solid ${active ? C.primary : C.border}`,
                background: active ? 'rgba(218,54,42,0.10)' : C.surface,
                transform: active ? 'scale(1.03)' : 'scale(1)',
                boxShadow: active ? '0 4px 16px rgba(218, 54, 42, 0.14)' : 'none',
              }}
            >
              <img
                src={p.icon}
                alt={p.label}
                className={`profile-option-img ${active ? 'profile-icon-bounce' : ''}`}
              />
              <div className="profile-option-info">
                <strong className="font-jockey" style={{ fontSize: 20, color: C.text }}>
                  {p.label}
                </strong>
                <span style={{ ...bodyFont, fontSize: 12, color: C.textMuted, marginTop: 4 }}>{p.sub}</span>
              </div>
            </button>
          );
        })}
      </div>

      {error && (
        <div style={{ marginTop: 20 }}>
          <AuthAlert tone="error">{error}</AuthAlert>
        </div>
      )}

      <div className="auth-actions" style={{ marginTop: 'clamp(24px, 4.5vw, 36px)' }}>
        <button
          type="button"
          onClick={() => finish(null)}
          disabled={saving}
          className="font-jockey"
          style={{
            fontSize: 15,
            padding: '14px 24px',
            borderRadius: 14,
            border: `1.5px solid ${C.border}`,
            background: 'transparent',
            color: C.text,
            cursor: 'pointer',
            boxSizing: 'border-box',
          }}
        >
          Nanti saja
        </button>
        <button
          type="button"
          onClick={() => finish(selected)}
          disabled={saving || !selected}
          className="font-jockey"
          style={{
            ...buttonStyle,
            fontSize: 15,
            width: 'auto',
            minWidth: 150,
            padding: '14px 32px',
            opacity: saving || !selected ? 0.6 : 1,
            cursor: !selected ? 'not-allowed' : 'pointer',
          }}
          onMouseOver={(e) => selected && (e.currentTarget.style.backgroundColor = C.primaryHover)}
          onMouseOut={(e) => selected && (e.currentTarget.style.backgroundColor = C.primary)}
        >
          {saving ? 'Menyimpan…' : 'Selesai'}
        </button>
      </div>
    </AuthShell>
  );
}