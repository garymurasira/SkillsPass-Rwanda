import type { Prisma } from '@prisma/client';

export const cardInclude = {
  user: { select: { name: true } },
  skills: { where: { isMain: true }, include: { skillType: true } },
} satisfies Prisma.WorkerInclude;

export type CardWorker = Prisma.WorkerGetPayload<{ include: typeof cardInclude }>;

export const roundRating = (avg: number | null) => (avg === null ? null : Math.round(avg * 10) / 10);

// FR 4.4: the card employers see in results. No phone number or other contact details (BR 5).
export function workerCard(w: CardWorker, favoriteIds: Set<string>) {
  const main = w.skills[0];
  return {
    id: w.userId,
    name: w.user.name,
    photoUrl: w.photoUrl,
    region: w.region,
    city: w.city,
    mainSkill: {
      slug: main.skillType.slug,
      nameEn: main.skillType.nameEn,
      nameRw: main.skillType.nameRw,
      nameFr: main.skillType.nameFr,
      yearsOfExperience: main.yearsOfExperience,
      verified: main.status === 'VERIFIED', // FR 2.4 badge
    },
    rating: { average: roundRating(w.ratingAverage), count: w.ratingCount },
    isFavorite: favoriteIds.has(w.userId),
  };
}
