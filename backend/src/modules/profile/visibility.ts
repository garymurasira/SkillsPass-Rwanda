import type { Prisma } from '@prisma/client';

export const MAX_PORTFOLIO_PHOTOS = 12; // FR 2.2

// BR 1 / FR 1.4: a worker appears to employers only with a complete profile AND a verified main skill.
// Search and Messaging build on this so the rule lives in one place.
export const visibleWorkerWhere: Prisma.WorkerWhereInput = {
  photoUrl: { not: null },
  bio: { not: null },
  skills: { some: { isMain: true, status: 'VERIFIED' } },
};

export function missingProfileParts(w: {
  photoUrl: string | null;
  bio: string | null;
  skills: { isMain: boolean }[];
}): string[] {
  const missing: string[] = [];
  if (!w.skills.some((s) => s.isMain)) missing.push('mainSkill');
  if (!w.photoUrl) missing.push('photo');
  if (!w.bio) missing.push('bio');
  return missing;
}
