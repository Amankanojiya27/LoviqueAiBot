// File: server/src/types/express.d.ts
import type { AuthRequestContext } from '../modules/auth/auth.types';

declare global {
  namespace Express {
    interface Request {
      auth?: AuthRequestContext;
    }
  }
}

export {};
