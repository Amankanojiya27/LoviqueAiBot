// File: server/src/modules/auth/auth.types.ts
import type { CompanionPersonality, UserGender } from './profile.constants';

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  companionGender: UserGender;
  companionPersonality: CompanionPersonality;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

export interface PersistentMemory {
  id: string;
  fact: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthRequestContext {
  user: PublicUser;
  sessionId: string;
}
