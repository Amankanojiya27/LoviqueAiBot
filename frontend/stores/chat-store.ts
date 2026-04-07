// File: frontend/stores/chat-store.ts
'use client';

import { create } from 'zustand';
import { api } from '@/lib/api';
import {
  extractErrorMessage,
  getServiceToastTitle,
  isServiceToastWorthyError,
} from '@/lib/error-helpers';
import type { ChatMessage, ChatSessionSummary, PersistentMemory } from '@/lib/types';
import { showToast } from './toast-store';

type ChatRequestKind = 'clear-memories' | 'rename-session' | 'delete-session' | null;

interface ChatStoreState {
  sessionId: string;
  messages: ChatMessage[];
  memories: PersistentMemory[];
  sessions: ChatSessionSummary[];
  chatBusy: boolean;
  sessionsLoading: boolean;
  chatError: string;
  activeRequest: ChatRequestKind;
  loadSessions: () => Promise<void>;
  loadHistory: () => Promise<void>;
  loadMemories: () => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  openSession: (sessionId: string) => void;
  renameSession: (sessionId: string, title: string) => Promise<ChatSessionSummary>;
  deleteSession: (sessionId: string) => Promise<void>;
  clearMemories: () => Promise<PersistentMemory[]>;
  startFreshChat: () => void;
  resetState: () => void;
}

const createSessionId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const createInitialChatState = () => ({
  sessionId: createSessionId(),
  messages: [] as ChatMessage[],
  memories: [] as PersistentMemory[],
  sessions: [] as ChatSessionSummary[],
  chatBusy: false,
  sessionsLoading: false,
  chatError: '',
  activeRequest: null as ChatRequestKind,
});

const sortSessions = (sessions: ChatSessionSummary[]): ChatSessionSummary[] => {
  return [...sessions].sort(
    (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  );
};

export const useChatStore = create<ChatStoreState>((set, get) => ({
  ...createInitialChatState(),

  async loadSessions() {
    set({ sessionsLoading: true });

    try {
      const sessions = await api.listChatSessions();
      set({
        sessions: sortSessions(sessions),
        sessionsLoading: false,
      });
    } catch (error) {
      if (isServiceToastWorthyError(error)) {
        showToast({
          tone: 'error',
          title: getServiceToastTitle(error),
          message: extractErrorMessage(error),
        });
      }

      set({ sessionsLoading: false });
      throw error;
    }
  },

  async loadHistory() {
    const { sessionId } = get();

    try {
      const history = await api.getChatHistory(sessionId);
      set({
        messages: history,
        chatError: '',
      });
    } catch (error) {
      if (isServiceToastWorthyError(error)) {
        showToast({
          tone: 'error',
          title: getServiceToastTitle(error),
          message: extractErrorMessage(error),
        });
      }

      set({
        chatError: extractErrorMessage(error),
      });
      throw error;
    }
  },

  async loadMemories() {
    try {
      const memories = await api.getMemories();
      set({ memories });
    } catch (error) {
      throw error;
    }
  },

  async sendMessage(message) {
    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      return;
    }

    const { messages, sessionId } = get();
    const optimisticMessages = [...messages, { role: 'user', parts: trimmedMessage } as ChatMessage];

    set({
      chatBusy: true,
      chatError: '',
      messages: optimisticMessages,
    });

    try {
      const result = await api.sendChatMessage(sessionId, trimmedMessage);
      set({
        messages: result.history,
        memories: result.persistentMemories,
        sessions: sortSessions([
          result.session,
          ...get().sessions.filter((entry) => entry.sessionId !== result.session.sessionId),
        ]),
      });
    } catch (error) {
      if (isServiceToastWorthyError(error)) {
        showToast({
          tone: 'error',
          title: getServiceToastTitle(error),
          message: extractErrorMessage(error),
        });
      }

      set({
        messages,
        chatError: extractErrorMessage(error),
      });
      throw error;
    } finally {
      set({ chatBusy: false });
    }
  },

  openSession(sessionId) {
    set({
      sessionId,
      messages: [],
      chatError: '',
    });
  },

  async renameSession(sessionId, title) {
    set({ activeRequest: 'rename-session' });

    try {
      const session = await api.renameChatSession(sessionId, title);
      set({
        sessions: sortSessions(
          get().sessions.map((entry) => (entry.sessionId === session.sessionId ? session : entry)),
        ),
      });
      return session;
    } finally {
      set({ activeRequest: null });
    }
  },

  async deleteSession(sessionId) {
    set({ activeRequest: 'delete-session' });

    try {
      await api.deleteChatSession(sessionId);
      const nextSessions = get().sessions.filter((entry) => entry.sessionId !== sessionId);
      const currentSessionId = get().sessionId;

      set({
        sessions: nextSessions,
      });

      if (currentSessionId === sessionId) {
        set({
          sessionId: createSessionId(),
          messages: [],
          chatError: '',
        });
      }
    } finally {
      set({ activeRequest: null });
    }
  },

  async clearMemories() {
    set({ activeRequest: 'clear-memories' });

    try {
      const memories = await api.clearMemories();
      set({ memories });
      return memories;
    } finally {
      set({ activeRequest: null });
    }
  },

  startFreshChat() {
    set({
      sessionId: createSessionId(),
      messages: [],
      chatError: '',
    });
  },

  resetState() {
    set(createInitialChatState());
  },
}));
