import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { app, createVisibleWorker, employerBody, registerUser, resetDb, workerBody } from './helpers';
import { prisma } from '../src/shared/prisma';
import { encrypt, hashPhone } from '../src/shared/crypto';

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

const auth = (t: string) => ({ Authorization: `Bearer ${t}` });
const employer = async () => (await registerUser(employerBody())).accessToken;
const search = (token: string, qs = '') => request(app).get(`/api/workers${qs}`).set(auth(token));
const names = (res: request.Response) => res.body.items.map((i: { name: string }) => i.name);

describe('access', () => {
  it('is for signed-in employers only', async () => {
    await request(app).get('/api/workers').expect(401);
    const worker = await registerUser(workerBody());
    await search(worker.accessToken).expect(403);
    await request(app).get('/api/favorites').set(auth(worker.accessToken)).expect(403);
  });
});

describe('who appears in results (BR 1)', () => {
  it('shows only complete workers with a verified main skill', async () => {
    const token = await employer();
    await createVisibleWorker({ name: 'Visible' });
    await createVisibleWorker({ name: 'Unverified', status: 'PENDING' });
    await createVisibleWorker({ name: 'Rejected', status: 'NOT_VERIFIED' });
    await createVisibleWorker({ name: 'NoBio', bio: null });
    await createVisibleWorker({ name: 'NoPhoto', photoUrl: null });

    const res = await search(token).expect(200);
    expect(names(res)).toEqual(['Visible']);
    expect(res.body.total).toBe(1);
  });

  it('never exposes phone numbers in result cards', async () => {
    const token = await employer();
    const w = await createVisibleWorker({ shareContact: true });
    const res = await search(token).expect(200);
    expect(JSON.stringify(res.body)).not.toContain(w.phone.slice(4));
    expect(res.body.items[0].mainSkill.verified).toBe(true);
  });
});

describe('filters (FR 4.1 – 4.3)', () => {
  it('filters by main skill using slug or id, and ignores other skills', async () => {
    const token = await employer();
    await createVisibleWorker({ name: 'Solar Sam', skill: 'solar-technician' });
    const plumber = await createVisibleWorker({ name: 'Plumber Pat', skill: 'plumber' });
    // Pat also lists welding as an extra skill, which must not make Pat searchable as a welder.
    const welder = await prisma.skillType.findUniqueOrThrow({ where: { slug: 'welder' } });
    await prisma.skill.create({ data: { workerId: plumber.id, skillTypeId: welder.id, isMain: false, yearsOfExperience: 2 } });

    expect(names(await search(token, '?skill=solar-technician'))).toEqual(['Solar Sam']);
    expect(names(await search(token, `?skill=${welder.id}`))).toEqual([]);
    expect(names(await search(token, '?skill=welder'))).toEqual([]);
    expect(names(await search(token, '?skill=plumber'))).toEqual(['Plumber Pat']);
    expect(names(await search(token, '?skill=no-such-skill'))).toEqual([]);
  });

  it('filters by region and city, ignoring case', async () => {
    const token = await employer();
    await createVisibleWorker({ name: 'Kigali Kim', region: 'Kigali', city: 'Gasabo' });
    await createVisibleWorker({ name: 'Kigali Kay', region: 'Kigali', city: 'Nyarugenge' });
    await createVisibleWorker({ name: 'North Nia', region: 'Northern', city: 'Musanze' });

    expect((await search(token, '?region=kigali')).body.total).toBe(2);
    expect(names(await search(token, '?region=KIGALI&city=nyarugenge'))).toEqual(['Kigali Kay']);
    expect(names(await search(token, '?city=Musanze'))).toEqual(['North Nia']);
  });

  it('filters by minimum rating; unrated workers only appear without the filter', async () => {
    const token = await employer();
    await createVisibleWorker({ name: 'Five', rating: 5 });
    await createVisibleWorker({ name: 'Four', rating: 4.2 });
    await createVisibleWorker({ name: 'Three', rating: 3 });
    await createVisibleWorker({ name: 'Unrated' });

    expect(names(await search(token, '?minRating=4'))).toEqual(['Five', 'Four']);
    expect(names(await search(token, '?minRating=5'))).toEqual(['Five']);
    expect((await search(token)).body.total).toBe(4);
  });

  it('combines filters', async () => {
    const token = await employer();
    await createVisibleWorker({ name: 'Match', skill: 'electrician', region: 'Kigali', rating: 4.5 });
    await createVisibleWorker({ name: 'WrongRegion', skill: 'electrician', region: 'Southern', rating: 4.5 });
    await createVisibleWorker({ name: 'WrongRating', skill: 'electrician', region: 'Kigali', rating: 2 });
    expect(names(await search(token, '?skill=electrician&region=Kigali&minRating=4'))).toEqual(['Match']);
  });

  it('rejects out-of-range or malformed parameters', async () => {
    const token = await employer();
    await search(token, '?minRating=9').expect(400);
    await search(token, '?limit=500').expect(400);
    await search(token, '?offset=-1').expect(400);
  });
});

describe('ordering and paging', () => {
  it('lists best rated first with unrated last, and pages without repeats', async () => {
    const token = await employer();
    await createVisibleWorker({ name: 'C', rating: 3 });
    await createVisibleWorker({ name: 'Unrated' });
    await createVisibleWorker({ name: 'A', rating: 5 });
    await createVisibleWorker({ name: 'B', rating: 4 });

    expect(names(await search(token))).toEqual(['A', 'B', 'C', 'Unrated']);

    const p1 = await search(token, '?limit=2&offset=0');
    const p2 = await search(token, '?limit=2&offset=2');
    expect(names(p1)).toEqual(['A', 'B']);
    expect(names(p2)).toEqual(['C', 'Unrated']);
    expect(p1.body).toMatchObject({ total: 4, limit: 2, offset: 0 });
  });

  it('breaks rating ties by number of ratings', async () => {
    const token = await employer();
    await createVisibleWorker({ name: 'Few', rating: 4, ratingCount: 2 });
    await createVisibleWorker({ name: 'Many', rating: 4, ratingCount: 30 });
    expect(names(await search(token))).toEqual(['Many', 'Few']);
  });
});

describe('worker profile view', () => {
  it('shows the full profile with verified badge, other skills labelled unverified, and reviews', async () => {
    const empToken = await employer();
    const w = await createVisibleWorker({ name: 'Jean', rating: 5, ratingCount: 1 });
    const welder = await prisma.skillType.findUniqueOrThrow({ where: { slug: 'welder' } });
    await prisma.skill.create({ data: { workerId: w.id, skillTypeId: welder.id, isMain: false, yearsOfExperience: 1 } });
    await prisma.portfolioPhoto.create({ data: { workerId: w.id, url: '/uploads/portfolio/a.webp' } });

    const emp = await prisma.employer.findFirstOrThrow();
    const job = await prisma.job.create({ data: { employerId: emp.userId, workerId: w.id, status: 'COMPLETED' } });
    await prisma.rating.create({ data: { jobId: job.id, workerId: w.id, employerId: emp.userId, stars: 5, comment: 'Neat, on-time installation' } });

    const res = await request(app).get(`/api/workers/${w.id}`).set(auth(empToken)).expect(200);
    expect(res.body.name).toBe('Jean');
    expect(res.body.mainSkill).toMatchObject({ verified: true, yearsOfExperience: 5 });
    expect(res.body.otherSkills).toHaveLength(1);
    expect(res.body.otherSkillsNote).toBe('NOT_VERIFIED');
    expect(res.body.portfolio).toHaveLength(1);
    expect(res.body.reviews[0]).toMatchObject({ stars: 5, comment: 'Neat, on-time installation', employer: 'BrightHomes Ltd' });
    expect(res.body.reviews[0].createdAt).toBeTruthy();
  });

  it('hides the phone number unless the worker allowed sharing (BR 5)', async () => {
    const token = await employer();
    const hidden = await createVisibleWorker({ shareContact: false });
    const shared = await createVisibleWorker({ shareContact: true });
    expect((await request(app).get(`/api/workers/${hidden.id}`).set(auth(token))).body.phone).toBeNull();
    expect((await request(app).get(`/api/workers/${shared.id}`).set(auth(token))).body.phone).toBe(shared.phone);
  });

  it('returns 404 for workers who are not visible, and for unknown ids', async () => {
    const token = await employer();
    const pending = await createVisibleWorker({ status: 'PENDING' });
    await request(app).get(`/api/workers/${pending.id}`).set(auth(token)).expect(404);
    await request(app).get('/api/workers/does-not-exist').set(auth(token)).expect(404);
  });

  it('does not shadow the worker\'s own /workers/me route', async () => {
    const worker = await registerUser(workerBody());
    const res = await request(app).get('/api/workers/me').set(auth(worker.accessToken)).expect(200);
    expect(res.body.name).toBe('Jean Mugabo');
  });
});

describe('favorites (FR 4.5)', () => {
  it('saves, lists, flags in search results, and removes favorites', async () => {
    const token = await employer();
    const a = await createVisibleWorker({ name: 'Alpha' });
    await createVisibleWorker({ name: 'Beta' });

    await request(app).put(`/api/favorites/${a.id}`).set(auth(token)).expect(204);
    await request(app).put(`/api/favorites/${a.id}`).set(auth(token)).expect(204); // idempotent

    const list = await request(app).get('/api/favorites').set(auth(token)).expect(200);
    expect(names(list)).toEqual(['Alpha']);

    const results = await search(token);
    expect(results.body.items.map((i: { name: string; isFavorite: boolean }) => [i.name, i.isFavorite]).sort()).toEqual([
      ['Alpha', true],
      ['Beta', false],
    ]);

    await request(app).delete(`/api/favorites/${a.id}`).set(auth(token)).expect(204);
    expect((await request(app).get('/api/favorites').set(auth(token))).body.total).toBe(0);
  });

  it('cannot favorite a worker who is not visible', async () => {
    const token = await employer();
    const pending = await createVisibleWorker({ status: 'PENDING' });
    await request(app).put(`/api/favorites/${pending.id}`).set(auth(token)).expect(404);
  });

  it('hides favorites who lose visibility but keeps them saved', async () => {
    const token = await employer();
    const w = await createVisibleWorker({ name: 'Gamma' });
    await request(app).put(`/api/favorites/${w.id}`).set(auth(token)).expect(204);

    await prisma.skill.updateMany({ where: { workerId: w.id }, data: { status: 'NOT_VERIFIED' } });
    expect((await request(app).get('/api/favorites').set(auth(token))).body.total).toBe(0);
    expect(await prisma.favorite.count()).toBe(1);

    await prisma.skill.updateMany({ where: { workerId: w.id }, data: { status: 'VERIFIED' } });
    expect((await request(app).get('/api/favorites').set(auth(token))).body.total).toBe(1);
  });

  it('keeps each employer\'s favorites separate', async () => {
    const t1 = await employer();
    const t2 = (await registerUser(employerBody('0722999888'))).accessToken;
    const w = await createVisibleWorker();
    await request(app).put(`/api/favorites/${w.id}`).set(auth(t1)).expect(204);
    expect((await request(app).get('/api/favorites').set(auth(t2))).body.total).toBe(0);
  });
});

describe('performance (NFR 5)', () => {
  it('returns filtered results in under 2 seconds with 5,000 workers', async () => {
    const token = await employer();
    const skills = await prisma.skillType.findMany();
    const regions = [['Kigali', 'Gasabo'], ['Kigali', 'Kicukiro'], ['Northern', 'Musanze'], ['Southern', 'Huye'], ['Eastern', 'Rwamagana']];

    const users: Prisma.UserCreateManyInput[] = [];
    const workers: { userId: string; region: string; city: string; bio: string; photoUrl: string; ratingAverage: number | null; ratingCount: number }[] = [];
    const skillRows: { workerId: string; skillTypeId: string; isMain: boolean; status: 'VERIFIED'; yearsOfExperience: number }[] = [];

    for (let i = 0; i < 5000; i++) {
      const id = randomUUID();
      const phone = `+2507${String(20_000_000 + i)}`;
      const [region, city] = regions[i % regions.length];
      users.push({ id, role: 'WORKER', phoneHash: hashPhone(phone), phoneEncrypted: encrypt(phone), name: `Perf Worker ${i}` });
      workers.push({ userId: id, region, city, bio: 'bio', photoUrl: '/uploads/profile/x.webp', ratingAverage: i % 4 === 0 ? null : 1 + (i % 41) / 10, ratingCount: i % 4 === 0 ? 0 : 1 + (i % 9) });
      skillRows.push({ workerId: id, skillTypeId: skills[i % skills.length].id, isMain: true, status: 'VERIFIED', yearsOfExperience: i % 20 });
    }
    await prisma.user.createMany({ data: users });
    await prisma.worker.createMany({ data: workers });
    await prisma.skill.createMany({ data: skillRows });
    await prisma.$executeRawUnsafe('ANALYZE "Worker", "Skill", "User"');

    const queries = ['', '?skill=electrician', '?skill=plumber&region=Kigali&minRating=3', '?region=Northern&city=Musanze&minRating=4&limit=50&offset=100'];
    for (const qs of queries) {
      const t0 = performance.now();
      const res = await search(token, qs).expect(200);
      const ms = performance.now() - t0;
      expect(res.body.total).toBeGreaterThan(0);
      expect(ms, `query "${qs}" took ${Math.round(ms)}ms`).toBeLessThan(2000);
    }
  }, 120_000);
});
