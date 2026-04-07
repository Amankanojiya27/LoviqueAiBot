// File: server/src/modules/chat/chat.controller.ts
import { Request, Response } from 'express';
import { ApiError } from '../../utils/apiError';
import {
  deleteChatSession,
  getChatHistory,
  listChatSessions,
  renameChatSession,
  sendChatMessage,
} from './chat.service';
import {
  validateSessionIdParam,
  validateSendMessagePayload,
  validateUpdateSessionPayload,
} from './chat.validation';

export const postMessage = async (req: Request, res: Response): Promise<void> => {
  const payload = validateSendMessagePayload(req.body);
  const userId = req.auth?.user.id;
  const userProfile = req.auth?.user;

  if (!userId || !userProfile) {
    throw new ApiError(401, 'Authentication required.');
  }

  const result = await sendChatMessage({
    userId,
    userProfile,
    sessionId: payload.sessionId,
    message: payload.message,
  });

  res.status(200).json({
    success: true,
    message: 'Reply generated successfully.',
    data: {
      sessionId: payload.sessionId,
      reply: result.reply,
      history: result.history,
      persistentMemories: result.persistentMemories,
      session: result.session,
    },
  });
};

export const history = async (req: Request, res: Response): Promise<void> => {
  const sessionId = validateSessionIdParam(req.params.sessionId);
  const userId = req.auth?.user.id;

  if (!userId) {
    throw new ApiError(401, 'Authentication required.');
  }

  const chatHistory = await getChatHistory(userId, sessionId);

  res.status(200).json({
    success: true,
    message: 'Chat history loaded.',
    data: {
      sessionId,
      history: chatHistory,
    },
  });
};

export const listSessions = async (req: Request, res: Response): Promise<void> => {
  const userId = req.auth?.user.id;

  if (!userId) {
    throw new ApiError(401, 'Authentication required.');
  }

  const sessions = await listChatSessions(userId);

  res.status(200).json({
    success: true,
    message: 'Chat sessions loaded.',
    data: {
      sessions,
    },
  });
};

export const updateSession = async (req: Request, res: Response): Promise<void> => {
  const userId = req.auth?.user.id;

  if (!userId) {
    throw new ApiError(401, 'Authentication required.');
  }

  const sessionId = validateSessionIdParam(req.params.sessionId);
  const payload = validateUpdateSessionPayload(req.body);
  const session = await renameChatSession(userId, sessionId, payload.title);

  res.status(200).json({
    success: true,
    message: 'Chat session updated.',
    data: {
      session,
    },
  });
};

export const removeSession = async (req: Request, res: Response): Promise<void> => {
  const userId = req.auth?.user.id;

  if (!userId) {
    throw new ApiError(401, 'Authentication required.');
  }

  const sessionId = validateSessionIdParam(req.params.sessionId);
  await deleteChatSession(userId, sessionId);

  res.status(200).json({
    success: true,
    message: 'Chat session deleted.',
  });
};
