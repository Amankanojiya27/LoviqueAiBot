// File: server/src/modules/chat/chat.routes.ts
import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { history, listSessions, postMessage, removeSession, updateSession } from './chat.controller';

const router = Router();

router.use(requireAuth);
router.post('/messages', asyncHandler(postMessage));
router.get('/sessions', asyncHandler(listSessions));
router.get('/sessions/:sessionId', asyncHandler(history));
router.patch('/sessions/:sessionId', asyncHandler(updateSession));
router.delete('/sessions/:sessionId', asyncHandler(removeSession));

export default router;
