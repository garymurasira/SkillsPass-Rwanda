import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../../config/env';
import { asyncHandler } from '../../shared/async-handler';
import { requireAuth, requireRole } from '../auth/middleware';
import { pageSchema, sendSchema, threadQuerySchema } from './schemas';
import * as messages from './messages.service';
import * as conversations from './conversations.service';

export const messagingRouter = Router();

// Mounted at /api/messages. Only workers and employers can message (admins can't).
messagingRouter.use(requireAuth, requireRole('EMPLOYER', 'WORKER'));

const actor = (req: { auth?: { userId: string; role: string } }): messages.Actor => ({
  userId: req.auth!.userId,
  role: req.auth!.role as messages.Actor['role'],
});

// Keyed by user, not IP, because many users share mobile-network addresses.
const sendLimiter = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED' } },
  keyGenerator: (req) => req.auth!.userId,
  skip: () => env.NODE_ENV === 'test',
});

messagingRouter.post('/', sendLimiter, asyncHandler(async (req, res) => {
  const { recipientId, content } = sendSchema.parse(req.body);
  res.status(201).json(await messages.sendMessage(actor(req), recipientId, content));
}));

// Conversation list
messagingRouter.get('/', asyncHandler(async (req, res) => {
  const { limit, offset } = pageSchema.parse(req.query);
  res.json(await conversations.listConversations(req.auth!.userId, limit, offset));
}));

messagingRouter.get('/unread-count', asyncHandler(async (req, res) => {
  res.json(await messages.unreadCount(req.auth!.userId));
}));

// Thread with one person; poll with ?after=<cursor> for new messages.
messagingRouter.get('/with/:userId', asyncHandler(async (req, res) => {
  res.json(await messages.getThread(actor(req), String(req.params.userId), threadQuerySchema.parse(req.query)));
}));
