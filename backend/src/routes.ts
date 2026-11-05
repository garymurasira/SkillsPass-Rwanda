import { Router } from 'express';
import { authRouter } from './modules/auth';
import { profileRouter } from './modules/profile';
import { verificationRouter } from './modules/verification';
import { searchRouter } from './modules/search';
import { jobsRatingsRouter } from './modules/jobs-ratings';
import { messagingRouter } from './modules/messaging';

export const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

router.use('/auth', authRouter);
router.use('/', profileRouter);
router.use('/', verificationRouter);
router.use('/', searchRouter);
router.use('/', jobsRatingsRouter);
router.use('/messages', messagingRouter);
