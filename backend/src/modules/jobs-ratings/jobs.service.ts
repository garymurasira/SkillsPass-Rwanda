import { Prisma, type JobStatus } from '@prisma/client';
import { prisma } from '../../shared/prisma';
import { AppError } from '../../shared/errors';
import { visibleWorkerWhere } from '../profile/visibility';

type Actor = { userId: string; role: 'EMPLOYER' | 'WORKER' };

const jobInclude = {
  worker: { include: { user: { select: { name: true } } } },
  employer: { select: { companyName: true } },
  rating: true,
} satisfies Prisma.JobInclude;

type JobWithRelations = Prisma.JobGetPayload<{ include: typeof jobInclude }>;

function jobView(j: JobWithRelations) {
  return {
    id: j.id,
    status: j.status,
    createdAt: j.createdAt,
    employerMarkedAt: j.employerMarkedAt,
    workerConfirmedAt: j.workerConfirmedAt,
    worker: { id: j.workerId, name: j.worker.user.name },
    employer: { id: j.employerId, companyName: j.employer.companyName },
    rating: j.rating && { stars: j.rating.stars, comment: j.rating.comment, createdAt: j.rating.createdAt },
    canRate: j.status === 'COMPLETED' && !j.rating, // BR 3: shown to the employer only after confirmation
  };
}

const participant = (a: Actor): Prisma.JobWhereInput =>
  a.role === 'EMPLOYER' ? { employerId: a.userId } : { workerId: a.userId };

// The employer records a job with a worker they found on the platform. Jobs themselves are
// arranged offline (no job posting in the MVP), so this just starts the completion workflow.
export async function createJob(employerId: string, workerId: string) {
  // BR 2: only workers who appear in search can be engaged.
  const visible = await prisma.worker.findFirst({ where: { userId: workerId, ...visibleWorkerWhere }, select: { userId: true } });
  if (!visible) throw new AppError(404, 'WORKER_NOT_FOUND');

  try {
    const job = await prisma.job.create({ data: { employerId, workerId }, include: jobInclude });
    return jobView(job);
  } catch (e) {
    // Backed by a partial unique index: one unfinished job per employer/worker pair.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw new AppError(409, 'JOB_ALREADY_OPEN');
    }
    throw e;
  }
}

export async function listJobs(actor: Actor, status: JobStatus | undefined, limit: number, offset: number) {
  const where: Prisma.JobWhereInput = { ...participant(actor), ...(status ? { status } : {}) };
  const [total, jobs] = await Promise.all([
    prisma.job.count({ where }),
    prisma.job.findMany({ where, include: jobInclude, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], take: limit, skip: offset }),
  ]);
  return { items: jobs.map(jobView), total, limit, offset };
}

export async function getJob(actor: Actor, jobId: string) {
  const job = await prisma.job.findFirst({ where: { id: jobId, ...participant(actor) }, include: jobInclude });
  if (!job) throw new AppError(404, 'JOB_NOT_FOUND');
  return jobView(job);
}

// FR 5.5: the employer marks the job completed, then the worker confirms. Same endpoint, two steps.
export async function completeJob(actor: Actor, jobId: string) {
  const job = await prisma.job.findFirst({ where: { id: jobId, ...participant(actor) } });
  if (!job) throw new AppError(404, 'JOB_NOT_FOUND');

  if (actor.role === 'EMPLOYER') {
    if (job.status !== 'IN_PROGRESS') throw new AppError(409, 'ALREADY_MARKED');
    const res = await prisma.job.updateMany({
      where: { id: jobId, status: 'IN_PROGRESS' },
      data: { status: 'EMPLOYER_MARKED', employerMarkedAt: new Date() },
    });
    if (res.count === 0) throw new AppError(409, 'ALREADY_MARKED');
  } else {
    if (job.status === 'IN_PROGRESS') throw new AppError(409, 'NOT_MARKED_BY_EMPLOYER');
    if (job.status === 'COMPLETED') throw new AppError(409, 'ALREADY_CONFIRMED');
    const res = await prisma.job.updateMany({
      where: { id: jobId, status: 'EMPLOYER_MARKED' },
      data: { status: 'COMPLETED', workerConfirmedAt: new Date() },
    });
    if (res.count === 0) throw new AppError(409, 'ALREADY_CONFIRMED');
  }
  return getJob(actor, jobId);
}
