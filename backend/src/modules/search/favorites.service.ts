import { prisma } from '../../shared/prisma';
import { AppError } from '../../shared/errors';
import { visibleWorkerWhere } from '../profile/visibility';
import { cardInclude, workerCard } from './view';

// FR 4.5. Idempotent: favoriting twice is fine.
export async function addFavorite(employerId: string, workerId: string) {
  const visible = await prisma.worker.findFirst({ where: { userId: workerId, ...visibleWorkerWhere }, select: { userId: true } });
  if (!visible) throw new AppError(404, 'WORKER_NOT_FOUND');

  await prisma.favorite.upsert({
    where: { employerId_workerId: { employerId, workerId } },
    update: {},
    create: { employerId, workerId },
  });
}

export async function removeFavorite(employerId: string, workerId: string) {
  await prisma.favorite.deleteMany({ where: { employerId, workerId } });
}

// Workers who stopped being visible (e.g. lost verification) drop out of the list but stay saved.
export async function listFavorites(employerId: string, limit: number, offset: number) {
  const where = { favoredBy: { some: { employerId } }, ...visibleWorkerWhere };
  const [total, workers] = await Promise.all([
    prisma.worker.count({ where }),
    prisma.worker.findMany({
      where,
      include: cardInclude,
      orderBy: { userId: 'asc' },
      take: limit,
      skip: offset,
    }),
  ]);
  const all = new Set(workers.map((w) => w.userId));
  return { items: workers.map((w) => workerCard(w, all)), total, limit, offset };
}
