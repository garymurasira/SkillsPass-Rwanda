import type { Prisma } from '@prisma/client';
import { prisma } from '../../shared/prisma';
import { AppError } from '../../shared/errors';
import { decrypt } from '../../shared/crypto';
import { visibleWorkerWhere } from '../profile/visibility';
import { cardInclude, roundRating, workerCard } from './view';
import type { SearchInput } from './schemas';

export async function searchWorkers(employerId: string, q: SearchInput) {
  // BR 1 is applied here for every query: complete profile + verified main skill.
  // FR 4.1: only the MAIN skill is searchable, so the skill filter targets the main skill row.
  const where: Prisma.WorkerWhereInput = {
    ...visibleWorkerWhere,
    skills: {
      some: {
        isMain: true,
        status: 'VERIFIED',
        ...(q.skill ? { skillType: { OR: [{ slug: q.skill }, { id: q.skill }] } } : {}),
      },
    },
    ...(q.region ? { region: { equals: q.region, mode: 'insensitive' } } : {}),
    ...(q.city ? { city: { equals: q.city, mode: 'insensitive' } } : {}),
    ...(q.minRating !== undefined ? { ratingAverage: { gte: q.minRating } } : {}),
  };

  const [total, workers] = await Promise.all([
    prisma.worker.count({ where }),
    prisma.worker.findMany({
      where,
      include: cardInclude,
      // Best rated first; unrated workers last; stable tie-break so paging never repeats or skips.
      orderBy: [{ ratingAverage: { sort: 'desc', nulls: 'last' } }, { ratingCount: 'desc' }, { userId: 'asc' }],
      take: q.limit,
      skip: q.offset,
    }),
  ]);

  const favorites = await prisma.favorite.findMany({
    where: { employerId, workerId: { in: workers.map((w) => w.userId) } },
    select: { workerId: true },
  });
  const favoriteIds = new Set(favorites.map((f) => f.workerId));

  return { items: workers.map((w) => workerCard(w, favoriteIds)), total, limit: q.limit, offset: q.offset };
}

// What an employer sees on a worker's profile (FR 3.1 "Worker Profile View"). Hidden workers look nonexistent.
export async function getWorkerForEmployer(employerId: string, workerId: string) {
  const worker = await prisma.worker.findFirst({
    where: { userId: workerId, ...visibleWorkerWhere },
    include: {
      user: true,
      skills: { include: { skillType: true }, orderBy: { createdAt: 'asc' } },
      photos: { orderBy: { uploadedAt: 'asc' } },
      ratings: {
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { employer: { select: { companyName: true } } },
      },
    },
  });
  if (!worker) throw new AppError(404, 'WORKER_NOT_FOUND');

  const main = worker.skills.find((s) => s.isMain)!;
  const favorite = await prisma.favorite.findUnique({
    where: { employerId_workerId: { employerId, workerId } },
  });

  return {
    id: worker.userId,
    name: worker.user.name,
    photoUrl: worker.photoUrl,
    region: worker.region,
    city: worker.city,
    bio: worker.bio,
    mainSkill: {
      skillType: main.skillType,
      yearsOfExperience: main.yearsOfExperience,
      verified: true,
    },
    otherSkills: worker.skills.filter((s) => !s.isMain).map((s) => ({ skillType: s.skillType, yearsOfExperience: s.yearsOfExperience })),
    otherSkillsNote: 'NOT_VERIFIED',
    portfolio: worker.photos.map((p) => ({ id: p.id, url: p.url })),
    rating: { average: roundRating(worker.ratingAverage), count: worker.ratingCount },
    // FR 5.3 / 5.4: individual ratings with dates and comments
    reviews: worker.ratings.map((r) => ({
      stars: r.stars,
      comment: r.comment,
      createdAt: r.createdAt,
      employer: r.employer.companyName,
    })),
    // BR 5: the phone number is shared only if the worker allowed it.
    phone: worker.shareContact ? decrypt(worker.user.phoneEncrypted) : null,
    isFavorite: !!favorite,
  };
}
