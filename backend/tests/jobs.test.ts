import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app, createVisibleWorker, employerBody, registerUser, resetDb } from './helpers';
import { prisma } from '../src/shared/prisma';

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

async function setup() {
  const emp = await registerUser(employerBody());
  const worker = await createVisibleWorker({ name: 'Jean' });
  return { emp: emp.accessToken, empId: emp.user.id, worker };
}

const createJob = (token: string, workerId: string) => request(app).post('/api/jobs').set(auth(token)).send({ workerId });
const complete = (token: string, jobId: string) => request(app).post(`/api/jobs/${jobId}/complete`).set(auth(token));
const rate = (token: string, body: Record<string, unknown>) => request(app).post('/api/ratings').set(auth(token)).send(body);

// Runs the whole employer-marks / worker-confirms flow and returns the job id.
async function completedJob(empToken: string, worker: { id: string; token: string }) {
  const job = await createJob(empToken, worker.id).expect(201);
  await complete(empToken, job.body.id).expect(200);
  await complete(worker.token, job.body.id).expect(200);
  return job.body.id as string;
}

describe('creating jobs', () => {
  it('lets an employer start a job with a visible worker', async () => {
    const { emp, worker } = await setup();
    const res = await createJob(emp, worker.id).expect(201);
    expect(res.body).toMatchObject({ status: 'IN_PROGRESS', worker: { name: 'Jean' }, employer: { companyName: 'BrightHomes Ltd' }, canRate: false });
  });

  it('is employer-only', async () => {
    const { worker } = await setup();
    await createJob(worker.token, worker.id).expect(403);
    await request(app).post('/api/jobs').send({ workerId: worker.id }).expect(401);
  });

  it('refuses workers who are not visible or do not exist (BR 2)', async () => {
    const { emp } = await setup();
    const pending = await createVisibleWorker({ status: 'PENDING' });
    await createJob(emp, pending.id).expect(404);
    await createJob(emp, 'nobody').expect(404);
  });

  it('allows only one unfinished job per employer/worker pair', async () => {
    const { emp, worker } = await setup();
    await createJob(emp, worker.id).expect(201);
    const dup = await createJob(emp, worker.id);
    expect(dup.status).toBe(409);
    expect(dup.body.error.code).toBe('JOB_ALREADY_OPEN');

    // ...even when two requests race
    const other = await createVisibleWorker();
    const results = await Promise.all([createJob(emp, other.id), createJob(emp, other.id)]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
  });

  it('allows a new job after the previous one is completed', async () => {
    const { emp, worker } = await setup();
    await completedJob(emp, worker);
    await createJob(emp, worker.id).expect(201);
  });
});

describe('completion workflow (FR 5.5)', () => {
  it('needs the employer to mark first, then the worker to confirm', async () => {
    const { emp, worker } = await setup();
    const job = (await createJob(emp, worker.id)).body;

    const early = await complete(worker.token, job.id);
    expect(early.status).toBe(409);
    expect(early.body.error.code).toBe('NOT_MARKED_BY_EMPLOYER');

    let res = await complete(emp, job.id).expect(200);
    expect(res.body.status).toBe('EMPLOYER_MARKED');
    expect(res.body.employerMarkedAt).toBeTruthy();
    expect(res.body.canRate).toBe(false);

    expect((await complete(emp, job.id)).body.error.code).toBe('ALREADY_MARKED');

    res = await complete(worker.token, job.id).expect(200);
    expect(res.body.status).toBe('COMPLETED');
    expect(res.body.workerConfirmedAt).toBeTruthy();
    expect(res.body.canRate).toBe(true);

    expect((await complete(worker.token, job.id)).body.error.code).toBe('ALREADY_CONFIRMED');
  });

  it('is limited to the two people on the job', async () => {
    const { emp, worker } = await setup();
    const job = (await createJob(emp, worker.id)).body;
    const otherEmp = (await registerUser(employerBody('0722555444'))).accessToken;
    const otherWorker = await createVisibleWorker();

    await complete(otherEmp, job.id).expect(404);
    await complete(otherWorker.token, job.id).expect(404);
    await request(app).get(`/api/jobs/${job.id}`).set(auth(otherEmp)).expect(404);
    await request(app).get(`/api/jobs/${job.id}`).set(auth(otherWorker.token)).expect(404);
    await request(app).get(`/api/jobs/${job.id}`).set(auth(worker.token)).expect(200);
  });

  it('does not let a double confirmation slip through', async () => {
    const { emp, worker } = await setup();
    const job = (await createJob(emp, worker.id)).body;
    const results = await Promise.all([complete(emp, job.id), complete(emp, job.id)]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
  });
});

describe('listing jobs', () => {
  it('shows each side only their own jobs, with an optional status filter', async () => {
    const { emp, worker } = await setup();
    const w2 = await createVisibleWorker({ name: 'Marie' });
    await completedJob(emp, worker);
    await createJob(emp, w2.id).expect(201);

    const all = await request(app).get('/api/jobs').set(auth(emp)).expect(200);
    expect(all.body.total).toBe(2);
    const done = await request(app).get('/api/jobs?status=COMPLETED').set(auth(emp)).expect(200);
    expect(done.body.items.map((j: { worker: { name: string } }) => j.worker.name)).toEqual(['Jean']);

    expect((await request(app).get('/api/jobs').set(auth(worker.token))).body.total).toBe(1);
    expect((await request(app).get('/api/jobs').set(auth(w2.token))).body.total).toBe(1);
    await request(app).get('/api/jobs?status=BOGUS').set(auth(emp)).expect(400);
  });
});

describe('ratings (BR 3, FR 5.1 – 5.2)', () => {
  it('cannot be left before the worker confirms completion', async () => {
    const { emp, worker } = await setup();
    const job = (await createJob(emp, worker.id)).body;
    expect((await rate(emp, { jobId: job.id, stars: 5 })).body.error.code).toBe('JOB_NOT_COMPLETED');

    await complete(emp, job.id);
    expect((await rate(emp, { jobId: job.id, stars: 5 })).body.error.code).toBe('JOB_NOT_COMPLETED'); // marked, not confirmed
  });

  it('records a rating with an optional comment once the job is confirmed', async () => {
    const { emp, worker } = await setup();
    const jobId = await completedJob(emp, worker);

    const res = await rate(emp, { jobId, stars: 5, comment: '  Neat, on-time installation  ' }).expect(201);
    expect(res.body).toMatchObject({ stars: 5, comment: 'Neat, on-time installation' });

    const job = await request(app).get(`/api/jobs/${jobId}`).set(auth(emp));
    expect(job.body.rating.stars).toBe(5);
    expect(job.body.canRate).toBe(false);
  });

  it('stores an empty comment as null', async () => {
    const { emp, worker } = await setup();
    const jobId = await completedJob(emp, worker);
    expect((await rate(emp, { jobId, stars: 4, comment: '   ' }).expect(201)).body.comment).toBeNull();
  });

  it('allows one rating per job, even under concurrent requests', async () => {
    const { emp, worker } = await setup();
    const jobId = await completedJob(emp, worker);
    const results = await Promise.all([rate(emp, { jobId, stars: 5 }), rate(emp, { jobId, stars: 1 })]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(await prisma.rating.count()).toBe(1);
    expect((await prisma.worker.findUniqueOrThrow({ where: { userId: worker.id } })).ratingCount).toBe(1);
  });

  it('validates stars and comment length', async () => {
    const { emp, worker } = await setup();
    const jobId = await completedJob(emp, worker);
    for (const stars of [0, 6, 2.5, '5']) await rate(emp, { jobId, stars }).expect(400);
    await rate(emp, { jobId, stars: 5, comment: 'x'.repeat(201) }).expect(400);
    await rate(emp, { jobId, stars: 5, comment: 'x'.repeat(200) }).expect(201);
  });

  it('only the job\'s own employer can rate it, and workers cannot rate', async () => {
    const { emp, worker } = await setup();
    const jobId = await completedJob(emp, worker);
    const otherEmp = (await registerUser(employerBody('0722555444'))).accessToken;
    await rate(otherEmp, { jobId, stars: 1 }).expect(404);
    await rate(worker.token, { jobId, stars: 5 }).expect(403);
    await request(app).post('/api/ratings').send({ jobId, stars: 5 }).expect(401);
    expect(await prisma.rating.count()).toBe(0);
  });
});

describe('worker rating summary feeds search', () => {
  it('keeps the average and count in sync as ratings arrive', async () => {
    const { emp, worker } = await setup();
    const job1 = await completedJob(emp, worker);
    await rate(emp, { jobId: job1, stars: 5 }).expect(201);
    let w = await prisma.worker.findUniqueOrThrow({ where: { userId: worker.id } });
    expect([w.ratingAverage, w.ratingCount]).toEqual([5, 1]);

    const job2 = await completedJob(emp, worker);
    await rate(emp, { jobId: job2, stars: 4 }).expect(201);
    w = await prisma.worker.findUniqueOrThrow({ where: { userId: worker.id } });
    expect([w.ratingAverage, w.ratingCount]).toEqual([4.5, 2]);
  });

  it('stays correct when ratings for the same worker arrive at the same time', async () => {
    const { emp, worker } = await setup();
    const emp2 = (await registerUser(employerBody('0722555444'))).accessToken;
    const emp3 = (await registerUser(employerBody('0722555445'))).accessToken;
    const jobs = await Promise.all([emp, emp2, emp3].map((t) => completedJob(t, worker)));

    await Promise.all([rate(emp, { jobId: jobs[0], stars: 5 }), rate(emp2, { jobId: jobs[1], stars: 4 }), rate(emp3, { jobId: jobs[2], stars: 3 })]);
    const w = await prisma.worker.findUniqueOrThrow({ where: { userId: worker.id } });
    expect(w.ratingCount).toBe(3);
    expect(w.ratingAverage).toBeCloseTo(4, 5);
  });

  it('lets employers find the worker with the minimum-rating filter and see the review', async () => {
    const { emp, worker } = await setup();
    const other = await createVisibleWorker({ name: 'Unrated' });
    const jobId = await completedJob(emp, worker);
    await rate(emp, { jobId, stars: 5, comment: 'Excellent' }).expect(201);

    const found = await request(app).get('/api/workers?minRating=4').set(auth(emp)).expect(200);
    expect(found.body.items.map((i: { name: string }) => i.name)).toEqual(['Jean']);
    expect(found.body.items[0].rating).toEqual({ average: 5, count: 1 });
    expect(other.id).toBeTruthy();

    const profile = await request(app).get(`/api/workers/${worker.id}`).set(auth(emp)).expect(200);
    expect(profile.body.reviews[0]).toMatchObject({ stars: 5, comment: 'Excellent', employer: 'BrightHomes Ltd' });
  });

  it('lets the worker see their own rating and feedback', async () => {
    const { emp, worker } = await setup();
    const jobId = await completedJob(emp, worker);
    await rate(emp, { jobId, stars: 4, comment: 'Good work' }).expect(201);

    const res = await request(app).get('/api/workers/me/ratings').set(auth(worker.token)).expect(200);
    expect(res.body).toMatchObject({ average: 4, count: 1 });
    expect(res.body.items[0]).toMatchObject({ stars: 4, comment: 'Good work', employer: 'BrightHomes Ltd' });
    await request(app).get('/api/workers/me/ratings').set(auth(emp)).expect(403);
  });
});
