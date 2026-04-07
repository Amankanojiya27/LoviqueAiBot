// File: server/src/utils/asyncHandler.ts
import { NextFunction, Request, RequestHandler, Response } from 'express';

export const asyncHandler = (
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): RequestHandler => {
  return (req, res, next) => {
    void Promise.resolve(handler(req, res, next)).catch(next);
  };
};
