import { Prisma } from '@prisma/client';
import { prisma } from '../../shared/prisma';
import { AppError } from '../../shared/errors';

// BR 3: only the employer of a job the worker has confirmed can rate, once per job.
// The worker's stored average/count (used by search) is recomputed in the same transaction.
export async function createRating(employerId: string, jobId: string, stars: number, comment: string | null) {
  try {
    return await prisma.$transaction(async (tx) => {
      const job = await tx.job.findFirst({ where: { id: jobId, employerId } });
      if (!job) throw new AppError(404, 'JOB_NOT_FOUND');
      if (job.status !== 'COMPLETED') throw new AppError(409, 'JOB_NOT_COMPLETED');

      // Serialise ratings for one worker so concurrent ones can't leave a stale average.
      await tx.$queryRaw`SELECT "userId" FROM "Worker" WHERE "userId" = ${job.workerId} FOR UPDATE`;

      const rating = await tx.rating.create({ data: { jobId, workerId: job.workerId, employerId, stars, comment } });

      const agg = await tx.rating.aggregate({ where: { workerId: job.workerId }, _avg: { stars: true }, _count: { _all: true } });
      await tx.worker.update({
        where: { userId: job.workerId },
        data: { ratingAverage: agg._avg.stars, ratingCount: agg._count._all },
      });

      return { id: rating.id, jobId, stars: rating.stars, comment: rating.comment, createdAt: rating.createdAt };
    });
  } catch (e) {
    // jobId is unique on Rating: one rating per job.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw new AppError(409, 'ALREADY_RATED');
    }
    throw e;
  }
}

// "View their profile rating and customer feedback" (worker).
export async function listMyRatings(workerId: string, limit: number, offset: number) {
  const [worker, items] = await Promise.all([
    prisma.worker.findUniqueOrThrow({ where: { userId: workerId }, select: { ratingAverage: true, ratingCount: true } }),
    prisma.rating.findMany({
      where: { workerId },
      include: { employer: { select: { companyName: true } } },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      take: limit,
      skip: offset,
    }),
  ]);
  return {
    average: worker.ratingAverage === null ? null : Math.round(worker.ratingAverage * 10) / 10,
    count: worker.ratingCount,
    items: items.map((r) => ({ stars: r.stars, comment: r.comment, createdAt: r.createdAt, employer: r.employer.companyName })),
    limit,
    offset,
  };
}
