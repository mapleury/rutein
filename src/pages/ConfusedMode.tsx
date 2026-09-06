import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import merpatiSvg from '@/assets/images/merpati-terbang.svg';
import {
  Sparkles,
  Navigation2,
  MapPin,
  Home,
  Briefcase,
  Zap,
  PiggyBank,
  Send,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Plus,
  MessageSquare,
  Trash2,
  History,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getActiveDisruptions } from '@/services/transportService';
import type { Disruption } from '@/types/database.types';
import type { ConfusedModeLocation } from '@/types/confusedMode.types';

import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { useReverseGeocodedLocation } from '@/hooks/useReverseGeocodedLocation';
import { useNearbyContext } from '@/hooks/useNearbyContext';
import { useRestoredNavigationContext } from '@/hooks/useRestoredNavigationContext';
import { useConfusedModeChat } from '@/hooks/useConfusedModeChat';
import { useLanguage } from '@/contexts/LanguageContext';
import { buildConfusedModeAIContext } from '@/lib/buildConfusedModeAIContext';
import { detectNavigationIntent } from '@/lib/detectNavigationIntent';
import { resolveNavigationForQuery } from '@/lib/resolveNavigationForQuery';
import { AssistantMessageContent } from '@/components/AssistantMessageContent';

export default function ConfusedMode() {
  const { user } = useAuth();
  const { lang, t } = useLanguage();
  const navigate = useNavigate();

  const QUICK_ACTIONS = [
    { text: t('quick.where_am_i'), icon: MapPin },
    { text: t('quick.home_route'), icon: Home },
    { text: t('quick.office_route'), icon: Briefcase },
    { text: t('quick.fastest_route'), icon: Zap },
    { text: t('quick.cheapest_route'), icon: PiggyBank },
  ];
  const { position, loading: locationLoading, error: locationError } = useCurrentLocation();
  const { address, addressVerified, loading: addressLoading } = useReverseGeocodedLocation(position);
  const {
    places: nearbyPlaces,
    transport: nearbyTransport,
    placesStatus,
    transportStatus,
  } = useNearbyContext(position);
  const { route: currentRoute, destination, selectedMapPlace } = useRestoredNavigationContext();

  const {
    sessions,
    activeSessionId,
    messages,
    sending,
    sendMessage,
    createNextSession,
    selectSession,
    deleteSession,
    clearAllSessions,
  } = useConfusedModeChat(user?.id);

  const [disruptions, setDisruptions] = useState<Disruption[]>([]);
  const [input, setInput] = useState('');
  const [resolvingRoute, setResolvingRoute] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 1024
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      }
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSelectSession = (id: string) => {
    selectSession(id);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleCreateNewChat = () => {
    createNextSession();
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  useEffect(() => {
    getActiveDisruptions()
      .then(setDisruptions)
      .catch((error) => {
        console.error('Failed to fetch disruptions:', error);
      });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending, resolvingRoute]);

  const location: ConfusedModeLocation | null = useMemo(() => {
    if (!position) return null;

    return {
      latitude: position.latitude,
      longitude: position.longitude,
      accuracy: position.accuracy,
      address,
      addressVerified,
    };
  }, [position, address, addressVerified]);

  const baseAIContext = useMemo(
    () =>
      buildConfusedModeAIContext({
        location,
        addressLoading,
        nearbyPlaces,
        nearbyTransport,
        placesStatus,
        transportStatus,
        disruptions,
        route: currentRoute,
        destination,
        selectedMapPlace,
      }),
    [
      location,
      addressLoading,
      nearbyPlaces,
      nearbyTransport,
      placesStatus,
      transportStatus,
      disruptions,
      currentRoute,
      destination,
      selectedMapPlace,
    ]
  );

  const nearbyBlocking =
    (placesStatus === 'loading' || transportStatus === 'loading') &&
    nearbyPlaces.length === 0 &&
    nearbyTransport.length === 0;

  function getLocationStatus() {
    if (locationLoading) return t('ai.gps_detecting') || 'Mendeteksi GPS...';
    if (location) return t('ai.gps_connected') || 'GPS Terkini Terhubung';
    return t('ai.gps_unavailable') || 'GPS Tidak Tersedia';
  }

  async function handleSend(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending || resolvingRoute) return;

    setInput('');

    const intent = detectNavigationIntent(trimmed);
    let finalContext = baseAIContext;

    if (intent.isRouteRequest && intent.destinationQuery) {
      setResolvingRoute(true);

      try {
        const { status, navigationResult } = await resolveNavigationForQuery(
          intent.destinationQuery,
          position,
          location?.address ?? null
        );

        finalContext = {
          ...baseAIContext,
          navigationResolutionStatus: status,
          navigationResult,
        };
      } finally {
        setResolvingRoute(false);
      }
    }

    void sendMessage(trimmed, finalContext);
  }

  const inputDisabled = sending || resolvingRoute;

  return (
    <div
      className="confused-mode-page"
      style={{
        height: '100%',
        maxHeight: '100%',
        flex: 1,
        background: '#FCF4ED',
        color: '#1E1E1E',
        fontFamily: 'var(--font-body)',
        display: 'flex',
        overflow: 'hidden',
        position: 'relative',
        width: '100%',
      }}
    >
      <style>{confusedStyles}</style>

      {/* Mobile History Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          className="confused-history-backdrop"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`confused-history-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}
        style={{
          width: isSidebarOpen ? 280 : 0,
          minWidth: isSidebarOpen ? 280 : 0,
          flexShrink: 0,
          height: '100%',
          background: '#FFFFFF',
          borderRight: '1.5px solid #E5D5C5',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Sidebar Brand Header */}
        <div style={{ padding: '14px 16px', borderBottom: '1.5px solid #E5D5C5', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: '#FDF0ED',
                border: '1px solid rgba(218, 54, 42, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={16} color="#DA362A" />
            </div>
            <span className="font-jockey" style={{ fontSize: 19, color: '#1E1E1E', letterSpacing: '0.02em' }}>
              Tanya AI
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, background: '#FDF0ED', color: '#DA362A', padding: '3px 9px', borderRadius: 999, border: '1px solid rgba(218,54,42,0.2)' }}>
              Asisten
            </span>
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="confused-close-sidebar-btn"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#666666',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 6,
              }}
              aria-label="Tutup riwayat"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div style={{ padding: 12, borderBottom: '1.5px solid #E5D5C5', flexShrink: 0 }}>
          {/* New Chat Button */}
          <button
            type="button"
            onClick={handleCreateNewChat}
            className="font-jockey"
            style={{
              width: '100%',
              padding: '11px 16px',
              fontSize: 15,
              borderRadius: 12,
              background: '#DA362A',
              color: '#FFFFFF',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 4px 14px rgba(218, 54, 42, 0.25)',
              transition: 'all 0.15s ease',
            }}
          >
            <Plus size={17} /> {t('ai.new_chat')}
          </button>
        </div>

        {/* Chat Sessions History List */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#666666', textTransform: 'uppercase', paddingLeft: 8, paddingBottom: 4 }}>
            {t('ai.history_title')} ({sessions.length})
          </span>

          {sessions.map((session) => {
            const isActive = session.id === activeSessionId;
            return (
              <div
                key={session.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: 10,
                  background: isActive ? '#FDF0ED' : 'transparent',
                  border: isActive ? '1.5px solid #DA362A' : '1.5px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onClick={() => handleSelectSession(session.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                  <MessageSquare size={15} color={isActive ? '#DA362A' : '#666666'} style={{ flexShrink: 0 }} />
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? '#DA362A' : '#1E1E1E',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {session.title}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSession(session.id);
                  }}
                  title="Hapus sesi ini"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#999999',
                    cursor: 'pointer',
                    padding: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 6,
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}

          {sessions.length === 0 && (
            <p style={{ fontSize: 13, color: '#999999', paddingLeft: 8, fontStyle: 'italic' }}>
              Belum ada riwayat percakapan.
            </p>
          )}
        </div>

        {/* Clear All Sessions Bottom Footer */}
        {sessions.length > 0 && (
          <div style={{ padding: 12, borderTop: '1.5px solid #E5D5C5', flexShrink: 0 }}>
            <button
              type="button"
              onClick={clearAllSessions}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 10,
                background: '#FFFFFF',
                color: '#DA362A',
                border: '1px solid #E5D5C5',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Trash2 size={13} /> Hapus Semua Riwayat
            </button>
          </div>
        )}
      </aside>

      {/* --- MAIN CHAT AREA --- */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0, overflow: 'hidden' }}>
        <div
          className="confused-chat-container"
        >
          {/* Top Header Bar with Sidebar Toggle */}
          <div className="confused-top-bar rutein-slide-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="confused-history-btn"
              style={{
                background: '#FFFFFF',
                border: '1.5px solid #E5D5C5',
                borderRadius: 10,
                padding: '7px 12px',
                color: '#1E1E1E',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12.5,
                fontWeight: 600,
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                transition: 'all 0.15s ease',
                flexShrink: 0,
              }}
            >
              {isSidebarOpen ? <X size={15} /> : <History size={15} color="#DA362A" />}
              <span>{isSidebarOpen ? 'Sembunyikan Riwayat' : `Riwayat Chat (${sessions.length})`}</span>
            </button>

            <div className="confused-top-badges" style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <span
                className="confused-top-badge"
                style={{
                  background: '#FDF0ED',
                  color: '#DA362A',
                  border: '1px solid rgba(218, 54, 42, 0.3)',
                  padding: '4px 10px',
                  borderRadius: 999,
                  fontSize: 11.5,
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  whiteSpace: 'nowrap',
                }}
              >
                <img src={merpatiSvg} alt="AI Rutein" style={{ height: 13, width: 'auto', objectFit: 'contain' }} /> AI RUTEIN Aktif
              </span>
              <span
                className="confused-top-badge"
                style={{
                  background: '#FFFFFF',
                  color: '#1E1E1E',
                  border: '1px solid #E5D5C5',
                  padding: '4px 10px',
                  borderRadius: 999,
                  fontSize: 11.5,
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  whiteSpace: 'nowrap',
                }}
              >
                <MapPin size={12} color="#DA362A" />
                {getLocationStatus()}
              </span>
            </div>
          </div>

          {/* Location Error Warning */}
          {locationError && (
            <div
              className="rutein-alert-in"
              style={{
                background: '#FFF8ED',
                border: '1.5px solid #E5A020',
                color: '#D97706',
                borderRadius: 14,
                padding: '12px 16px',
                fontSize: 13,
                marginBottom: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <AlertTriangle size={16} />
              {locationError}
            </div>
          )}

          {/* Messages Scroll Area */}
          <div
            className="confused-messages-area"
            style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              marginBottom: 8,
              paddingRight: 4,
              minHeight: 0,
            }}
          >
            {messages.length === 0 && (
              <div>
                {/* Welcome Card */}
                <div
                  className="confused-welcome-card rutein-slide-in-1"
                  style={{
                    background: '#FFFFFF',
                    border: '1.5px solid #E5D5C5',
                    borderRadius: 18,
                    padding: '20px 24px',
                    marginBottom: 12,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                  }}
                >
                  <h3 className="font-jockey confused-welcome-title" style={{ fontSize: 21, color: '#1E1E1E', margin: '0 0 6px 0' }}>
                    {t('ai.welcome_title')}
                  </h3>
                  <p className="confused-welcome-desc" style={{ margin: 0, fontSize: 13.5, color: '#4A4A4A', lineHeight: 1.55, fontFamily: 'var(--font-inter)' }}>
                    {t('ai.welcome_desc')}
                  </p>
                </div>

                <span style={{ fontSize: 12.5, color: '#666666', display: 'block', marginBottom: 8, fontWeight: 600 }}>
                  {nearbyBlocking ? t('common.loading') : t('ai.quick_questions_title')}
                </span>

                {/* Quick Action Chips */}
                <div className="confused-quick-grid rutein-fade-up-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
                  {QUICK_ACTIONS.map((action) => {
                    const IconComp = action.icon;
                    return (
                      <button
                        key={action.text}
                        type="button"
                        onClick={() => handleSend(action.text)}
                        disabled={inputDisabled || nearbyBlocking}
                        className="confused-quick-btn"
                        style={{
                          padding: '10px 14px',
                          borderRadius: 12,
                          background: '#FFFFFF',
                          border: '1.5px solid #E5D5C5',
                          color: '#1E1E1E',
                          fontSize: 12.5,
                          fontWeight: 600,
                          textAlign: 'left',
                          cursor: inputDisabled || nearbyBlocking ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            background: '#FDF0ED',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#DA362A',
                            flexShrink: 0,
                          }}
                        >
                          <IconComp size={15} />
                        </div>
                        <span style={{ flex: 1, minWidth: 0, wordBreak: 'break-word' }}>{action.text}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Rendered Active Session Messages */}
            {messages.map((message, index) => {
              const isUser = message.role === 'user';
              const showsRouteCTA =
                !isUser &&
                /rute|naik|stasiun|halte|tarif|tujuan|transit|estimasi|perjalanan|ke/i.test(message.content);

              return (
                <div
                  key={`${message.role}-${index}`}
                  className="rutein-scale-in"
                  style={{
                    maxWidth: '85%',
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    background: isUser ? '#DA362A' : '#FFFFFF',
                    color: isUser ? '#FFFFFF' : '#1E1E1E',
                    border: isUser ? 'none' : '1.5px solid #E5D5C5',
                    borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    padding: '12px 18px',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
                    boxSizing: 'border-box',
                  }}
                >
                  {isUser ? (
                    <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, whiteSpace: 'pre-wrap', fontWeight: 500 }}>
                      {message.content}
                    </p>
                  ) : (
                    <div>
                      <AssistantMessageContent content={message.content} />
                      {showsRouteCTA && (
                        <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid #F0E2D5', display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            onClick={() => navigate('/routes')}
                            className="font-jockey"
                            style={{
                              background: '#FDF0ED',
                              color: '#DA362A',
                              border: '1px solid rgba(218, 54, 42, 0.3)',
                              borderRadius: 999,
                              padding: '5px 12px',
                              fontSize: 12,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            Buka Peta & Perbandingan Rute <ArrowRight size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Loading Indicator when resolving route */}
            {resolvingRoute && (
              <div
                style={{
                  maxWidth: 280,
                  alignSelf: 'flex-start',
                  background: '#FFFFFF',
                  border: '1.5px solid #DA362A',
                  borderRadius: '16px 16px 16px 4px',
                  padding: '12px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  boxShadow: '0 4px 14px rgba(218, 54, 42, 0.1)',
                }}
              >
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#FDF0ED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <RefreshCw size={14} color="#DA362A" className="animate-spin" />
                </div>
                <span style={{ color: '#1E1E1E', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-inter)' }}>
                  Mencari rute terbaik…
                </span>
              </div>
            )}

            {sending && !resolvingRoute && (
              <div
                style={{
                  maxWidth: 300,
                  alignSelf: 'flex-start',
                  background: '#FFFFFF',
                  border: '1.5px solid #E5D5C5',
                  borderRadius: '16px 16px 16px 4px',
                  padding: '14px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: '#FDF0ED',
                    border: '1px solid rgba(218, 54, 42, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Sparkles size={16} color="#DA362A" className="animate-pulse" />
                </div>

                <div>
                  <span style={{ color: '#1E1E1E', fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 2 }}>
                    RUTEIN AI sedang memproses…
                  </span>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#DA362A', display: 'inline-block' }} />
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#DA362A', opacity: 0.6, display: 'inline-block' }} />
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#DA362A', opacity: 0.3, display: 'inline-block' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form
            className="confused-input-form rutein-slide-in-2"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSend(input);
            }}
            style={{
              display: 'flex',
              gap: 8,
              marginBottom: 0,
              marginTop: 'auto',
              paddingTop: 8,
              width: '100%',
              boxSizing: 'border-box',
              flexShrink: 0,
            }}
          >
            <input
              placeholder={
                location ? 'Ketik tujuanmu (misal: Mau ke Monas?)...' : 'Ketik pertanyaan navigasimu...'
              }
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={inputDisabled}
              autoComplete="off"
              className="confused-input-field"
              style={{
                flex: 1,
                minWidth: 0,
                padding: '12px 16px',
                background: '#FFFFFF',
                border: '1.5px solid #E5D5C5',
                borderRadius: 14,
                fontSize: 13.5,
                fontWeight: 600,
                color: '#1E1E1E',
                outline: 'none',
                fontFamily: 'var(--font-inter)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                boxSizing: 'border-box',
              }}
            />

            <button
              type="submit"
              className="font-jockey confused-send-btn"
              disabled={inputDisabled || !input.trim() || nearbyBlocking}
              style={{
                padding: '0 20px',
                fontSize: 16,
                borderRadius: 14,
                background: '#DA362A',
                color: '#FFFFFF',
                border: 'none',
                cursor: inputDisabled || !input.trim() || nearbyBlocking ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                flexShrink: 0,
                whiteSpace: 'nowrap',
                opacity: inputDisabled || !input.trim() || nearbyBlocking ? 0.6 : 1,
                boxShadow: '0 4px 14px rgba(218, 54, 42, 0.25)',
              }}
            >
              <Send size={16} /> Kirim
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

const confusedStyles = `
  .confused-chat-container {
    max-width: 860px;
    width: 100%;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    flex: 1;
    height: 100%;
    min-height: 0;
    box-sizing: border-box;
    padding: 12px 16px 10px 16px;
    overflow: hidden;
  }

  @media (max-width: 767px) {
    .confused-chat-container {
      padding: 10px 12px 8px 12px !important;
    }
    .confused-history-sidebar {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      bottom: 0 !important;
      width: 280px !important;
      max-width: 85vw !important;
      height: 100dvh !important;
      z-index: 9999 !important;
      box-shadow: 8px 0 28px rgba(0, 0, 0, 0.28) !important;
      border-radius: 0 20px 20px 0 !important;
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
    }
    .confused-history-sidebar.closed {
      transform: translateX(-105%) !important;
      visibility: hidden !important;
    }
    .confused-history-sidebar.open {
      transform: translateX(0) !important;
      visibility: visible !important;
    }
    .confused-history-backdrop {
      display: block;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.45);
      backdrop-filter: blur(3px);
      -webkit-backdrop-filter: blur(3px);
      z-index: 9998;
    }
    .confused-close-sidebar-btn {
      display: flex !important;
    }
    .confused-quick-grid {
      grid-template-columns: 1fr !important;
    }
    .confused-welcome-card {
      padding: 14px 16px !important;
    }
    .confused-welcome-title {
      font-size: 18px !important;
    }
    .confused-welcome-desc {
      font-size: 12.5px !important;
    }
    .confused-input-field {
      padding: 10px 12px !important;
      font-size: 13px !important;
    }
    .confused-send-btn {
      padding: 0 14px !important;
      font-size: 15px !important;
    }
  }

  @media (min-width: 768px) {
    .confused-history-backdrop {
      display: none !important;
    }
    .confused-close-sidebar-btn {
      display: none !important;
    }
    .confused-history-sidebar {
      position: relative;
      transition: width 0.25s cubic-bezier(0.16, 1, 0.3, 1), min-width 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;
    }
    .confused-history-sidebar.closed {
      width: 0 !important;
      min-width: 0 !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }
    .confused-history-sidebar.open {
      width: 280px !important;
      min-width: 280px !important;
      opacity: 1 !important;
    }
  }
`;