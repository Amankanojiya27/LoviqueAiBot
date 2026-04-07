// File: frontend/lib/api.ts
import type {
  ChangePasswordInput,
  ChatMessage,
  ChatSessionSummary,
  ForgotPasswordPreview,
  LoginInput,
  PersistentMemory,
  RegisterInput,
  ResetPasswordInput,
  SessionUser,
  UpdatePreferencesInput,
} from './types';

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
  details?: unknown;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8002/api/v1';
const REQUEST_TIMEOUT_MS = 12000;
const WAKE_TIMEOUT_MS = 25000;
const SERVICE_WAKE_MESSAGE =
  'Lovique is waking up right now. Please give it a few seconds and try again.';
const TEMPORARY_SERVICE_MESSAGE =
  'Lovique is temporarily unavailable right now. Please try again in a moment.';

let wakeServerPromise: Promise<boolean> | null = null;

export class ApiRequestError extends Error {
  public readonly status: number;
  public readonly details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.details = details;
  }
}

const isGenericServerMessage = (message: string): boolean => {
  return (
    !message ||
    /request failed|internal server error|server error|service unavailable|bad gateway|gateway timeout|not responding|failed to fetch/i.test(
      message,
    )
  );
};

const isSleepyStatus = (status: number): boolean => {
  return [408, 502, 503, 504, 520, 521, 522, 523, 524].includes(status);
};

const fetchWithTimeout = async (
  input: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
};

const warmServer = async (): Promise<boolean> => {
  if (wakeServerPromise) {
    return wakeServerPromise;
  }

  wakeServerPromise = (async () => {
    try {
      const response = await fetchWithTimeout(
        `${API_BASE_URL}/health`,
        {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        },
        WAKE_TIMEOUT_MS,
      );

      return response.ok;
    } catch {
      return false;
    } finally {
      wakeServerPromise = null;
    }
  })();

  return wakeServerPromise;
};

const toFriendlyServerMessage = (status: number, message: string): string => {
  if (isSleepyStatus(status) && isGenericServerMessage(message)) {
    return SERVICE_WAKE_MESSAGE;
  }

  if (status >= 500 && isGenericServerMessage(message)) {
    return TEMPORARY_SERVICE_MESSAGE;
  }

  return message;
};

const toNetworkError = (): ApiRequestError => {
  return new ApiRequestError(SERVICE_WAKE_MESSAGE, 503, {
    code: 'server-waking-up',
  });
};

const request = async <T>(
  path: string,
  init: RequestInit = {},
  shouldRetryAfterWake = true,
): Promise<ApiResponse<T>> => {
  const headers = new Headers(init.headers);

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;

  try {
    response = await fetchWithTimeout(
      `${API_BASE_URL}${path}`,
      {
        ...init,
        headers,
        credentials: 'include',
        cache: 'no-store',
      },
      REQUEST_TIMEOUT_MS,
    );
  } catch {
    if (shouldRetryAfterWake) {
      const wokeUp = await warmServer();

      if (wokeUp) {
        return request<T>(path, init, false);
      }
    }

    throw toNetworkError();
  }

  const text = await response.text();
  let payload: ApiResponse<T> = {
    success: response.ok,
    message: response.ok ? 'Request completed.' : 'Request failed.',
  };

  if (text) {
    try {
      payload = JSON.parse(text) as ApiResponse<T>;
    } catch {
      payload.message = text;
    }
  }

  if (!response.ok) {
    const friendlyMessage = toFriendlyServerMessage(response.status, payload.message);

    if (shouldRetryAfterWake && friendlyMessage === SERVICE_WAKE_MESSAGE) {
      const wokeUp = await warmServer();

      if (wokeUp) {
        return request<T>(path, init, false);
      }
    }

    throw new ApiRequestError(friendlyMessage, response.status, payload.details);
  }

  return payload;
};

export const api = {
  async getCurrentUser(): Promise<SessionUser | null> {
    try {
      const response = await request<{ user: SessionUser }>('/auth/me', { method: 'GET' });
      return response.data?.user ?? null;
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) {
        return null;
      }

      throw error;
    }
  },

  async register(input: RegisterInput): Promise<SessionUser> {
    const response = await request<{ user: SessionUser }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });

    return response.data!.user;
  },

  async login(input: LoginInput): Promise<SessionUser> {
    const response = await request<{ user: SessionUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    });

    return response.data!.user;
  },

  async logout(): Promise<void> {
    await request('/auth/logout', {
      method: 'POST',
    });
  },

  async forgotPassword(email: string): Promise<ForgotPasswordPreview | null> {
    const response = await request<{ preview: ForgotPasswordPreview | null }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    return response.data?.preview ?? null;
  },

  async resetPassword(input: ResetPasswordInput): Promise<void> {
    await request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async changePassword(input: ChangePasswordInput): Promise<SessionUser> {
    const response = await request<{ user: SessionUser }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(input),
    });

    return response.data!.user;
  },

  async updatePreferences(input: UpdatePreferencesInput): Promise<SessionUser> {
    const response = await request<{ user: SessionUser }>('/auth/preferences', {
      method: 'PATCH',
      body: JSON.stringify(input),
    });

    return response.data!.user;
  },

  async getMemories(): Promise<PersistentMemory[]> {
    const response = await request<{ memories: PersistentMemory[] }>('/auth/memories', {
      method: 'GET',
    });

    return response.data?.memories ?? [];
  },

  async clearMemories(): Promise<PersistentMemory[]> {
    const response = await request<{ memories: PersistentMemory[] }>('/auth/memories', {
      method: 'DELETE',
    });

    return response.data?.memories ?? [];
  },

  async getChatHistory(sessionId: string): Promise<ChatMessage[]> {
    const response = await request<{ history: ChatMessage[] }>(`/chat/sessions/${sessionId}`, {
      method: 'GET',
    });

    return response.data?.history ?? [];
  },

  async listChatSessions(): Promise<ChatSessionSummary[]> {
    const response = await request<{ sessions: ChatSessionSummary[] }>('/chat/sessions', {
      method: 'GET',
    });

    return response.data?.sessions ?? [];
  },

  async renameChatSession(sessionId: string, title: string): Promise<ChatSessionSummary> {
    const response = await request<{ session: ChatSessionSummary }>(`/chat/sessions/${sessionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ title }),
    });

    return response.data!.session;
  },

  async deleteChatSession(sessionId: string): Promise<void> {
    await request(`/chat/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  },

  async sendChatMessage(
    sessionId: string,
    message: string,
  ): Promise<{
    reply: string;
    history: ChatMessage[];
    persistentMemories: PersistentMemory[];
    session: ChatSessionSummary;
  }> {
    const response = await request<{
      reply: string;
      history: ChatMessage[];
      persistentMemories: PersistentMemory[];
      session: ChatSessionSummary;
    }>('/chat/messages', {
      method: 'POST',
      body: JSON.stringify({ sessionId, message }),
    });

    return response.data!;
  },
};
