// File: server/src/constants/auth.ts
import { env, isProduction } from '../config/env';

export const SESSION_COOKIE_NAME = 'lovique_session';
export const SESSION_TTL_MS = env.sessionTtlDays * 24 * 60 * 60 * 1000;
export const PASSWORD_RESET_TTL_MS = env.passwordResetTtlMinutes * 60 * 1000;

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: isProduction,
  path: '/',
  maxAge: SESSION_TTL_MS,
};

export const CLEAR_SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: isProduction,
  path: '/',
};
