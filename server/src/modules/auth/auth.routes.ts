// File: server/src/modules/auth/auth.routes.ts
import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  changePassword,
  clearMemories,
  forgotPassword,
  getMemories,
  login,
  logout,
  me,
  register,
  resetUserPassword,
  updatePreferences,
} from './auth.controller';

const router = Router();

router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.post('/logout', asyncHandler(logout));
router.post('/forgot-password', asyncHandler(forgotPassword));
router.post('/reset-password', asyncHandler(resetUserPassword));
router.post('/change-password', requireAuth, asyncHandler(changePassword));
router.patch('/preferences', requireAuth, asyncHandler(updatePreferences));
router.delete('/memories', requireAuth, asyncHandler(clearMemories));
router.get('/memories', requireAuth, asyncHandler(getMemories));
router.get('/me', requireAuth, asyncHandler(me));

export default router;
