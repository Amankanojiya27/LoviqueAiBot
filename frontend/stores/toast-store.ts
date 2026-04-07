'use client';

import { create } from 'zustand';

export type ToastTone = 'info' | 'success' | 'error';

export interface AppToast {
  id: string;
  title?: string;
  message: string;
  tone: ToastTone;
}

interface PushToastInput {
  title?: string;
  message: string;
  tone?: ToastTone;
  durationMs?: number;
}

interface ToastStoreState {
  toasts: AppToast[];
  pushToast: (input: PushToastInput) => string;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
}

const DEFAULT_DURATION_MS = 4800;
const ERROR_DURATION_MS = 6200;
const timers = new Map<string, ReturnType<typeof setTimeout>>();

const createToastId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const clearToastTimer = (id: string) => {
  const timer = timers.get(id);

  if (timer) {
    clearTimeout(timer);
    timers.delete(id);
  }
};

export const useToastStore = create<ToastStoreState>((set, get) => ({
  toasts: [],

  pushToast(input) {
    const tone = input.tone ?? 'info';
    const existingToast = get().toasts.find(
      (toast) =>
        toast.message === input.message && toast.title === input.title && toast.tone === tone,
    );

    if (existingToast) {
      clearToastTimer(existingToast.id);

      const durationMs = input.durationMs ?? (tone === 'error' ? ERROR_DURATION_MS : DEFAULT_DURATION_MS);
      timers.set(
        existingToast.id,
        setTimeout(() => {
          get().dismissToast(existingToast.id);
        }, durationMs),
      );

      return existingToast.id;
    }

    const nextToast: AppToast = {
      id: createToastId(),
      title: input.title,
      message: input.message,
      tone,
    };

    set((state) => ({
      toasts: [...state.toasts, nextToast].slice(-4),
    }));

    const durationMs = input.durationMs ?? (tone === 'error' ? ERROR_DURATION_MS : DEFAULT_DURATION_MS);
    timers.set(
      nextToast.id,
      setTimeout(() => {
        get().dismissToast(nextToast.id);
      }, durationMs),
    );

    return nextToast.id;
  },

  dismissToast(id) {
    clearToastTimer(id);
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },

  clearToasts() {
    timers.forEach((timer) => clearTimeout(timer));
    timers.clear();
    set({ toasts: [] });
  },
}));

export const showToast = (input: PushToastInput): string => {
  return useToastStore.getState().pushToast(input);
};
