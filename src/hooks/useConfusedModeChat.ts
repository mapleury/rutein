import { useState, useEffect } from 'react';
import { sendConfusedModeMessage, type ConfusedModeMessage } from '@/services/confusedModeService';
import type { ConfusedModeAIContext } from '@/types/confusedMode.types';

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ConfusedModeMessage[];
}

export interface UseConfusedModeChatResult {
  sessions: ChatSession[];
  activeSessionId: string;
  messages: ConfusedModeMessage[];
  sending: boolean;
  sendMessage: (text: string, context: ConfusedModeAIContext) => Promise<void>;
  createNextSession: () => void;
  selectSession: (id: string) => void;
  deleteSession: (id: string) => void;
  clearAllSessions: () => void;
}

export function useConfusedModeChat(userId?: string): UseConfusedModeChatResult {
  const userKey = userId || 'guest';
  const localStorageKey = `rutein_confused_sessions_${userKey}`;

  // Helper to load sessions for user
  const loadSessions = (): ChatSession[] => {
    try {
      const saved = localStorage.getItem(localStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  };

  const [sessions, setSessions] = useState<ChatSession[]>(loadSessions);
  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    const loaded = loadSessions();
    if (loaded.length > 0) return loaded[0].id;
    return `session-${Date.now()}`;
  });

  const [sending, setSending] = useState(false);

  // Synchronize when userId changes
  useEffect(() => {
    const loaded = loadSessions();
    setSessions(loaded);
    if (loaded.length > 0) {
      setActiveSessionId(loaded[0].id);
    } else {
      setActiveSessionId(`session-${Date.now()}`);
    }
  }, [userKey, localStorageKey]);

  // Current active session's messages
  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const messages = activeSession ? activeSession.messages : [];

  // Helper to persist sessions state to LocalStorage
  const saveSessions = (updatedSessions: ChatSession[]) => {
    setSessions(updatedSessions);
    try {
      localStorage.setItem(localStorageKey, JSON.stringify(updatedSessions));
    } catch {}
  };

  const createNextSession = () => {
    const newId = `session-${Date.now()}`;
    setActiveSessionId(newId);
  };

  const selectSession = (id: string) => {
    setActiveSessionId(id);
  };

  const deleteSession = (id: string) => {
    const nextSessions = sessions.filter((s) => s.id !== id);
    saveSessions(nextSessions);
    if (activeSessionId === id) {
      if (nextSessions.length > 0) {
        setActiveSessionId(nextSessions[0].id);
      } else {
        setActiveSessionId(`session-${Date.now()}`);
      }
    }
  };

  const clearAllSessions = () => {
    saveSessions([]);
    setActiveSessionId(`session-${Date.now()}`);
  };

  async function sendMessage(text: string, context: ConfusedModeAIContext) {
    const trimmedText = text.trim();
    if (!trimmedText || sending) return;

    const userMessage: ConfusedModeMessage = { role: 'user', content: trimmedText };
    const currentMessages = activeSession ? activeSession.messages : [];
    const updatedMessages = [...currentMessages, userMessage];

    // Title generation from first prompt
    const sessionTitle =
      activeSession && activeSession.title !== 'Percakapan Baru'
        ? activeSession.title
        : trimmedText.length > 28
        ? `${trimmedText.slice(0, 28)}…`
        : trimmedText;

    const nowIso = new Date().toISOString();

    let updatedSessions: ChatSession[];
    if (activeSession) {
      updatedSessions = sessions.map((s) =>
        s.id === activeSessionId
          ? { ...s, title: sessionTitle, messages: updatedMessages, updatedAt: nowIso }
          : s
      );
    } else {
      const newSession: ChatSession = {
        id: activeSessionId,
        title: sessionTitle,
        createdAt: nowIso,
        updatedAt: nowIso,
        messages: updatedMessages,
      };
      updatedSessions = [newSession, ...sessions];
    }

    saveSessions(updatedSessions);
    setSending(true);

    try {
      const { reply } = await sendConfusedModeMessage(updatedMessages, context);

      const finalMessages: ConfusedModeMessage[] = [...updatedMessages, { role: 'assistant', content: reply }];

      const finalSessions = updatedSessions.map((s) =>
        s.id === activeSessionId ? { ...s, messages: finalMessages, updatedAt: new Date().toISOString() } : s
      );

      saveSessions(finalSessions);
    } catch (error) {
      console.error('Failed to send Confused Mode message:', error);

      const errorMessages: ConfusedModeMessage[] = [
        ...updatedMessages,
        {
          role: 'assistant',
          content: 'Asisten RUTEIN AI mengalami sedikit kendala server. Silakan coba beberapa saat lagi.',
        },
      ];

      const errorSessions = updatedSessions.map((s) =>
        s.id === activeSessionId ? { ...s, messages: errorMessages, updatedAt: new Date().toISOString() } : s
      );

      saveSessions(errorSessions);
    } finally {
      setSending(false);
    }
  }

  return {
    sessions,
    activeSessionId,
    messages,
    sending,
    sendMessage,
    createNextSession,
    selectSession,
    deleteSession,
    clearAllSessions,
  };
}