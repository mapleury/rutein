import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { Home, Menu, X } from 'lucide-react';

import logoRuteinSvg from '@/assets/images/logo-rutein.svg';
import locationSvg from '@/assets/images/location.svg';
import heroImgSvg from '@/assets/images/hero-img.svg';
import busSvg from '@/assets/images/bus.svg';
import mrtSvg from '@/assets/images/MRT.svg';
import krlSvg from '@/assets/images/KRL.svg';
import jalanKakiSvg from '@/assets/images/jalan-kaki.svg';
import bintangSvg from '@/assets/images/bintang.svg';
import tentang1Svg from '@/assets/images/tentang1.svg';
import tentang2Svg from '@/assets/images/tentang2.svg';
import tentang3Svg from '@/assets/images/tentang3.svg';
import tentang1EngSvg from '@/assets/images/tentang1-eng.svg';
import tentang2EngSvg from '@/assets/images/tentang2-eng.svg';
import tentang3EngSvg from '@/assets/images/tentang3-eng.svg';
import caraKerjaSvg from '@/assets/images/cara-kerja.svg';
import merpatiSvg from '@/assets/images/merpati-terbang.svg';
import trainPeopleSvg from '@/assets/images/train-people.svg';

import { SplitText } from '@/components/ReactBits/SplitText';
import { BlurText } from '@/components/ReactBits/BlurText';
import { TiltedCard } from '@/components/ReactBits/TiltedCard';

function AnimatedTrainTrackTop() {
  return (
    <svg width="100%" height="auto" viewBox="0 0 1440 63" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', minWidth: '100vw' }}>
      {/* Base Track Line */}
      <path
        d="M-80 43.9682H260.059L541.526 32.5794C546.418 32.3814 551.309 32.9916 556.002 34.3853L624.775 54.8088C635.074 57.8673 646.132 57.0987 655.909 52.6448L733.434 17.3276C738.388 15.0709 743.713 13.7418 749.146 13.406L830.682 8.3673C836.824 7.98772 842.979 8.88552 848.756 11.004L901.751 30.4354C905.093 31.661 908.571 32.4813 912.109 32.8787L1056.27 49.0702C1059.01 49.3786 1061.78 49.4307 1064.54 49.2259L1292.48 32.2804H1519"
        stroke="#DA362A"
        strokeWidth="11.1312"
      />

      <path
        d="M-80 43.9682H260.059L541.526 32.5794C546.418 32.3814 551.309 32.9916 556.002 34.3853L624.775 54.8088C635.074 57.8673 646.132 57.0987 655.909 52.6448L733.434 17.3276C738.388 15.0709 743.713 13.7418 749.146 13.406L830.682 8.3673C836.824 7.98772 842.979 8.88552 848.756 11.004L901.751 30.4354C905.093 31.661 908.571 32.4813 912.109 32.8787L1056.27 49.0702C1059.01 49.3786 1061.78 49.4307 1064.54 49.2259L1292.48 32.2804H1519"
        stroke="#FFFFFF"
        strokeWidth="4.5"
        strokeDasharray="120 1200"
        className="train-path-flow"
        strokeLinecap="round"
      />

      {/* Station Circles */}
      <g className="station-dot">
        <circle cx="139.244" cy="43.4118" r="12.2443" fill="#DA362A" />
        <circle cx="139.244" cy="43.4118" r="8.90498" fill="white" />
      </g>
      <g className="station-dot">
        <circle cx="548.874" cy="33.3938" r="12.2443" fill="#DA362A" />
        <circle cx="548.874" cy="33.3937" r="8.90498" fill="white" />
      </g>
      <g className="station-dot">
        <circle cx="751.462" cy="12.2443" r="12.2443" fill="#DA362A" />
        <circle cx="751.462" cy="12.2443" r="8.90498" fill="white" />
      </g>
      <g className="station-dot">
        <circle cx="954.824" cy="36.8461" r="12.2443" fill="#DA362A" />
        <circle cx="954.824" cy="36.8461" r="8.90498" fill="white" />
      </g>
      <g className="station-dot">
        <circle cx="1290.21" cy="33.3938" r="12.2443" fill="#DA362A" />
        <circle cx="1290.21" cy="33.3937" r="8.90498" fill="white" />
      </g>
    </svg>
  );
}

function AnimatedTrainTrackBottom() {
  return (
    <svg width="100%" height="auto" viewBox="0 0 1440 63" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', minWidth: '100vw' }}>
      {/* Base Track Line */}
      <path
        d="M-77 18.2483H263.059L544.526 29.6372C549.418 29.8351 554.309 29.225 559.002 27.8312L627.775 7.40777C638.074 4.34923 649.132 5.11782 658.909 9.57177L736.434 44.889C741.388 47.1456 746.713 48.4748 752.146 48.8105L833.682 53.8493C839.824 54.2288 845.979 53.331 851.756 51.2125L904.751 31.7812C908.093 30.5556 911.571 29.7353 915.109 29.3379L1059.27 13.1464C1062.01 12.8379 1064.78 12.7858 1067.54 12.9907L1295.48 29.9361H1522"
        stroke="#DA362A"
        strokeWidth="11.1312"
      />

      <path
        d="M-77 18.2483H263.059L544.526 29.6372C549.418 29.8351 554.309 29.225 559.002 27.8312L627.775 7.40777C638.074 4.34923 649.132 5.11782 658.909 9.57177L736.434 44.889C741.388 47.1456 746.713 48.4748 752.146 48.8105L833.682 53.8493C839.824 54.2288 845.979 53.331 851.756 51.2125L904.751 31.7812C908.093 30.5556 911.571 29.7353 915.109 29.3379L1059.27 13.1464C1062.01 12.8379 1064.78 12.7858 1067.54 12.9907L1295.48 29.9361H1522"
        stroke="#FFFFFF"
        strokeWidth="4.5"
        strokeDasharray="120 1200"
        className="train-path-flow"
        strokeLinecap="round"
      />

      {/* Station Circles */}
      <g className="station-dot">
        <circle cx="12.2443" cy="12.2443" r="12.2443" transform="matrix(1 0 0 -1 539.629 41.0674)" fill="#DA362A" />
        <circle cx="8.90498" cy="8.90498" r="8.90498" transform="matrix(1 0 0 -1 542.969 37.728)" fill="white" />
      </g>
      <g className="station-dot">
        <circle cx="12.2443" cy="12.2443" r="12.2443" transform="matrix(1 0 0 -1 130 31.0493)" fill="#DA362A" />
        <circle cx="8.90498" cy="8.90498" r="8.90498" transform="matrix(1 0 0 -1 133.339 27.71)" fill="white" />
      </g>
      <g className="station-dot">
        <circle cx="12.2443" cy="12.2443" r="12.2443" transform="matrix(1 0 0 -1 742.217 62.2168)" fill="#DA362A" />
        <circle cx="8.90498" cy="8.90498" r="8.90498" transform="matrix(1 0 0 -1 745.557 58.8774)" fill="white" />
      </g>
      <g className="station-dot">
        <circle cx="12.2443" cy="12.2443" r="12.2443" transform="matrix(1 0 0 -1 945.58 37.6152)" fill="#DA362A" />
        <circle cx="8.90498" cy="8.90498" r="8.90498" transform="matrix(1 0 0 -1 948.919 34.2759)" fill="white" />
      </g>
      <g className="station-dot">
        <circle cx="12.2443" cy="12.2443" r="12.2443" transform="matrix(1 0 0 -1 1280.97 41.0674)" fill="#DA362A" />
        <circle cx="8.90498" cy="8.90498" r="8.90498" transform="matrix(1 0 0 -1 1284.31 37.728)" fill="white" />
      </g>
    </svg>
  );
}

function CustomTransitCursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [trailPos, setTrailPos] = useState({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });

      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('.hover-lift-card') || target.closest('button'))) {
        setIsHovered(true);
      } else {
        setIsHovered(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    let animId: number;
    const follow = () => {
      setTrailPos((prev) => ({
        x: prev.x + (pos.x - prev.x) * 0.2,
        y: prev.y + (pos.y - prev.y) * 0.2,
      }));
      animId = requestAnimationFrame(follow);
    };
    animId = requestAnimationFrame(follow);
    return () => cancelAnimationFrame(animId);
  }, [pos]);

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: pos.y,
          left: pos.x,
          width: 8,
          height: 8,
          background: '#DA362A',
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 9999,
          transition: 'transform 0.1s ease',
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: trailPos.y,
          left: trailPos.x,
          width: isHovered ? 40 : 28,
          height: isHovered ? 40 : 28,
          border: '1.5px solid #DA362A',
          background: isHovered ? 'rgba(218, 54, 42, 0.08)' : 'transparent',
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 9998,
          transition: 'width 0.2s ease, height 0.2s ease, background 0.2s ease',
          boxShadow: isHovered ? '0 0 16px rgba(218, 54, 42, 0.25)' : 'none',
        }}
      />
    </>
  );
}

function AmbientTransitBackground() {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '55vw',
          height: '55vw',
          background: 'radial-gradient(circle, rgba(218, 54, 42, 0.06) 0%, rgba(252, 244, 237, 0) 70%)',
          borderRadius: '50%',
          filter: 'blur(40px)',
          animation: 'meshPulse 8s ease-in-out infinite alternate',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: '40%',
          left: 0,
          width: '50vw',
          height: '50vw',
          background: 'radial-gradient(circle, rgba(229, 213, 197, 0.45) 0%, rgba(252, 244, 237, 0) 70%)',
          borderRadius: '50%',
          filter: 'blur(50px)',
          animation: 'meshPulse 10s ease-in-out infinite alternate-reverse',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(to right, rgba(229, 213, 197, 0.18) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(229, 213, 197, 0.18) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 80%)',
          opacity: 0.7,
        }}
      />
    </div>
  );
}

function SmoothReveal({
  children,
  delayMs = 0,
  className,
  style,
}: {
  children: React.ReactNode;
  delayMs?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...style,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(16px)',
        transition: `opacity 1.1s cubic-bezier(0.16, 1, 0.3, 1) ${delayMs}ms, transform 1.1s cubic-bezier(0.16, 1, 0.3, 1) ${delayMs}ms`,
      }}
    >
      {children}
    </div>
  );
}

function AnimatedCounter({ target = 5000, suffix = '+' }: { target?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const duration = 1800;
          const startTime = performance.now();

          const update = (now: number) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(easeProgress * target));

            if (progress < 1) {
              requestAnimationFrame(update);
            }
          };

          requestAnimationFrame(update);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return (
    <div ref={ref} className="font-jockey" style={{ fontSize: 32, color: '#DA362A', lineHeight: 1 }}>
      {count >= 1000 ? `${(count / 1000).toFixed(count % 1000 === 0 ? 0 : 1)}K${suffix}` : `${count}${suffix}`}
    </div>
  );
}

export default function LandingPage() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isEN = lang === 'EN';

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }, []);

  const scrollToSection = (id: string) => {
    setIsMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToTop = () => {
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FCF4ED',
        color: '#1E1E1E',
        fontFamily: 'var(--font-body)',
        overflowX: 'hidden',
        position: 'relative',
      }}
    >
      <CustomTransitCursor />

      <style>{`
        .logo-hover {
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), filter 0.25s ease;
        }
        .logo-hover:hover {
          transform: scale(1.05) rotate(-1deg);
          filter: drop-shadow(0 4px 12px rgba(218, 54, 42, 0.3));
        }

        .shimmer-cta-btn {
          position: relative;
          overflow: hidden;
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.15s ease, box-shadow 0.25s ease !important;
        }
        .shimmer-cta-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 60%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.35), transparent);
          transform: skewX(-20deg);
          animation: btnShimmer 3.5s infinite;
        }
        @keyframes btnShimmer {
          0% { left: -100%; }
          30% { left: 180%; }
          100% { left: 180%; }
        }
        .shimmer-cta-btn:hover {
          transform: translateY(-3px) scale(1.02) !important;
          box-shadow: 0 10px 28px rgba(218, 54, 42, 0.45) !important;
        }

        .hover-lift-card {
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.35s ease !important;
          cursor: pointer;
        }
        .hover-lift-card:hover {
          transform: translateY(-8px) scale(1.015) !important;
          box-shadow: 0 20px 40px rgba(218, 54, 42, 0.16) !important;
          border-color: rgba(218, 54, 42, 0.4) !important;
        }

        .train-path-flow {
          animation: trainPathMove 4.5s linear infinite;
        }
        @keyframes trainPathMove {
          0% { stroke-dashoffset: 1320; }
          100% { stroke-dashoffset: 0; }
        }

        .station-dot {
          transition: transform 0.3s ease;
        }
        .station-dot:hover {
          transform: scale(1.3);
        }

        @keyframes meshPulse {
          0% { opacity: 0.5; transform: scale(1); }
          100% { opacity: 0.95; transform: scale(1.06); }
        }

        @keyframes calloutFloat1 {
          0% { transform: translateY(0px) rotate(0deg) scale(1); }
          50% { transform: translateY(-12px) rotate(-4deg) scale(1.06); }
          100% { transform: translateY(0px) rotate(0deg) scale(1); }
        }

        @keyframes trainPeopleFloat {
          0% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-8px) translateX(5px); }
          100% { transform: translateY(0px) translateX(0px); }
        }

        @keyframes starSpinGlow {
          0% { transform: rotate(0deg) scale(1); filter: drop-shadow(0 0 0px rgba(218, 54, 42, 0)); }
          50% { transform: rotate(20deg) scale(1.22); filter: drop-shadow(0 0 16px rgba(218, 54, 42, 0.45)); }
          100% { transform: rotate(0deg) scale(1); filter: drop-shadow(0 0 0px rgba(218, 54, 42, 0)); }
        }

        .animated-bird {
          animation: birdFloat 3.8s ease-in-out infinite;
          display: inline-block;
          will-change: transform;
        }

        .animated-train-people {
          animation: trainPeopleFloat 4.2s ease-in-out infinite;
          display: inline-block;
          will-change: transform;
        }

        .animated-star-glow {
          animation: starSpinGlow 3.2s ease-in-out infinite;
          display: inline-block;
          will-change: transform, filter;
        }

        .footer-social-icon {
          transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275), color 0.2s ease, filter 0.2s ease !important;
        }
        .footer-social-icon:hover {
          transform: translateY(-4px) scale(1.2) !important;
          color: #DA362A !important;
          filter: drop-shadow(0 4px 10px rgba(218, 54, 42, 0.4)) !important;
        }

        .footer-input-focus {
          transition: border-color 0.25s ease, box-shadow 0.25s ease !important;
        }
        .footer-input-focus:focus {
          border-color: #DA362A !important;
          box-shadow: 0 0 12px rgba(218, 54, 42, 0.25) !important;
        }
      `}</style>

      {/* Ambient Mesh Glow & Transit Grid BG */}
      <AmbientTransitBackground />

      <header
        className="static-header"
        style={{
          padding: '24px 32px 10px',
          maxWidth: 1280,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div
          onClick={scrollToTop}
          className="logo-hover"
          style={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 4,
          }}
        >
          <img src={logoRuteinSvg} alt="Rutein Logo" style={{ height: 32, objectFit: 'contain', display: 'block' }} />
        </div>
      </header>

      <div
        className="desktop-nav-pill"
        style={{
          position: 'fixed',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <button
          onClick={scrollToTop}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: '#DA362A',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(218, 54, 42, 0.35)',
            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            flexShrink: 0,
          }}
          onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
          onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          title={isEN ? 'Back to Top' : 'Kembali ke Atas'}
        >
          <Home size={19} color="#FFFFFF" />
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            border: '2px solid #DA362A',
            borderRadius: 999,
            padding: '4px 6px',
            background: '#FCF4ED',
            boxShadow: '0 6px 20px rgba(218, 54, 42, 0.15)',
          }}
        >
          <button
            onClick={() => scrollToSection('tentang')}
            className="font-jockey"
            style={{
              padding: '6px 22px',
              borderRadius: 999,
              color: '#1E1E1E',
              background: 'none',
              border: 'none',
              fontSize: 17,
              letterSpacing: '0.02em',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {isEN ? 'About' : 'Tentang'}
          </button>

          <button
            onClick={() => scrollToSection('cara-kerja')}
            className="font-jockey"
            style={{
              padding: '6px 22px',
              borderRadius: 999,
              color: '#1E1E1E',
              background: 'none',
              border: 'none',
              fontSize: 17,
              letterSpacing: '0.02em',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {isEN ? 'How It Works' : 'Cara Kerja'}
          </button>

          <button
            onClick={() => navigate(user ? '/dashboard' : '/login')}
            className="font-jockey shimmer-cta-btn"
            style={{
              padding: '6px 26px',
              borderRadius: 999,
              background: '#DA362A',
              color: '#FFFFFF',
              border: 'none',
              fontSize: 17,
              letterSpacing: '0.02em',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(218, 54, 42, 0.25)',
            }}
          >
            {user ? 'Dashboard' : isEN ? 'Get Started' : 'Mulai'}
          </button>

          <LanguageSwitcher />
        </div>
      </div>

      <div
        className="hamburger-nav-group"
        style={{
          position: 'fixed',
          top: 20,
          right: 24,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <button
          onClick={scrollToTop}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: '#DA362A',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(218, 54, 42, 0.35)',
            color: '#FFFFFF',
          }}
          title={isEN ? 'To Top' : 'Ke Atas'}
        >
          <Home size={19} color="#FFFFFF" />
        </button>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: '#DA362A',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(218, 54, 42, 0.35)',
            color: '#FFFFFF',
          }}
          title={isEN ? 'Navigation Menu' : 'Menu Navigasi'}
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {isMobileMenuOpen && (
          <div
            style={{
              position: 'absolute',
              top: 50,
              right: 0,
              background: '#FCF4ED',
              border: '2px solid #DA362A',
              borderRadius: 20,
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              minWidth: 190,
              boxShadow: '0 12px 32px rgba(218, 54, 42, 0.25)',
              zIndex: 1001,
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            <button
              onClick={() => scrollToSection('tentang')}
              className="font-jockey"
              style={{
                padding: '10px 16px',
                borderRadius: 12,
                color: '#1E1E1E',
                background: '#FDF0ED',
                border: '1px solid #E5D5C5',
                fontSize: 18,
                textAlign: 'center',
                cursor: 'pointer',
              }}
            >
              {isEN ? 'About' : 'Tentang'}
            </button>

            <button
              onClick={() => scrollToSection('cara-kerja')}
              className="font-jockey"
              style={{
                padding: '10px 16px',
                borderRadius: 12,
                color: '#1E1E1E',
                background: '#FDF0ED',
                border: '1px solid #E5D5C5',
                fontSize: 18,
                textAlign: 'center',
                cursor: 'pointer',
              }}
            >
              {isEN ? 'How It Works' : 'Cara Kerja'}
            </button>

            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                navigate(user ? '/dashboard' : '/login');
              }}
              className="font-jockey"
              style={{
                padding: '12px 20px',
                borderRadius: 999,
                background: '#DA362A',
                color: '#FFFFFF',
                border: 'none',
                fontSize: 18,
                textAlign: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(218, 54, 42, 0.3)',
              }}
            >
              {user ? 'Dashboard' : isEN ? 'Get Started' : 'Mulai'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 4 }}>
              <LanguageSwitcher />
            </div>
          </div>
        )}
      </div>

      <section
        className="hero-container"
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '40px 32px 0px',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div className="hero-grid">
          {/* Hero Image Column with Official React Bits TiltedCard */}
          <div className="hero-img-col">
            <TiltedCard maxRotateX={10} maxRotateY={10} scaleOnHover={1.02}>
              <img
                src={heroImgSvg}
                alt="Peta Rutein"
                style={{
                  width: '100%',
                  maxWidth: 520,
                  height: 'auto',
                  objectFit: 'contain',
                }}
              />
            </TiltedCard>
          </div>

          {/* Hero Text Column with Exact Line Formatting like Image 3 */}
          <div className="hero-text-col" style={{ zIndex: 2 }}>
            <h1
              key={`hero-title-${lang}`}
              className="font-jockey"
              style={{
                fontSize: 'clamp(34px, 4.8vw, 60px)',
                lineHeight: 1.08,
                fontWeight: 900,
                color: '#1E1E1E',
                margin: '0 0 20px 0',
                letterSpacing: '0.01em',
              }}
            >
              <SplitText
                text={isEN ? 'Public transit' : 'Navigasi transportasi'}
                delay={25}
                animationFrom={{ opacity: 0, transform: 'translate3d(0,20px,0)', filter: 'blur(6px)' }}
                animationTo={{ opacity: 1, transform: 'translate3d(0,0,0)', filter: 'blur(0px)' }}
              />
              <br />
              <SplitText
                text={isEN ? 'navigation,' : 'publik,'}
                delay={35}
                animationFrom={{ opacity: 0, transform: 'translate3d(0,20px,0)', filter: 'blur(6px)' }}
                animationTo={{ opacity: 1, transform: 'translate3d(0,0,0)', filter: 'blur(0px)' }}
              />
              {'\u00A0'}
              <SplitText
                text={isEN ? 'made simple.' : 'tanpa ribet.'}
                delay={45}
                style={{ color: '#DA362A' }}
                animationFrom={{ opacity: 0, transform: 'translate3d(0,20px,0)', filter: 'blur(6px)' }}
                animationTo={{ opacity: 1, transform: 'translate3d(0,0,0)', filter: 'blur(0px)' }}
              />
            </h1>

            <div key={`hero-desc-${lang}`} style={{ marginBottom: 32, maxWidth: 540, fontSize: 'clamp(14px, 1.4vw, 16px)', lineHeight: 1.65, color: '#4A4A4A' }}>
              <BlurText
                text={
                  isEN
                    ? 'RUTEIN helps you plan public transit journeys tailored to your time, budget, and travel preferences, guiding you in real time to your destination.'
                    : 'RUTEIN membantu kamu merencanakan perjalanan dengan transportasi publik berdasarkan waktu, biaya, dan preferensi perjalanan, lalu memandumu secara real-time sampai tujuan.'
                }
                delay={25}
              />
            </div>

            {/* Main Action Button with Shimmer Beam */}
            <div style={{ marginBottom: 36 }}>
              <button
                onClick={() => navigate(user ? '/dashboard' : '/login')}
                className="font-jockey shimmer-cta-btn"
                style={{
                  background: '#DA362A',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 12,
                  padding: '16px 40px',
                  fontSize: 20,
                  letterSpacing: '0.02em',
                  cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(218, 54, 42, 0.35)',
                }}
              >
                {isEN ? 'Start Journey' : 'Mulai Perjalanan'}
              </button>
            </div>

            {/* Transport Modes Cards */}
            <div
              className="transport-cards-row"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap',
                marginBottom: 16,
              }}
            >
              {/* Bus */}
              <div
                className="hover-lift-card"
                style={{
                  width: 72,
                  height: 72,
                  background: '#FFFFFF',
                  border: '1.5px solid #E5D5C5',
                  borderRadius: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                <img src={busSvg} alt="Bus" style={{ height: 28, width: 28, objectFit: 'contain' }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: '#4A4A4A' }}>Bus</span>
              </div>

              {/* MRT */}
              <div
                className="hover-lift-card"
                style={{
                  width: 72,
                  height: 72,
                  background: '#FFFFFF',
                  border: '1.5px solid #E5D5C5',
                  borderRadius: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                <img src={mrtSvg} alt="MRT" style={{ height: 28, width: 28, objectFit: 'contain' }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: '#4A4A4A' }}>MRT</span>
              </div>

              {/* KRL */}
              <div
                className="hover-lift-card"
                style={{
                  width: 72,
                  height: 72,
                  background: '#FFFFFF',
                  border: '1.5px solid #E5D5C5',
                  borderRadius: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                <img src={krlSvg} alt="KRL" style={{ height: 28, width: 28, objectFit: 'contain' }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: '#4A4A4A' }}>KRL</span>
              </div>

              {/* Jalan Kaki */}
              <div
                className="hover-lift-card"
                style={{
                  width: 72,
                  height: 72,
                  background: '#FFFFFF',
                  border: '1.5px solid #E5D5C5',
                  borderRadius: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                <img src={jalanKakiSvg} alt="Jalan Kaki" style={{ height: 28, width: 28, objectFit: 'contain' }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: '#4A4A4A' }}>{isEN ? 'Walking' : 'Jalan Kaki'}</span>
              </div>
            </div>

            {/* Tagline note with Star */}
            <div className="tagline-star-row" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#666666' }}>
              <img src={bintangSvg} alt="Star" style={{ width: 14, height: 14 }} />
              <span>
                {isEN ? (
                  <>One destination. <strong>Countless ways</strong> to get there.</>
                ) : (
                  <>Satu tujuan. <strong>Banyak cara</strong> untuk sampai.</>
                )}
              </span>
            </div>
          </div>
        </div>
      </section>

      <div
        style={{
          width: '100vw',
          position: 'relative',
          left: '50%',
          right: '50%',
          marginLeft: '-50vw',
          marginRight: '-50vw',
          marginTop: 40,
          marginBottom: 60,
          overflow: 'hidden',
          lineHeight: 0,
          zIndex: 2,
        }}
      >
        <AnimatedTrainTrackTop />
      </div>

      <section
        id="tentang"
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '20px 40px 80px',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <SmoothReveal className="tentang-header-row">
          {/* Big Red Location Pin + Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <img src={locationSvg} alt="Location Pin" style={{ height: 68, width: 'auto', objectFit: 'contain', flexShrink: 0 }} />
            <h2
              className="font-jockey"
              style={{
                fontSize: 'clamp(30px, 4.2vw, 52px)',
                lineHeight: 1.05,
                fontWeight: 900,
                color: '#1E1E1E',
                margin: 0,
              }}
            >
              {isEN ? (
                <>
                  We make your
                  <br />
                  <span style={{ color: '#DA362A' }}>journey easier!</span>
                </>
              ) : (
                <>
                  Kami mudahkan
                  <br />
                  <span style={{ color: '#DA362A' }}>perjalananmu!</span>
                </>
              )}
            </h2>
          </div>

          <div
            className="hover-lift-card"
            style={{
              background: '#FFFFFF',
              border: '1.5px solid #E5D5C5',
              borderRadius: 18,
              padding: '14px 26px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              boxShadow: '0 6px 20px rgba(0,0,0,0.04)',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: '#FDF0ED',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 6,
                flexShrink: 0,
              }}
            >
              <img src={locationSvg} alt="Pin" style={{ height: '100%', width: 'auto', objectFit: 'contain' }} />
            </div>
            <div>
              <AnimatedCounter target={5000} suffix="+" />
              <div style={{ fontSize: 13, color: '#555555', fontWeight: 700, fontFamily: 'var(--font-inter)', whiteSpace: 'nowrap' }}>
                {isEN ? (
                  <>
                    Connected Transit
                    <br />
                    Routes
                  </>
                ) : (
                  <>
                    Rute Transportasi
                    <br />
                    Terhubung
                  </>
                )}
              </div>
            </div>
          </div>
        </SmoothReveal>

        {/* 3 Strictly Equal Sized Feature Cards Grid */}
        <div className="tentang-cards-grid">
          {/* Card 1: Transit Lebih Mudah */}
          <SmoothReveal delayMs={100} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <TiltedCard maxRotateX={8} maxRotateY={8} scaleOnHover={1.02} style={{ height: '100%', display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div
                className="hover-lift-card"
                style={{
                  background: '#FFFFFF',
                  border: '1.5px solid #E5D5C5',
                  borderRadius: 24,
                  padding: '38px 28px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
                  minHeight: 380,
                  height: '100%',
                  boxSizing: 'border-box',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 210, flexShrink: 0 }}>
                  <img src={isEN ? tentang1EngSvg : tentang1Svg} alt={isEN ? 'Seamless transit transfers' : 'Transit Lebih Mudah'} style={{ width: '100%', maxHeight: 195, height: 'auto', objectFit: 'contain' }} />
                </div>
                <div style={{ marginTop: 28, textAlign: 'center', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <h3 className="font-jockey" style={{ fontSize: 26, color: '#1E1E1E', margin: '0 0 12px 0', lineHeight: 1.15, minHeight: 62, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isEN ? 'Seamless transit transfers' : 'Transit lebih mudah'}
                  </h3>
                  <p style={{ fontSize: 15, color: '#666666', lineHeight: 1.65, margin: 0, fontFamily: 'var(--font-inter)' }}>
                    {isEN ? (
                      <>
                        Combine multiple public transit
                        <br />
                        modes in a single trip
                      </>
                    ) : (
                      <>
                        Gabungkan beberapa moda transportasi
                        <br />
                        publik dalam satu perjalanan
                      </>
                    )}
                  </p>
                </div>
              </div>
            </TiltedCard>
          </SmoothReveal>

          {/* Card 2: Bandingkan Sebelum Berangkat */}
          <SmoothReveal delayMs={200} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <TiltedCard maxRotateX={8} maxRotateY={8} scaleOnHover={1.02} style={{ height: '100%', display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div
                className="hover-lift-card"
                style={{
                  background: '#FFFFFF',
                  border: '1.5px solid #E5D5C5',
                  borderRadius: 24,
                  padding: '38px 28px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
                  minHeight: 380,
                  height: '100%',
                  boxSizing: 'border-box',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 210, flexShrink: 0 }}>
                  <img src={isEN ? tentang2EngSvg : tentang2Svg} alt={isEN ? 'Compare Before You Depart' : 'Bandingkan Sebelum Berangkat'} style={{ width: '100%', maxHeight: 195, height: 'auto', objectFit: 'contain' }} />
                </div>
                <div style={{ marginTop: 28, textAlign: 'center', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <h3 className="font-jockey" style={{ fontSize: 26, color: '#1E1E1E', margin: '0 0 12px 0', lineHeight: 1.15, minHeight: 62, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isEN ? (
                      <>
                        Compare before
                        <br />
                        you depart
                      </>
                    ) : (
                      <>
                        Bandingkan sebelum
                        <br />
                        berangkat
                      </>
                    )}
                  </h3>
                  <p style={{ fontSize: 15, color: '#666666', lineHeight: 1.65, margin: 0, fontFamily: 'var(--font-inter)' }}>
                    {isEN ? (
                      <>
                        Check duration, fares, and transit
                        <br />
                        before choosing your route
                      </>
                    ) : (
                      <>
                        Lihat waktu, biaya, dan jumlah transit
                        <br />
                        sebelum memilih perjalanan
                      </>
                    )}
                  </p>
                </div>
              </div>
            </TiltedCard>
          </SmoothReveal>

          {/* Card 3: Tahu Kondisi Perjalanan */}
          <SmoothReveal delayMs={300} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <TiltedCard maxRotateX={8} maxRotateY={8} scaleOnHover={1.02} style={{ height: '100%', display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div
                className="tentang-card-3 hover-lift-card"
                style={{
                  background: '#FFFFFF',
                  border: '1.5px solid #E5D5C5',
                  borderRadius: 24,
                  padding: '38px 28px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
                  minHeight: 380,
                  height: '100%',
                  boxSizing: 'border-box',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 210, flexShrink: 0 }}>
                  <img src={isEN ? tentang3EngSvg : tentang3Svg} alt={isEN ? 'Know Travel Conditions' : 'Tahu Kondisi Perjalanan'} style={{ width: '100%', maxHeight: 195, height: 'auto', objectFit: 'contain' }} />
                </div>
                <div style={{ marginTop: 28, textAlign: 'center', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <h3 className="font-jockey" style={{ fontSize: 26, color: '#1E1E1E', margin: '0 0 12px 0', lineHeight: 1.15, minHeight: 62, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isEN ? 'Know Travel Conditions' : 'Tahu Kondisi Perjalanan'}
                  </h3>
                  <p style={{ fontSize: 15, color: '#666666', lineHeight: 1.65, margin: 0, fontFamily: 'var(--font-inter)' }}>
                    {isEN ? (
                      <>
                        Check schedules and travel updates
                        <br />
                        before you head out
                      </>
                    ) : (
                      <>
                        Pantau jadwal dan informasi perjalanan
                        <br />
                        sebelum kamu berangkat
                      </>
                    )}
                  </p>
                </div>
              </div>
            </TiltedCard>
          </SmoothReveal>
        </div>
      </section>

      <section
        id="cara-kerja"
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '40px 40px 60px',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <SmoothReveal style={{ maxWidth: 1080, margin: '0 auto 90px', position: 'relative' }}>
          <div className="cara-kerja-desktop">
            <div style={{ position: 'relative', height: 95, marginBottom: 0 }}>
              <div style={{ position: 'absolute', left: '-60px', bottom: 8, width: 300, textAlign: 'center' }}>
                <h4 className="font-jockey" style={{ color: '#DA362A', fontSize: 26, margin: 0, lineHeight: 1.15, letterSpacing: '0.01em' }}>
                  {isEN ? 'Enter Destination' : 'Masukkan Tujuan'}
                </h4>
              </div>

              <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 0, width: 380, textAlign: 'center' }}>
                <h4 className="font-jockey" style={{ color: '#DA362A', fontSize: 26, margin: 0, lineHeight: 1.15, letterSpacing: '0.01em' }}>
                  {isEN ? (
                    <>
                      RUTEIN finds best
                      <br />
                      routes
                    </>
                  ) : (
                    <>
                      RUTEIN carikan pilihan
                      <br />
                      perjalanan
                    </>
                  )}
                </h4>
              </div>

              <div style={{ position: 'absolute', right: '-60px', bottom: 8, width: 300, textAlign: 'center' }}>
                <h4 className="font-jockey" style={{ color: '#DA362A', fontSize: 26, margin: 0, lineHeight: 1.15, letterSpacing: '0.01em' }}>
                  {isEN ? (
                    <>
                      Choose & start
                      <br />
                      journey
                    </>
                  ) : (
                    <>
                      Pilih dan mulai
                      <br />
                      perjalanan
                    </>
                  )}
                </h4>
              </div>
            </div>

            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', margin: '0' }}>
              <img src={caraKerjaSvg} alt="Cara Kerja Timeline" style={{ width: '100%', height: 'auto', display: 'block' }} />
            </div>

            <div style={{ position: 'relative', height: 125, marginTop: 18 }}>
              <div style={{ position: 'absolute', left: '-60px', top: 0, width: 300, textAlign: 'center' }}>
                <p style={{ fontSize: 17, color: '#4A4A4A', margin: 0, lineHeight: 1.45, fontWeight: 500, fontFamily: 'var(--font-inter)' }}>
                  {isEN ? (
                    <>
                      Choose your starting point and
                      <br />
                      final destination
                    </>
                  ) : (
                    <>
                      Pilih lokasi awal dan
                      <br />
                      tujuan akhir kamu
                    </>
                  )}
                </p>
              </div>

              <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 0, width: 380, textAlign: 'center' }}>
                <p style={{ fontSize: 17, color: '#4A4A4A', margin: 0, lineHeight: 1.45, fontWeight: 500, fontFamily: 'var(--font-inter)' }}>
                  {isEN ? (
                    <>
                      We calculate optimal routes
                      <br />
                      based on time, fares,
                      <br />
                      transfers, and live conditions
                    </>
                  ) : (
                    <>
                      Kami hitung rute terbaik
                      <br />
                      berdasarkan waktu, biaya,
                      <br />
                      transit, dan kondisi live
                    </>
                  )}
                </p>
              </div>

              <div style={{ position: 'absolute', right: '-60px', top: 0, width: 300, textAlign: 'center' }}>
                <p style={{ fontSize: 17, color: '#4A4A4A', margin: 0, lineHeight: 1.45, fontWeight: 500, fontFamily: 'var(--font-inter)' }}>
                  {isEN ? (
                    <>
                      Pick your favorite route and
                      <br />
                      depart with complete
                      <br />
                      confidence
                    </>
                  ) : (
                    <>
                      Pilih rute favoritmu dan
                      <br />
                      berangkat dengan
                      <br />
                      percaya diri
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="cara-kerja-mobile" style={{ display: 'none', flexDirection: 'column', gap: 18 }}>
            <div
              style={{
                background: '#FFFFFF',
                border: '1.5px solid #E5D5C5',
                borderRadius: 16,
                padding: '20px 22px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              }}
            >
              <div
                className="font-jockey"
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  background: '#DA362A',
                  color: '#FFFFFF',
                  fontSize: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                1
              </div>
              <div>
                <h4 className="font-jockey" style={{ color: '#DA362A', fontSize: 20, margin: '0 0 4px 0' }}>
                  {isEN ? 'Enter Destination' : 'Masukkan Tujuan'}
                </h4>
                <p style={{ fontSize: 14, color: '#4A4A4A', margin: 0, fontFamily: 'var(--font-inter)' }}>
                  {isEN ? 'Choose your starting point and final destination' : 'Pilih lokasi awal dan tujuan akhir kamu'}
                </p>
              </div>
            </div>

            <div
              style={{
                background: '#FFFFFF',
                border: '1.5px solid #E5D5C5',
                borderRadius: 16,
                padding: '20px 22px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              }}
            >
              <div
                className="font-jockey"
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  background: '#DA362A',
                  color: '#FFFFFF',
                  fontSize: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                2
              </div>
              <div>
                <h4 className="font-jockey" style={{ color: '#DA362A', fontSize: 20, margin: '0 0 4px 0' }}>
                  {isEN ? 'RUTEIN finds best routes' : 'RUTEIN carikan pilihan perjalanan'}
                </h4>
                <p style={{ fontSize: 14, color: '#4A4A4A', margin: 0, fontFamily: 'var(--font-inter)' }}>
                  {isEN
                    ? 'We calculate optimal routes based on time, fares, transfers, and live conditions'
                    : 'Kami hitung rute terbaik berdasarkan waktu, biaya, transit, dan kondisi live'}
                </p>
              </div>
            </div>

            <div
              style={{
                background: '#FFFFFF',
                border: '1.5px solid #E5D5C5',
                borderRadius: 16,
                padding: '20px 22px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              }}
            >
              <div
                className="font-jockey"
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  background: '#DA362A',
                  color: '#FFFFFF',
                  fontSize: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                3
              </div>
              <div>
                <h4 className="font-jockey" style={{ color: '#DA362A', fontSize: 20, margin: '0 0 4px 0' }}>
                  {isEN ? 'Choose & start journey' : 'Pilih dan mulai perjalanan'}
                </h4>
                <p style={{ fontSize: 14, color: '#4A4A4A', margin: 0, fontFamily: 'var(--font-inter)' }}>
                  {isEN
                    ? 'Pick your favorite route and depart with complete confidence'
                    : 'Pilih rute favoritmu dan berangkat dengan percaya diri'}
                </p>
              </div>
            </div>
          </div>
        </SmoothReveal>

        <SmoothReveal delayMs={150} style={{ textAlign: 'center', padding: '30px 0 60px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, flexWrap: 'wrap', marginBottom: -4 }}>
            <span className="animated-bird">
              <img
                src={merpatiSvg}
                alt="Merpati Terbang"
                style={{ height: 'clamp(42px, 6.5vw, 88px)', width: 'auto', objectFit: 'contain' }}
              />
            </span>
            <span className="font-jockey" style={{ fontSize: 'clamp(46px, 8.5vw, 108px)', color: '#DA362A', lineHeight: 0.95 }}>
              <SplitText
                key={`callout-rutein-${lang}`}
                text="Rutein"
                delay={50}
                animationFrom={{ opacity: 0, transform: 'translate3d(0, 30px, 0)', filter: 'blur(8px)' }}
                animationTo={{ opacity: 1, transform: 'translate3d(0, 0, 0)', filter: 'blur(0px)' }}
              />
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, flexWrap: 'wrap', marginBottom: -4 }}>
            <span className="font-jockey" style={{ fontSize: 'clamp(42px, 8vw, 100px)', color: '#1E1E1E', lineHeight: 0.95 }}>
              <BlurText
                key={`callout-journey-${lang}`}
                text={isEN ? 'your journey,' : 'perjalananmu'}
                delay={40}
              />
            </span>
            <span className="animated-train-people">
              <img
                src={trainPeopleSvg}
                alt="Train People"
                style={{ height: 'clamp(36px, 6vw, 76px)', width: 'auto', objectFit: 'contain' }}
              />
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, flexWrap: 'wrap' }}>
            <span className="animated-star-glow">
              <img
                src={bintangSvg}
                alt="Bintang"
                style={{ height: 'clamp(30px, 5vw, 62px)', width: 'auto', objectFit: 'contain' }}
              />
            </span>
            <span className="font-jockey" style={{ fontSize: 'clamp(42px, 8vw, 100px)', color: '#1E1E1E', lineHeight: 0.95 }}>
              {isEN ? 'made ' : 'biar '}
              <SplitText
                key={`callout-easy-${lang}`}
                text={isEN ? 'effortless.' : 'gampang.'}
                delay={60}
                style={{ color: '#DA362A', fontStyle: 'italic' }}
                animationFrom={{ opacity: 0, transform: 'translate3d(0, 30px, 0)', filter: 'blur(8px)' }}
                animationTo={{ opacity: 1, transform: 'translate3d(0, 0, 0)', filter: 'blur(0px)' }}
              />
            </span>
          </div>

          {/* Action CTA Button */}
          <div style={{ marginTop: 42 }}>
            <button
              onClick={() => navigate(user ? '/dashboard' : '/login')}
              className="font-jockey shimmer-cta-btn"
              style={{
                background: '#DA362A',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 14,
                padding: '18px 48px',
                fontSize: 23,
                letterSpacing: '0.02em',
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(218, 54, 42, 0.4)',
              }}
            >
              {isEN ? 'Start Journey' : 'Mulai Perjalanan'}
            </button>
          </div>
        </SmoothReveal>
      </section>

      <div
        style={{
          width: '100vw',
          position: 'relative',
          left: '50%',
          right: '50%',
          marginLeft: '-50vw',
          marginRight: '-50vw',
          marginTop: 20,
          overflow: 'hidden',
          lineHeight: 0,
          zIndex: 2,
        }}
      >
        <AnimatedTrainTrackBottom />
      </div>

      <footer
        style={{
          background: '#FCF4ED',
          color: '#1E1E1E',
          padding: '50px 40px 30px',
          maxWidth: 1280,
          margin: '0 auto',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <SmoothReveal>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 40,
              alignItems: 'flex-start',
              marginBottom: 44,
            }}
          >
            <div>
              <img src={logoRuteinSvg} alt="Rutein Logo" style={{ height: 38, objectFit: 'contain', marginBottom: 14 }} />
              <p style={{ fontSize: 13, color: '#555555', margin: 0, lineHeight: 1.55, fontFamily: 'var(--font-inter)' }}>
                {isEN ? (
                  <>
                    Find routes. Choose your trip.
                    <br />
                    Arrive with ease
                  </>
                ) : (
                  <>
                    Temukan rute. Pilih perjalanan.
                    <br />
                    Sampai tujuan
                  </>
                )}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={() => scrollToSection('tentang')}
                className="font-jockey"
                style={{ color: '#1E1E1E', background: 'none', border: 'none', padding: 0, fontSize: 20, letterSpacing: '0.02em', cursor: 'pointer', textAlign: 'left' }}
              >
                {isEN ? 'About' : 'Tentang'}
              </button>
              <button
                onClick={() => scrollToSection('cara-kerja')}
                className="font-jockey"
                style={{ color: '#1E1E1E', background: 'none', border: 'none', padding: 0, fontSize: 20, letterSpacing: '0.02em', cursor: 'pointer', textAlign: 'left' }}
              >
                {isEN ? 'How It Works' : 'Cara Kerja'}
              </button>
              <button
                onClick={() => navigate(user ? '/dashboard' : '/login')}
                className="font-jockey"
                style={{
                  color: '#1E1E1E',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: 20,
                  letterSpacing: '0.02em',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                {user ? 'Dashboard' : isEN ? 'Get Started' : 'Mulai'}
              </button>
            </div>

            <div>
              <h4 className="font-jockey" style={{ fontSize: 18, color: '#1E1E1E', margin: '0 0 14px 0', letterSpacing: '0.02em' }}>
                {isEN ? 'Follow Our Journey!' : 'Ikuti Perjalanan Kami !'}
              </h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <a href="#" className="footer-social-icon" style={{ color: '#1E1E1E', textDecoration: 'none', display: 'flex', alignItems: 'center' }} title="Instagram">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </a>
                <a href="#" className="footer-social-icon" style={{ color: '#1E1E1E', textDecoration: 'none', display: 'flex', alignItems: 'center' }} title="Facebook">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a href="#" className="footer-social-icon" style={{ color: '#1E1E1E', textDecoration: 'none', display: 'flex', alignItems: 'center' }} title="TikTok">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 1 1-2.896-2.896c.244 0 .484.03.714.088V9.387a6.34 6.34 0 1 0 5.627 6.285V8.636a8.216 8.216 0 0 0 4.77 1.495V6.686z" />
                  </svg>
                </a>
                <a href="#" className="footer-social-icon" style={{ color: '#1E1E1E', textDecoration: 'none', display: 'flex', alignItems: 'center' }} title="X">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-jockey" style={{ fontSize: 18, color: '#1E1E1E', margin: '0 0 14px 0', letterSpacing: '0.02em' }}>
                {isEN ? 'Get the Latest Travel Updates!' : 'Dapatkan Informasi Perjalanan Terbaru !'}
              </h4>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  alert(isEN ? 'Thank you for subscribing!' : 'Terima kasih sudah mendaftar!');
                }}
                style={{ display: 'flex', maxWidth: 360 }}
              >
                <input
                  type="email"
                  placeholder={isEN ? 'Enter your email' : 'Masukkan email kamu'}
                  required
                  className="footer-input-focus"
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    borderRadius: '10px 0 0 10px',
                    border: '1.5px solid #D5C5B5',
                    borderRight: 'none',
                    background: 'transparent',
                    outline: 'none',
                    fontSize: 14,
                    fontFamily: 'var(--font-inter)',
                  }}
                />
                <button
                  type="submit"
                  style={{
                    background: '#DA362A',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '0 10px 10px 0',
                    padding: '10px 18px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </form>
            </div>
          </div>

          <div
            style={{
              borderTop: '1px solid #E5D5C5',
              paddingTop: 20,
              textAlign: 'center',
              fontSize: 13,
              color: '#666666',
              fontFamily: 'var(--font-inter)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 700, color: '#1E1E1E' }}>©</span>
            <span style={{ fontWeight: 600, color: '#1E1E1E' }}>2026 RUTEIN</span>
          </div>
        </SmoothReveal>
      </footer>
    </div>
  );
}