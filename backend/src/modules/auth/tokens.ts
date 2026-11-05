import { createHmac, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { Role } from '@prisma/client';
import { env } from '../../config/env';
import { prisma } from '../../shared/prisma';
import { AppError } from '../../shared/errors';

const ACCESS_TTL_SECONDS = 15 * 60;
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function signAccessToken(userId: string, role: Role): string {
  return jwt.sign({ role }, env.JWT_ACCESS_SECRET, { subject: userId, expiresIn: ACCESS_TTL_SECONDS });
}

export function verifyAccessToken(token: string): { userId: string; role: Role } {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
  if (typeof payload === 'string' || !payload.sub || !payload.role) throw new Error('bad token');
  return { userId: payload.sub, role: payload.role as Role };
}

const hashRefresh = (raw: string) => createHmac('sha256', env.JWT_REFRESH_SECRET).update(raw).digest('hex');

export async function issueTokenPair(userId: string, role: Role) {
  const refreshToken = randomBytes(48).toString('base64url');
  await prisma.refreshToken.create({
    data: { userId, tokenHash: hashRefresh(refreshToken), expiresAt: new Date(Date.now() + REFRESH_TTL_MS) },
  });
  return { accessToken: signAccessToken(userId, role), refreshToken, expiresIn: ACCESS_TTL_SECONDS };
}

// Rotation: each refresh token works once. Presenting an already-used token signals theft,
// so every session for that user is revoked.
export async function rotateRefreshToken(raw: string) {
  const record = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashRefresh(raw) },
    include: { user: true },
  });
  if (!record || record.expiresAt < new Date()) throw new AppError(401, 'INVALID_REFRESH_TOKEN');

  if (record.revokedAt) {
    await prisma.refreshToken.updateMany({
      where: { userId: record.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw new AppError(401, 'INVALID_REFRESH_TOKEN');
  }

  const claimed = await prisma.refreshToken.updateMany({
    where: { id: record.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (claimed.count === 0) throw new AppError(401, 'INVALID_REFRESH_TOKEN');

  return issueTokenPair(record.userId, record.user.role);
}

export async function revokeRefreshToken(raw: string) {
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashRefresh(raw), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
