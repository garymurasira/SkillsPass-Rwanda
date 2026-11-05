import { Router } from 'express';
import multer from 'multer';
import { asyncHandler } from '../../shared/async-handler';
import { AppError } from '../../shared/errors';
import { requireAuth, requireRole } from '../auth/middleware';
import {
  employerUpdateSchema,
  mainSkillSchema,
  otherSkillSchema,
  phoneChangeSchema,
  phoneConfirmSchema,
  workerUpdateSchema,
} from './schemas';
import * as workerSvc from './worker.service';
import * as skillsSvc from './skills.service';
import * as photosSvc from './photos.service';
import * as employerSvc from './employer.service';
import * as phoneSvc from './phone.service';

export const profileRouter = Router();

// Photos are processed in memory, re-encoded, then stored; the raw upload is never kept.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024, files: 1 } });
const photoFile = upload.single('photo');
const fileOf = (req: Express.Request & { file?: Express.Multer.File }) => {
  if (!req.file) throw new AppError(400, 'PHOTO_REQUIRED');
  return req.file.buffer;
};

const worker = [requireAuth, requireRole('WORKER')];
const employer = [requireAuth, requireRole('EMPLOYER')];

// Public: feeds the skill dropdown.
profileRouter.get(
  '/skill-types',
  asyncHandler(async (_req, res) => {
    res.json(await skillsSvc.listSkillTypes());
  }),
);

// ── Worker ──
profileRouter.get('/workers/me', ...worker, asyncHandler(async (req, res) => {
  res.json(await workerSvc.getWorkerProfile(req.auth!.userId));
}));

profileRouter.put('/workers/me', ...worker, asyncHandler(async (req, res) => {
  res.json(await workerSvc.updateWorker(req.auth!.userId, workerUpdateSchema.parse(req.body)));
}));

profileRouter.put('/workers/me/main-skill', ...worker, asyncHandler(async (req, res) => {
  const { skillTypeId, yearsOfExperience } = mainSkillSchema.parse(req.body);
  res.json(await skillsSvc.setMainSkill(req.auth!.userId, skillTypeId, yearsOfExperience));
}));

profileRouter.post('/workers/me/other-skills', ...worker, asyncHandler(async (req, res) => {
  const { skillTypeId, yearsOfExperience } = otherSkillSchema.parse(req.body);
  res.status(201).json(await skillsSvc.addOtherSkill(req.auth!.userId, skillTypeId, yearsOfExperience));
}));

profileRouter.delete('/workers/me/other-skills/:skillId', ...worker, asyncHandler(async (req, res) => {
  res.json(await skillsSvc.removeOtherSkill(req.auth!.userId, String(req.params.skillId)));
}));

profileRouter.put('/workers/me/photo', ...worker, photoFile, asyncHandler(async (req, res) => {
  res.json(await photosSvc.setProfilePhoto(req.auth!.userId, fileOf(req)));
}));

profileRouter.post('/workers/me/portfolio', ...worker, photoFile, asyncHandler(async (req, res) => {
  res.status(201).json(await photosSvc.addPortfolioPhoto(req.auth!.userId, fileOf(req)));
}));

profileRouter.delete('/workers/me/portfolio/:photoId', ...worker, asyncHandler(async (req, res) => {
  res.json(await photosSvc.removePortfolioPhoto(req.auth!.userId, String(req.params.photoId)));
}));

// ── Employer ──
profileRouter.get('/employers/me', ...employer, asyncHandler(async (req, res) => {
  res.json(await employerSvc.getEmployerProfile(req.auth!.userId));
}));

profileRouter.put('/employers/me', ...employer, asyncHandler(async (req, res) => {
  res.json(await employerSvc.updateEmployer(req.auth!.userId, employerUpdateSchema.parse(req.body)));
}));

// ── Phone change (any signed-in user) ──
profileRouter.post('/me/phone/change', requireAuth, asyncHandler(async (req, res) => {
  await phoneSvc.requestPhoneChange(req.auth!.userId, phoneChangeSchema.parse(req.body).phone);
  res.status(202).json({ message: 'OTP_SENT' });
}));

profileRouter.post('/me/phone/confirm', requireAuth, asyncHandler(async (req, res) => {
  res.json(await phoneSvc.confirmPhoneChange(req.auth!.userId, phoneConfirmSchema.parse(req.body).code));
}));
