// File: server/src/modules/chat/chat.validation.ts
import { ApiError } from '../../utils/apiError';
import { assertString } from '../../utils/validate';

const asObject = (body: unknown): Record<string, unknown> => {
  if (!body || typeof body !== 'object') {
    throw new ApiError(400, 'Request body must be a JSON object.');
  }

  return body as Record<string, unknown>;
};

export interface SendMessagePayload {
  sessionId: string;
  message: string;
}

export interface UpdateSessionPayload {
  title: string;
}

export const validateSendMessagePayload = (body: unknown): SendMessagePayload => {
  const payload = asObject(body);

  return {
    sessionId: validateSessionIdParam(payload.sessionId),
    message: assertString(payload.message, 'message', {
      minLength: 1,
      maxLength: 2000,
    }),
  };
};

export const validateSessionIdParam = (value: unknown): string => {
  return assertString(value, 'sessionId', {
    minLength: 3,
    maxLength: 120,
  });
};

export const validateUpdateSessionPayload = (body: unknown): UpdateSessionPayload => {
  const payload = asObject(body);

  return {
    title: assertString(payload.title, 'title', {
      minLength: 2,
      maxLength: 80,
    }),
  };
};
