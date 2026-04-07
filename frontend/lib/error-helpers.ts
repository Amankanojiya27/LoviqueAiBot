import { ApiRequestError } from './api';

const SERVICE_PATTERN =
  /waking up|temporarily unavailable|reconnect|needs a moment|try again in a moment|try again in a few seconds|little busy|hiccup/i;

export const extractErrorMessage = (error: unknown): string => {
  if (error instanceof ApiRequestError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
};

export const isServiceToastWorthyError = (error: unknown): boolean => {
  if (error instanceof ApiRequestError) {
    return error.status >= 500 || error.status === 429 || SERVICE_PATTERN.test(error.message);
  }

  if (error instanceof Error) {
    return SERVICE_PATTERN.test(error.message);
  }

  return false;
};

export const getServiceToastTitle = (error: unknown): string => {
  const message = extractErrorMessage(error).toLowerCase();

  if (message.includes('waking up')) {
    return 'Lovique is waking up';
  }

  if (message.includes('busy')) {
    return 'Lovique is a little busy';
  }

  if (message.includes('reconnect') || message.includes('temporarily unavailable')) {
    return 'Lovique needs a moment';
  }

  return 'Service update';
};
