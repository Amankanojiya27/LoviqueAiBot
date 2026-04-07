// File: server/src/middleware/notFound.middleware.ts
import { RequestHandler } from 'express';

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} was not found.`,
  });
};
