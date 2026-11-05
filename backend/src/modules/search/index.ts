import { Router } from 'express';
import { asyncHandler } from '../../shared/async-handler';
import { requireAuth, requireRole } from '../auth/middleware';
import { pageSchema, searchSchema } from './schemas';
import * as search from './search.service';
import * as favorites from './favorites.service';

export const searchRouter = Router();

const employerOnly = [requireAuth, requireRole('EMPLOYER')];

// GET /api/workers?skill=&region=&city=&minRating=&limit=&offset=
searchRouter.get('/workers', ...employerOnly, asyncHandler(async (req, res) => {
  res.json(await search.searchWorkers(req.auth!.userId, searchSchema.parse(req.query)));
}));

// '/workers/me' is handled earlier by the profile router, so this never shadows it.
searchRouter.get('/workers/:id', ...employerOnly, asyncHandler(async (req, res) => {
  res.json(await search.getWorkerForEmployer(req.auth!.userId, String(req.params.id)));
}));

searchRouter.get('/favorites', ...employerOnly, asyncHandler(async (req, res) => {
  const { limit, offset } = pageSchema.parse(req.query);
  res.json(await favorites.listFavorites(req.auth!.userId, limit, offset));
}));

searchRouter.put('/favorites/:workerId', ...employerOnly, asyncHandler(async (req, res) => {
  await favorites.addFavorite(req.auth!.userId, String(req.params.workerId));
  res.status(204).end();
}));

searchRouter.delete('/favorites/:workerId', ...employerOnly, asyncHandler(async (req, res) => {
  await favorites.removeFavorite(req.auth!.userId, String(req.params.workerId));
  res.status(204).end();
}));
