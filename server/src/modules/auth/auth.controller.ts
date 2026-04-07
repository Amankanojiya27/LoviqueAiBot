// File: server/src/modules/auth/auth.controller.ts
import { Request, Response } from 'express';
import { ApiError } from '../../utils/apiError';
import { clearSessionCookie, getCookieValue, setSessionCookie } from '../../utils/cookies';
import { SESSION_COOKIE_NAME } from '../../constants/auth';
import {
  changePasswordForUser,
  clearUserMemoriesById,
  getPublicUserById,
  getUserMemoriesById,
  initiatePasswordReset,
  loginUser,
  logoutUser,
  registerUser,
  resetPassword,
  updateUserPreferences,
} from './auth.service';
import {
  validateChangePasswordPayload,
  validateForgotPasswordPayload,
  validateLoginPayload,
  validateRegisterPayload,
  validateResetPasswordPayload,
  validateUpdatePreferencesPayload,
} from './auth.validation';

const getRequestMeta = (req: Request) => ({
  userAgent: req.get('user-agent') ?? null,
  ipAddress: req.ip ?? req.socket.remoteAddress ?? null,
});

export const register = async (req: Request, res: Response): Promise<void> => {
  const payload = validateRegisterPayload(req.body);
  const session = await registerUser(payload, getRequestMeta(req));

  setSessionCookie(res, session.token);

  res.status(201).json({
    success: true,
    message: 'Account created successfully.',
    data: {
      user: session.user,
    },
  });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const payload = validateLoginPayload(req.body);
  const session = await loginUser(payload, getRequestMeta(req));

  setSessionCookie(res, session.token);

  res.status(200).json({
    success: true,
    message: 'Logged in successfully.',
    data: {
      user: session.user,
    },
  });
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  const sessionToken = getCookieValue(req.headers.cookie, SESSION_COOKIE_NAME);

  if (sessionToken) {
    await logoutUser(sessionToken);
  }

  clearSessionCookie(res);

  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};

export const me = async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    message: 'Current user loaded.',
    data: {
      user: req.auth?.user,
    },
  });
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const payload = validateForgotPasswordPayload(req.body);
  const result = await initiatePasswordReset(payload.email);

  res.status(200).json({
    success: true,
    message: result.message,
    data: {
      preview: result.preview ?? null,
    },
  });
};

export const resetUserPassword = async (req: Request, res: Response): Promise<void> => {
  const payload = validateResetPasswordPayload(req.body);
  await resetPassword(payload);
  clearSessionCookie(res);

  res.status(200).json({
    success: true,
    message: 'Password updated successfully. Please sign in again.',
  });
};

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  const payload = validateChangePasswordPayload(req.body);
  const userId = req.auth?.user.id;
  const sessionId = req.auth?.sessionId;

  if (!userId || !sessionId) {
    throw new ApiError(401, 'Authentication required.');
  }

  await changePasswordForUser(userId, sessionId, payload);
  const refreshedUser = await getPublicUserById(userId);

  res.status(200).json({
    success: true,
    message: 'Password changed successfully.',
    data: {
      user: refreshedUser,
    },
  });
};

export const updatePreferences = async (req: Request, res: Response): Promise<void> => {
  const userId = req.auth?.user.id;

  if (!userId) {
    throw new ApiError(401, 'Authentication required.');
  }

  const payload = validateUpdatePreferencesPayload(req.body);
  const user = await updateUserPreferences(userId, payload);

  res.status(200).json({
    success: true,
    message: 'Companion preferences updated successfully.',
    data: {
      user,
    },
  });
};

export const getMemories = async (req: Request, res: Response): Promise<void> => {
  const userId = req.auth?.user.id;

  if (!userId) {
    throw new ApiError(401, 'Authentication required.');
  }

  const memories = await getUserMemoriesById(userId);

  res.status(200).json({
    success: true,
    message: 'Memories loaded successfully.',
    data: {
      memories,
    },
  });
};

export const clearMemories = async (req: Request, res: Response): Promise<void> => {
  const userId = req.auth?.user.id;

  if (!userId) {
    throw new ApiError(401, 'Authentication required.');
  }

  await clearUserMemoriesById(userId);

  res.status(200).json({
    success: true,
    message: 'Memories cleared successfully.',
    data: {
      memories: [],
    },
  });
};
