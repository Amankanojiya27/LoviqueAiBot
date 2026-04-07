// File: server/src/utils/validate.ts
import { ApiError } from './apiError';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const assertString = (
  value: unknown,
  fieldName: string,
  options?: { minLength?: number; maxLength?: number },
): string => {
  if (typeof value !== 'string') {
    throw new ApiError(400, `${fieldName} is required.`);
  }

  const normalized = value.trim();

  if (!normalized) {
    throw new ApiError(400, `${fieldName} is required.`);
  }

  if (options?.minLength && normalized.length < options.minLength) {
    throw new ApiError(
      400,
      `${fieldName} must be at least ${options.minLength} characters long.`,
    );
  }

  if (options?.maxLength && normalized.length > options.maxLength) {
    throw new ApiError(
      400,
      `${fieldName} must be at most ${options.maxLength} characters long.`,
    );
  }

  return normalized;
};

export const normalizeEmail = (value: unknown): string => {
  const email = assertString(value, 'email', { minLength: 6, maxLength: 254 }).toLowerCase();

  if (!EMAIL_PATTERN.test(email)) {
    throw new ApiError(400, 'Please provide a valid email address.');
  }

  return email;
};

export const ensurePasswordStrength = (password: string): void => {
  const issues: string[] = [];

  if (!/[a-z]/i.test(password)) {
    issues.push('Password must include at least one letter.');
  }

  if (!/[0-9]/.test(password)) {
    issues.push('Password must include at least one number.');
  }

  if (!/[^a-zA-Z0-9]/.test(password)) {
    issues.push('Password must include at least one special character.');
  }

  if (issues.length > 0) {
    throw new ApiError(400, issues[0], { issues });
  }
};

export const assertEnum = <T extends string>(
  value: unknown,
  fieldName: string,
  allowedValues: readonly T[],
): T => {
  const normalized = assertString(value, fieldName);

  if (!allowedValues.includes(normalized as T)) {
    throw new ApiError(400, `${fieldName} must be one of: ${allowedValues.join(', ')}.`);
  }

  return normalized as T;
};
