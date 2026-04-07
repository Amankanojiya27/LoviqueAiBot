// File: server/src/constants/auth.ts
import { env, isProduction } from '../config/env';

export const SESSION_COOKIE_NAME = 'lovique_session';
export const SESSION_TTL_MS = env.sessionTtlDays * 24 * 60 * 60 * 1000;
export const PASSWORD_RESET_TTL_MS = env.passwordResetTtlMinutes * 60 * 1000;
const sessionCookieSameSite = isProduction ? ('none' as const) : ('lax' as const);

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: sessionCookieSameSite,
  secure: isProduction,
  path: '/',
  maxAge: SESSION_TTL_MS,
};

export const CLEAR_SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: sessionCookieSameSite,
  secure: isProduction,
  path: '/',
};
