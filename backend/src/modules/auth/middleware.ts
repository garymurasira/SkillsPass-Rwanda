import type { RequestHandler } from 'express';
import type { Role } from '@prisma/client';
import { AppError } from '../../shared/errors';
import { verifyAccessToken } from './tokens';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: { userId: string; role: Role };
    }
  }
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next(new AppError(401, 'UNAUTHENTICATED'));
  try {
    req.auth = verifyAccessToken(header.slice(7));
    next();
  } catch {
    next(new AppError(401, 'INVALID_TOKEN'));
  }
};

export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.auth) return next(new AppError(401, 'UNAUTHENTICATED'));
    if (!roles.includes(req.auth.role)) return next(new AppError(403, 'FORBIDDEN'));
    next();
  };
