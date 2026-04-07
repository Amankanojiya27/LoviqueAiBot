// File: frontend/lib/types.ts
export type AuthMode = 'login' | 'register' | 'forgot' | 'reset';
export type UserGender = 'male' | 'female';
export type CompanionPersonality = 'sweet' | 'playful' | 'calm' | 'romantic';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  companionGender: UserGender;
  companionPersonality: CompanionPersonality;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

export interface RegisterInput {
  name: string;
  email: string;
  companionGender: UserGender;
  companionPersonality: CompanionPersonality;
  password: string;
  isAdultConfirmed: boolean;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface UpdatePreferencesInput {
  companionGender: UserGender;
  companionPersonality: CompanionPersonality;
}

export interface PersistentMemory {
  id: string;
  fact: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatSessionSummary {
  sessionId: string;
  title: string;
  messageCount: number;
  lastMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PasswordResetPreview {
  resetToken: string;
  resetUrl: string;
  expiresAt: string;
}

export type ForgotPasswordPreview = PasswordResetPreview;

export interface ChatMessage {
  role: 'user' | 'model';
  parts: string;
}
