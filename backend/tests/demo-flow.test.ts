import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import sharp from 'sharp';
import { app, createAdmin, employerBody, registerUser, resetDb, workerBody } from './helpers';
import { prisma } from '../src/shared/prisma';

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

// The whole product story in one go, through the real HTTP API, from two people who have never met:
// a worker signs up and gets verified, an employer finds them, they talk, do a job, and the work is rated.
// The module tests check each rule in depth; this checks the pieces fit together.
describe('end to end: from sign-up to a rated job', () => {
  it('works for a worker, an employer and an admin', async () => {
    const admin = await createAdmin();

    // 1. The worker signs up and builds a profile.
    const worker = await registerUser(workerBody('0788111222'));
    const w = auth(worker.accessToken);
    const skills = (await request(app).get('/api/skill-types')).body as { id: string; slug: string }[];
    const photo = await sharp({ create: { width: 400, height: 400, channels: 3, background: '#4a7' } }).png().toBuffer();

    await request(app).put('/api/workers/me').set(w).send({ bio: 'Electrician in Gasabo.', shareContact: false }).expect(200);
    await request(app).put('/api/workers/me/photo').set(w).attach('photo', photo, 'me.png').expect(200);
    const mainSkill = skills.find((s) => s.slug === 'electrician')!;
    await request(app).put('/api/workers/me/main-skill').set(w).send({ skillTypeId: mainSkill.id, yearsOfExperience: 6 }).expect(200);

    // Complete profile, but not visible until the skill is verified (BR 1).
    const before = await request(app).get('/api/workers/me').set(w).expect(200);
    expect(before.body).toMatchObject({ profileComplete: true, visibleToEmployers: false });

    // 2. The employer signs up. The worker isn't in their search yet.
    const employer = await registerUser(employerBody('0722333444'));
    const e = auth(employer.accessToken);
    const empty = await request(app).get('/api/workers').set(e).query({ skill: 'electrician' }).expect(200);
    expect(empty.body.total).toBe(0);
    await request(app).post('/api/messages').set(e).send({ recipientId: worker.user.id, content: 'hello' }).expect(404);

    // 3. The worker submits three references; the admin calls them and records two confirmations (FR 3).
    await request(app)
      .post('/api/workers/me/references')
      .set(w)
      .send({
        references: [
          { name: 'Mrs. Uwase', phone: '0788000001', relationship: 'Customer' },
          { name: 'Mr. Habimana', phone: '0788000002', relationship: 'Supervisor' },
          { name: 'Mr. Nkusi', phone: '0788000003', relationship: 'Customer' },
        ],
      })
      .expect(201);
    const a = auth(admin.token);
    const queue = await request(app).get('/api/admin/verifications').set(a).query({ status: 'OPEN' }).expect(200);
    expect(queue.body).toHaveLength(1);
    const refs = queue.body[0].references as { id: string; phone: string }[];
    expect(refs[0]!.phone).toMatch(/^\+2507/); // admins see the numbers they must call
    await request(app).post(`/api/admin/references/${refs[0]!.id}/result`).set(a).send({ result: 'CONFIRMED' }).expect(200);
    await request(app).post(`/api/admin/references/${refs[1]!.id}/result`).set(a).send({ result: 'UNREACHABLE' }).expect(200);
    const verified = await request(app).post(`/api/admin/references/${refs[2]!.id}/result`).set(a).send({ result: 'CONFIRMED' }).expect(200);
    expect(verified.body.status).toBe('VERIFIED');

    const status = await request(app).get('/api/workers/me/verification').set(w).expect(200);
    expect(status.body).toMatchObject({ status: 'VERIFIED', canSubmit: false });
    expect(JSON.stringify(status.body)).not.toMatch(/\+2507880/); // reference numbers are never shown to the worker
    expect((await request(app).get('/api/workers/me').set(w)).body.visibleToEmployers).toBe(true);

    // 4. The employer finds them, without ever seeing a phone number (BR 5).
    const found = await request(app).get('/api/workers').set(e).query({ skill: 'electrician', region: 'Kigali' }).expect(200);
    expect(found.body.items).toHaveLength(1);
    const card = found.body.items[0];
    expect(card).toMatchObject({ id: worker.user.id, mainSkill: { slug: 'electrician', verified: true, yearsOfExperience: 6 } });
    expect(JSON.stringify(found.body)).not.toMatch(/\+2507881/);
    const detail = await request(app).get(`/api/workers/${worker.user.id}`).set(e).expect(200);
    expect(detail.body.phone).toBeNull();
    await request(app).put(`/api/favorites/${worker.user.id}`).set(e).expect(204);
    expect((await request(app).get('/api/favorites').set(e)).body.items).toHaveLength(1);

    // 5. They talk. A worker can only reply, and sees an unread count until they open the chat.
    await request(app).post('/api/messages').set(w).send({ recipientId: employer.user.id, content: 'hi' }).expect(403);
    await request(app).post('/api/messages').set(e).send({ recipientId: worker.user.id, content: 'Are you free Monday?' }).expect(201);
    expect((await request(app).get('/api/messages/unread-count').set(w)).body.unread).toBe(1);
    const thread = await request(app).get(`/api/messages/with/${employer.user.id}`).set(w).expect(200);
    expect(thread.body.items.map((m: { content: string }) => m.content)).toEqual(['Are you free Monday?']);
    expect((await request(app).get('/api/messages/unread-count').set(w)).body.unread).toBe(0);
    await request(app).post('/api/messages').set(w).send({ recipientId: employer.user.id, content: 'Yes, 8am.' }).expect(201);
    expect((await request(app).get('/api/messages/unread-count').set(e)).body.unread).toBe(1);

    // 6. They do the job: the employer marks it done, the worker confirms, and only then can it be rated (BR 3).
    const job = await request(app).post('/api/jobs').set(e).send({ workerId: worker.user.id }).expect(201);
    const jobId = job.body.id as string;
    await request(app).post('/api/ratings').set(e).send({ jobId, stars: 5 }).expect(409); // not completed yet
    await request(app).post(`/api/jobs/${jobId}/complete`).set(w).expect(409); // the employer goes first
    await request(app).post(`/api/jobs/${jobId}/complete`).set(e).expect(200);
    await request(app).post(`/api/jobs/${jobId}/complete`).set(w).expect(200);
    await request(app).post('/api/ratings').set(e).send({ jobId, stars: 5, comment: 'Neat, on-time installation' }).expect(201);
    await request(app).post('/api/ratings').set(e).send({ jobId, stars: 1 }).expect(409); // once per job

    // 7. The rating is visible everywhere it should be.
    const after = await request(app).get('/api/workers').set(e).query({ skill: 'electrician', minRating: 5 }).expect(200);
    expect(after.body.items[0].rating).toEqual({ average: 5, count: 1 });
    const detail2 = await request(app).get(`/api/workers/${worker.user.id}`).set(e).expect(200);
    expect(detail2.body.reviews[0]).toMatchObject({ stars: 5, comment: 'Neat, on-time installation', employer: 'BrightHomes Ltd' });
    const mine = await request(app).get('/api/workers/me/ratings').set(w).expect(200);
    expect(mine.body).toMatchObject({ average: 5, count: 1 });
  });
});
