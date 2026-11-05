import type { Prisma } from '@prisma/client';
import { prisma } from '../../shared/prisma';
import { AppError } from '../../shared/errors';
import { decrypt } from '../../shared/crypto';
import { missingProfileParts } from './visibility';

const workerInclude = {
  skills: { include: { skillType: true }, orderBy: { createdAt: 'asc' } },
  photos: { orderBy: { uploadedAt: 'asc' } },
} satisfies Prisma.WorkerInclude;

export async function getWorkerProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { worker: { include: workerInclude } },
  });
  if (!user?.worker) throw new AppError(404, 'PROFILE_NOT_FOUND');
  const w = user.worker;

  const main = w.skills.find((s) => s.isMain) ?? null;
  const missing = missingProfileParts(w);

  return {
    id: user.id,
    name: user.name,
    phone: decrypt(user.phoneEncrypted), // the owner may see their own number
    pendingPhone: user.pendingPhoneEncrypted ? decrypt(user.pendingPhoneEncrypted) : null,
    language: user.language,
    region: w.region,
    city: w.city,
    bio: w.bio,
    photoUrl: w.photoUrl,
    shareContact: w.shareContact,
    mainSkill: main && skillView(main),
    otherSkills: w.skills.filter((s) => !s.isMain).map(skillView), // FR 2.1: "Other skills (not verified)"
    portfolio: w.photos.map((p) => ({ id: p.id, url: p.url, uploadedAt: p.uploadedAt })),
    profileComplete: missing.length === 0,
    missing,
    visibleToEmployers: missing.length === 0 && main?.status === 'VERIFIED',
  };
}

function skillView(s: {
  id: string;
  yearsOfExperience: number;
  status: string;
  flaggedForReview: boolean;
  skillType: { id: string; slug: string; nameEn: string; nameRw: string; nameFr: string };
}) {
  return {
    id: s.id,
    skillType: s.skillType,
    yearsOfExperience: s.yearsOfExperience,
    status: s.status,
    flaggedForReview: s.flaggedForReview,
  };
}

export async function updateWorker(
  userId: string,
  input: { name?: string; region?: string; city?: string; bio?: string | null; shareContact?: boolean },
) {
  await prisma.$transaction([
    ...(input.name ? [prisma.user.update({ where: { id: userId }, data: { name: input.name } })] : []),
    prisma.worker.update({
      where: { userId },
      data: {
        region: input.region,
        city: input.city,
        bio: input.bio === undefined ? undefined : input.bio || null, // empty string clears the bio
        shareContact: input.shareContact,
      },
    }),
  ]);
  return getWorkerProfile(userId);
}
