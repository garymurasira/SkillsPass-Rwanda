import { Router } from 'express';
import { asyncHandler } from '../../shared/async-handler';
import { requireAuth, requireRole } from '../auth/middleware';
import { listRoundsSchema, recordResultSchema, submitReferencesSchema } from './schemas';
import * as submission from './submission.service';
import * as admin from './admin.service';

export const verificationRouter = Router();

const worker = [requireAuth, requireRole('WORKER')];
const adminOnly = [requireAuth, requireRole('ADMIN')];

// ── Worker ──
verificationRouter.post('/workers/me/references', ...worker, asyncHandler(async (req, res) => {
  const { references } = submitReferencesSchema.parse(req.body);
  res.status(201).json(await submission.submitReferences(req.auth!.userId, references));
}));

verificationRouter.get('/workers/me/verification', ...worker, asyncHandler(async (req, res) => {
  res.json(await submission.getVerificationStatus(req.auth!.userId));
}));

// ── Admin / Verifier ──
verificationRouter.get('/admin/verifications', ...adminOnly, asyncHandler(async (req, res) => {
  const { status, limit, offset } = listRoundsSchema.parse(req.query);
  res.json(await admin.listRounds(status, limit, offset));
}));

verificationRouter.get('/admin/verifications/:roundId', ...adminOnly, asyncHandler(async (req, res) => {
  res.json(await admin.getRound(String(req.params.roundId)));
}));

verificationRouter.post('/admin/references/:referenceId/result', ...adminOnly, asyncHandler(async (req, res) => {
  const { result } = recordResultSchema.parse(req.body);
  res.json(await admin.recordResult(req.auth!.userId, String(req.params.referenceId), result));
}));

verificationRouter.get('/admin/flagged-skills', ...adminOnly, asyncHandler(async (_req, res) => {
  res.json(await admin.listFlaggedSkills());
}));

verificationRouter.post('/admin/skills/:skillId/clear-flag', ...adminOnly, asyncHandler(async (req, res) => {
  await admin.clearFlag(String(req.params.skillId));
  res.status(204).end();
}));
