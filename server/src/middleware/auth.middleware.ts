// File: server/src/middleware/auth.middleware.ts
import { NextFunction, Request, Response } from 'express';
import { SESSION_COOKIE_NAME } from '../constants/auth';
import { getSessionContextFromToken } from '../modules/auth/auth.service';
import { ApiError } from '../utils/apiError';
import { clearSessionCookie, getCookieValue } from '../utils/cookies';

export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sessionToken = getCookieValue(req.headers.cookie, SESSION_COOKIE_NAME);

    if (!sessionToken) {
      throw new ApiError(401, 'Authentication required.');
    }

    const session = await getSessionContextFromToken(sessionToken);

    if (!session) {
      clearSessionCookie(res);
      throw new ApiError(401, 'Your session has expired. Please sign in again.');
    }

    req.auth = session;
    next();
  } catch (error) {
    next(error);
  }
};
