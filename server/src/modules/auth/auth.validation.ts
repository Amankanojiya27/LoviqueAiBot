// File: server/src/modules/auth/auth.validation.ts
import { ApiError } from '../../utils/apiError';
import { assertEnum, assertString, ensurePasswordStrength, normalizeEmail } from '../../utils/validate';
import {
  COMPANION_PERSONALITY_KEYS,
  CompanionPersonality,
  USER_GENDERS,
  UserGender,
} from './profile.constants';

const asObject = (body: unknown): Record<string, unknown> => {
  if (!body || typeof body !== 'object') {
    throw new ApiError(400, 'Request body must be a JSON object.');
  }

  return body as Record<string, unknown>;
};

export interface RegisterPayload {
  name: string;
  email: string;
  companionGender: UserGender;
  companionPersonality: CompanionPersonality;
  password: string;
  isAdultConfirmed: true;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface UpdatePreferencesPayload {
  companionGender: UserGender;
  companionPersonality: CompanionPersonality;
}

export const validateRegisterPayload = (body: unknown): RegisterPayload => {
  const payload = asObject(body);
  const name = assertString(payload.name, 'name', { minLength: 2, maxLength: 60 });
  const email = normalizeEmail(payload.email);
  const companionGender = assertEnum(payload.companionGender, 'companionGender', USER_GENDERS);
  const companionPersonality = assertEnum(
    payload.companionPersonality,
    'companionPersonality',
    COMPANION_PERSONALITY_KEYS,
  );
  const password = assertString(payload.password, 'password', { minLength: 8, maxLength: 128 });
  const isAdultConfirmed = payload.isAdultConfirmed;

  ensurePasswordStrength(password);

  if (isAdultConfirmed !== true) {
    throw new ApiError(
      400,
      'Lovique is currently available only to adults aged 18 or older. Please confirm this to continue.',
    );
  }

  return {
    name,
    email,
    companionGender,
    companionPersonality,
    password,
    isAdultConfirmed,
  };
};

export const validateLoginPayload = (body: unknown): LoginPayload => {
  const payload = asObject(body);

  return {
    email: normalizeEmail(payload.email),
    password: assertString(payload.password, 'password', { minLength: 8, maxLength: 128 }),
  };
};

export const validateForgotPasswordPayload = (body: unknown): ForgotPasswordPayload => {
  const payload = asObject(body);

  return {
    email: normalizeEmail(payload.email),
  };
};

export const validateResetPasswordPayload = (body: unknown): ResetPasswordPayload => {
  const payload = asObject(body);
  const token = assertString(payload.token, 'token', { minLength: 12, maxLength: 256 });
  const newPassword = assertString(payload.newPassword, 'newPassword', {
    minLength: 8,
    maxLength: 128,
  });

  ensurePasswordStrength(newPassword);

  return {
    token,
    newPassword,
  };
};

export const validateChangePasswordPayload = (body: unknown): ChangePasswordPayload => {
  const payload = asObject(body);
  const currentPassword = assertString(payload.currentPassword, 'currentPassword', {
    minLength: 8,
    maxLength: 128,
  });
  const newPassword = assertString(payload.newPassword, 'newPassword', {
    minLength: 8,
    maxLength: 128,
  });

  ensurePasswordStrength(newPassword);

  if (currentPassword === newPassword) {
    throw new ApiError(400, 'Choose a new password that is different from the current one.');
  }

  return {
    currentPassword,
    newPassword,
  };
};

export const validateUpdatePreferencesPayload = (body: unknown): UpdatePreferencesPayload => {
  const payload = asObject(body);

  return {
    companionGender: assertEnum(payload.companionGender, 'companionGender', USER_GENDERS),
    companionPersonality: assertEnum(
      payload.companionPersonality,
      'companionPersonality',
      COMPANION_PERSONALITY_KEYS,
    ),
  };
};
