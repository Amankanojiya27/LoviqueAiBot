// File: frontend/stores/auth-store.ts
'use client';

import { create } from 'zustand';
import { api } from '@/lib/api';
import type {
  ChangePasswordInput,
  LoginInput,
  PasswordResetPreview,
  RegisterInput,
  ResetPasswordInput,
  SessionUser,
  UpdatePreferencesInput,
} from '@/lib/types';

type AuthRequestKind =
  | 'register'
  | 'login'
  | 'logout'
  | 'forgot-password'
  | 'reset-password'
  | 'change-password'
  | 'preferences'
  | null;

interface AuthStoreState {
  user: SessionUser | null;
  sessionBooting: boolean;
  activeRequest: AuthRequestKind;
  resetPreview: PasswordResetPreview | null;
  loadCurrentUser: () => Promise<SessionUser | null>;
  register: (input: RegisterInput) => Promise<SessionUser>;
  login: (input: LoginInput) => Promise<SessionUser>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<PasswordResetPreview | null>;
  resetPassword: (input: ResetPasswordInput) => Promise<void>;
  changePassword: (input: ChangePasswordInput) => Promise<SessionUser>;
  updatePreferences: (input: UpdatePreferencesInput) => Promise<SessionUser>;
  clearResetPreview: () => void;
}

const withActiveRequest = async <T>(
  set: (partial: Partial<AuthStoreState>) => void,
  request: Exclude<AuthRequestKind, null>,
  action: () => Promise<T>,
): Promise<T> => {
  set({ activeRequest: request });

  try {
    return await action();
  } finally {
    set({ activeRequest: null });
  }
};

export const useAuthStore = create<AuthStoreState>((set) => ({
  user: null,
  sessionBooting: true,
  activeRequest: null,
  resetPreview: null,

  async loadCurrentUser() {
    set({ sessionBooting: true });

    try {
      const user = await api.getCurrentUser();
      set({ user, sessionBooting: false });
      return user;
    } catch (error) {
      set({ sessionBooting: false });
      throw error;
    }
  },

  async register(input) {
    return withActiveRequest(set, 'register', async () => {
      const user = await api.register(input);
      set({ user });
      return user;
    });
  },

  async login(input) {
    return withActiveRequest(set, 'login', async () => {
      const user = await api.login(input);
      set({ user });
      return user;
    });
  },

  async logout() {
    await withActiveRequest(set, 'logout', async () => {
      await api.logout();
      set({
        user: null,
        resetPreview: null,
      });
    });
  },

  async forgotPassword(email) {
    return withActiveRequest(set, 'forgot-password', async () => {
      const preview = await api.forgotPassword(email);
      set({ resetPreview: preview });
      return preview;
    });
  },

  async resetPassword(input) {
    await withActiveRequest(set, 'reset-password', async () => {
      await api.resetPassword(input);
      set({
        user: null,
        resetPreview: null,
      });
    });
  },

  async changePassword(input) {
    return withActiveRequest(set, 'change-password', async () => {
      const user = await api.changePassword(input);
      set({ user });
      return user;
    });
  },

  async updatePreferences(input) {
    return withActiveRequest(set, 'preferences', async () => {
      const user = await api.updatePreferences(input);
      set({ user });
      return user;
    });
  },

  clearResetPreview() {
    set({ resetPreview: null });
  },
}));
