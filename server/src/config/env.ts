// File: server/src/config/env.ts
import dotenv from 'dotenv';

dotenv.config();

const parsePositiveNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parseString = (value: string | undefined, fallback = ''): string => {
  const normalized = value?.trim();
  return normalized ? normalized : fallback;
};

const parseOrigins = (value: string | undefined, fallback: string[]): string[] => {
  const origins = value
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins && origins.length > 0 ? origins : fallback;
};

export const env = {
  nodeEnv: parseString(process.env.NODE_ENV, 'development'),
  port: parsePositiveNumber(process.env.PORT, 8002),
  mongodbUri: parseString(process.env.MONGODB_URI),
  geminiApiKey: parseString(process.env.GEMINI_API_KEY),
  geminiModel: parseString(process.env.GEMINI_MODEL, 'gemini-2.5-flash'),
  passwordResetEmailBridgeUrl: parseString(process.env.PASSWORD_RESET_EMAIL_BRIDGE_URL),
  passwordResetEmailSecret: parseString(process.env.PASSWORD_RESET_EMAIL_SECRET),
  clientOrigins: parseOrigins(process.env.CLIENT_ORIGINS ?? process.env.CLIENT_URL, [
    'http://localhost:3000',
  ]),
  appUrl: parseString(process.env.APP_URL, 'http://localhost:3000'),
  sessionTtlDays: parsePositiveNumber(process.env.SESSION_TTL_DAYS, 7),
  passwordResetTtlMinutes: parsePositiveNumber(process.env.PASSWORD_RESET_TTL_MINUTES, 15),
};

export const isProduction = env.nodeEnv === 'production';
