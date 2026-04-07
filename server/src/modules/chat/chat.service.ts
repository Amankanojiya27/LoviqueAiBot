// File: server/src/modules/chat/chat.service.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../config/env';
import { PublicUser } from '../auth/auth.types';
import {
  COMPANION_PERSONALITY_OPTIONS,
  DEFAULT_COMPANION_PERSONALITY,
} from '../auth/profile.constants';
import { buildPersistentMemoryBlock, mergeUserMemories, serializePersistentMemories } from '../auth/user.memory';
import { ApiError } from '../../utils/apiError';
import { User } from '../auth/user.model';
import { ChatSession } from './chat.model';
import { ChatMessage, ChatSessionSummary } from './chat.types';

const MAX_STORED_MESSAGES = 20;
const MAX_PROMPT_MESSAGES = 8;
const MAX_PROMPT_CHARS = 3600;
const MAX_HISTORY_MESSAGE_CHARS = 420;
const MAX_MEMORY_ENTRIES = 6;
const MAX_MEMORY_CHARS = 900;
const MAX_OUTPUT_TOKENS = 420;
const MAX_SESSION_TITLE_CHARS = 60;
const MAX_SESSION_PREVIEW_CHARS = 120;

let cachedClient: GoogleGenerativeAI | null = null;

const getClient = (): GoogleGenerativeAI => {
  if (!env.geminiApiKey) {
    throw new ApiError(
      503,
      'Chat is temporarily unavailable while Lovique reconnects to its AI service. Please try again shortly.',
      { code: 'gemini-not-configured' },
    );
  }

  if (!cachedClient) {
    cachedClient = new GoogleGenerativeAI(env.geminiApiKey);
  }

  return cachedClient;
};

const getProviderStatus = (error: unknown): number | null => {
  const providerError = error as { status?: unknown };
  return typeof providerError?.status === 'number' ? providerError.status : null;
};

const getProviderMessage = (error: unknown): string => {
  const providerError = error as { message?: unknown };
  return typeof providerError?.message === 'string' ? providerError.message.toLowerCase() : '';
};

const isProviderAuthFailure = (status: number | null, message: string): boolean => {
  return (
    status === 401 ||
    status === 403 ||
    /api key|expired|revoked|unauthori[sz]ed|permission|authentication|credential/.test(message)
  );
};

const isProviderRateLimitFailure = (status: number | null, message: string): boolean => {
  return status === 429 || /quota|rate limit|too many requests|resource exhausted/.test(message);
};

const isProviderAvailabilityFailure = (status: number | null, message: string): boolean => {
  return (
    (typeof status === 'number' && status >= 500) ||
    /service unavailable|temporarily unavailable|timed out|deadline|network|fetch|overloaded/.test(
      message,
    )
  );
};

const toProviderApiError = (error: unknown): ApiError => {
  const status = getProviderStatus(error);
  const message = getProviderMessage(error);

  console.error('Gemini provider error:', error);

  if (status === 404) {
    return new ApiError(
      503,
      'Lovique is reconnecting to its chat service right now. Please try again shortly.',
      { code: 'gemini-model-unavailable' },
    );
  }

  if (isProviderAuthFailure(status, message)) {
    return new ApiError(
      503,
      'Lovique is updating its AI connection right now. Please try again in a little while.',
      { code: 'gemini-auth-unavailable' },
    );
  }

  if (isProviderRateLimitFailure(status, message)) {
    return new ApiError(
      429,
      'Lovique is a little busy right now. Please wait a moment and try again.',
      { code: 'gemini-rate-limited' },
    );
  }

  if (isProviderAvailabilityFailure(status, message)) {
    return new ApiError(
      503,
      'Lovique is waking up its chat service right now. Please try again in a few seconds.',
      { code: 'gemini-temporarily-unavailable' },
    );
  }

  return new ApiError(502, 'Lovique could not reply just now. Please try again in a moment.', {
    code: 'gemini-request-failed',
  });
};

const normalizeMessageText = (value: string): string => {
  return value.replace(/\s+/g, ' ').trim();
};

const truncateText = (value: string, maxChars: number): string => {
  const normalized = normalizeMessageText(value);

  if (normalized.length <= maxChars) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxChars - 3)).trimEnd()}...`;
};

const buildAutoTitle = (value: string): string => {
  const normalized = normalizeMessageText(value);
  const stripped = normalized.replace(/^[^a-zA-Z0-9]+/, '');

  if (!stripped) {
    return 'New conversation';
  }

  return truncateText(stripped, MAX_SESSION_TITLE_CHARS);
};

const buildSessionSummary = (session: {
  sessionId: string;
  title?: string | null;
  history: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}): ChatSessionSummary => {
  const firstUserMessage = session.history.find((entry) => entry.role === 'user')?.parts ?? '';
  const lastMessage =
    session.history.length > 0 ? session.history[session.history.length - 1]?.parts ?? null : null;

  return {
    sessionId: session.sessionId,
    title: session.title?.trim() || buildAutoTitle(firstUserMessage || 'New conversation'),
    messageCount: session.history.length,
    lastMessage: lastMessage ? truncateText(lastMessage, MAX_SESSION_PREVIEW_CHARS) : null,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  };
};

const buildConversationMemory = (history: ChatMessage[], userName: string): string => {
  const olderMessages = history.slice(0, Math.max(0, history.length - MAX_PROMPT_MESSAGES));

  if (olderMessages.length === 0) {
    return '';
  }

  const memoryLines = olderMessages.slice(-MAX_MEMORY_ENTRIES).map((entry) => {
    const speaker = entry.role === 'user' ? userName : 'Lovique';
    return `${speaker}: ${truncateText(entry.parts, 120)}`;
  });

  return truncateText(memoryLines.join('\n'), MAX_MEMORY_CHARS);
};

const buildPromptHistory = (history: ChatMessage[]): ChatMessage[] => {
  const recentMessages = history.slice(-MAX_PROMPT_MESSAGES);
  const promptHistory: ChatMessage[] = [];
  let usedChars = 0;

  for (let index = recentMessages.length - 1; index >= 0; index -= 1) {
    const entry = recentMessages[index];
    const clippedMessage = truncateText(entry.parts, MAX_HISTORY_MESSAGE_CHARS);

    if (usedChars + clippedMessage.length > MAX_PROMPT_CHARS && promptHistory.length > 0) {
      break;
    }

    promptHistory.unshift({
      role: entry.role,
      parts: clippedMessage,
    });
    usedChars += clippedMessage.length;
  }

  return promptHistory;
};

const buildSystemInstruction = (
  user: PublicUser,
  conversationMemory: string,
  persistentMemory: string,
): string => {
  const companionGender = user.companionGender;
  const relationshipRole = companionGender === 'female' ? 'girlfriend' : 'boyfriend';
  const personality =
    COMPANION_PERSONALITY_OPTIONS[user.companionPersonality] ??
    COMPANION_PERSONALITY_OPTIONS[DEFAULT_COMPANION_PERSONALITY];
  const persistentMemoryBlock = persistentMemory
    ? `\nLong-term memory about the user:\n${persistentMemory}\n`
    : '';
  const memoryBlock = conversationMemory
    ? `\nConversation memory to keep in mind:\n${conversationMemory}\n`
    : '';

  return `
You are Lovique, an AI companion texting ${user.name} in a warm one-to-one chat.
Present yourself with a ${companionGender} energy, like a caring ${relationshipRole}, because that is the companion style the user chose.

Personality baseline:
- ${personality.label}: ${personality.instruction}
${persistentMemoryBlock}
${memoryBlock}

Important rules:
1. Do not sound robotic, generic, or detached.
2. Keep replies natural, warm, and conversational.
3. Be affectionate and engaging, but do not become explicit or sexual.
4. Ask thoughtful follow-up questions when it fits naturally.
5. Use emojis lightly and only when they feel natural.
6. Stay emotionally present and keep the conversation feeling personal.
7. If the user shares stress or sadness, respond gently and supportively.
8. Keep replies concise by default unless the user clearly asks for a longer answer.
9. Use remembered facts naturally when they are relevant, and do not invent memories that were not provided.
`;
};

export const sendChatMessage = async ({
  userId,
  userProfile,
  sessionId,
  message,
}: {
  userId: string;
  userProfile: PublicUser;
  sessionId: string;
  message: string;
}): Promise<{
  reply: string;
  history: ChatMessage[];
  persistentMemories: ReturnType<typeof serializePersistentMemories>;
  session: ChatSessionSummary;
}> => {
  let session = await ChatSession.findOne({ userId, sessionId });

  if (!session) {
    session = new ChatSession({
      userId,
      sessionId,
      title: null,
      history: [],
    });
  }

  const history = session.history.map((entry) => ({
    role: entry.role,
    parts: entry.parts,
  }));
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  const memoryUpdate = mergeUserMemories(user.memoryFacts, message);
  const persistentMemory = buildPersistentMemoryBlock(memoryUpdate.memories);
  const conversationMemory = buildConversationMemory(history, userProfile.name);
  const promptHistory = buildPromptHistory(history);

  const model = getClient().getGenerativeModel({
    model: env.geminiModel,
    systemInstruction: buildSystemInstruction(userProfile, conversationMemory, persistentMemory),
  });

  const chat = model.startChat({
    history: promptHistory.map((entry) => ({
      role: entry.role,
      parts: [{ text: entry.parts }],
    })),
    generationConfig: {
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      temperature: 0.9,
      topP: 0.9,
      topK: 40,
    },
  });

  let reply: string;

  try {
    const result = await chat.sendMessage(message);
    reply = result.response.text();
  } catch (error) {
    throw toProviderApiError(error);
  }

  const updatedHistory = [
    ...history,
    { role: 'user', parts: message } as ChatMessage,
    { role: 'model', parts: reply } as ChatMessage,
  ].slice(-MAX_STORED_MESSAGES);

  if (!session.title) {
    const firstUserMessage = updatedHistory.find((entry) => entry.role === 'user')?.parts ?? message;
    session.title = buildAutoTitle(firstUserMessage);
  }

  session.history = updatedHistory;
  user.companionGender = userProfile.companionGender;
  user.companionPersonality = userProfile.companionPersonality;
  user.memoryFacts = memoryUpdate.memories;
  await Promise.all([session.save(), memoryUpdate.changed ? user.save() : Promise.resolve()]);

  return {
    reply,
    history: updatedHistory,
    persistentMemories: serializePersistentMemories(memoryUpdate.memories),
    session: buildSessionSummary({
      sessionId: session.sessionId,
      title: session.title,
      history: updatedHistory,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    }),
  };
};

export const getChatHistory = async (userId: string, sessionId: string): Promise<ChatMessage[]> => {
  const session = await ChatSession.findOne({ userId, sessionId });

  if (!session) {
    return [];
  }

  return session.history.map((entry) => ({
    role: entry.role,
    parts: entry.parts,
  }));
};

export const listChatSessions = async (userId: string): Promise<ChatSessionSummary[]> => {
  const sessions = await ChatSession.find({ userId }).sort({ updatedAt: -1 });

  return sessions.map((session) =>
    buildSessionSummary({
      sessionId: session.sessionId,
      title: session.title,
      history: session.history.map((entry) => ({
        role: entry.role,
        parts: entry.parts,
      })),
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    }),
  );
};

export const renameChatSession = async (
  userId: string,
  sessionId: string,
  title: string,
): Promise<ChatSessionSummary> => {
  const session = await ChatSession.findOne({ userId, sessionId });

  if (!session) {
    throw new ApiError(404, 'Chat session not found.');
  }

  session.title = truncateText(title, MAX_SESSION_TITLE_CHARS);
  await session.save();

  return buildSessionSummary({
    sessionId: session.sessionId,
    title: session.title,
    history: session.history.map((entry) => ({
      role: entry.role,
      parts: entry.parts,
    })),
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  });
};

export const deleteChatSession = async (userId: string, sessionId: string): Promise<void> => {
  const deleted = await ChatSession.findOneAndDelete({ userId, sessionId });

  if (!deleted) {
    throw new ApiError(404, 'Chat session not found.');
  }
};
