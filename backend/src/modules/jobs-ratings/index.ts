import { Router } from 'express';
import { asyncHandler } from '../../shared/async-handler';
import { requireAuth, requireRole } from '../auth/middleware';
import { createJobSchema, listJobsSchema, pageSchema, ratingSchema } from './schemas';
import * as jobs from './jobs.service';
import * as ratings from './ratings.service';

export const jobsRatingsRouter = Router();

const employerOnly = [requireAuth, requireRole('EMPLOYER')];
const workerOnly = [requireAuth, requireRole('WORKER')];
const jobParticipant = [requireAuth, requireRole('EMPLOYER', 'WORKER')];

// Narrowed by requireRole above.
const actor = (req: { auth?: { userId: string; role: string } }) => ({
  userId: req.auth!.userId,
  role: req.auth!.role as 'EMPLOYER' | 'WORKER',
});

jobsRatingsRouter.post('/jobs', ...employerOnly, asyncHandler(async (req, res) => {
  const { workerId } = createJobSchema.parse(req.body);
  res.status(201).json(await jobs.createJob(req.auth!.userId, workerId));
}));

jobsRatingsRouter.get('/jobs', ...jobParticipant, asyncHandler(async (req, res) => {
  const { status, limit, offset } = listJobsSchema.parse(req.query);
  res.json(await jobs.listJobs(actor(req), status, limit, offset));
}));

jobsRatingsRouter.get('/jobs/:id', ...jobParticipant, asyncHandler(async (req, res) => {
  res.json(await jobs.getJob(actor(req), String(req.params.id)));
}));

// Employer: mark completed. Worker: confirm. (FR 5.5)
jobsRatingsRouter.post('/jobs/:id/complete', ...jobParticipant, asyncHandler(async (req, res) => {
  res.json(await jobs.completeJob(actor(req), String(req.params.id)));
}));

jobsRatingsRouter.post('/ratings', ...employerOnly, asyncHandler(async (req, res) => {
  const { jobId, stars, comment } = ratingSchema.parse(req.body);
  res.status(201).json(await ratings.createRating(req.auth!.userId, jobId, stars, comment));
}));

jobsRatingsRouter.get('/workers/me/ratings', ...workerOnly, asyncHandler(async (req, res) => {
  const { limit, offset } = pageSchema.parse(req.query);
  res.json(await ratings.listMyRatings(req.auth!.userId, limit, offset));
}));
