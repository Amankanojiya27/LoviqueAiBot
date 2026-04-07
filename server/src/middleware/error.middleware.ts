// File: server/src/middleware/error.middleware.ts
import { ErrorRequestHandler } from 'express';
import { ApiError } from '../utils/apiError';

export const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      ...(error.details ? { details: error.details } : {}),
    });
    return;
  }

  console.error('Unhandled error:', error);

  res.status(500).json({
    success: false,
    message: 'Lovique hit a small hiccup on our side. Please try again in a moment.',
  });
};
