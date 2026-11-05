import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import sharp from 'sharp';
import { rm } from 'node:fs/promises';
import { app, createAdmin, employerBody, registerUser, resetDb, workerBody } from './helpers';
import { prisma } from '../src/shared/prisma';
import { UPLOAD_ROOT } from '../src/shared/storage';

beforeEach(resetDb);
afterAll(async () => {
  await rm(UPLOAD_ROOT, { recursive: true, force: true });
  await prisma.$disconnect();
});

const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

const refs = (phones = ['0788000001', '0788000002', '0788000003']) => ({
  references: phones.map((phone, i) => ({
    name: ['Mrs. Uwase', 'Mr. Habimana', 'Mr. Nkusi'][i],
    phone,
    relationship: ['customer', 'supervisor', 'customer'][i],
  })),
});

// A worker with a main skill, ready to submit references.
async function workerWithSkill() {
  const w = await registerUser(workerBody());
  const solar = await prisma.skillType.findUniqueOrThrow({ where: { slug: 'solar-technician' } });
  await request(app).put('/api/workers/me/main-skill').set(auth(w.accessToken)).send({ skillTypeId: solar.id, yearsOfExperience: 5 });
  return w;
}

async function submittedRound() {
  const w = await workerWithSkill();
  const res = await request(app).post('/api/workers/me/references').set(auth(w.accessToken)).send(refs()).expect(201);
  return { w, round: res.body.rounds[0] as { id: string; references: { id: string }[] } };
}

const record = (token: string, referenceId: string, result: string) =>
  request(app).post(`/api/admin/references/${referenceId}/result`).set(auth(token)).send({ result });

describe('submitting references (FR 3.1, FR 3.5)', () => {
  it('opens a round with three pending references and hides their phone numbers from the worker', async () => {
    const w = await workerWithSkill();
    const res = await request(app).post('/api/workers/me/references').set(auth(w.accessToken)).send(refs()).expect(201);

    expect(res.body.status).toBe('PENDING');
    expect(res.body.canSubmit).toBe(false);
    expect(res.body.rounds).toHaveLength(1);
    expect(res.body.rounds[0].references.map((r: { result: string }) => r.result)).toEqual(['PENDING', 'PENDING', 'PENDING']);
    expect(JSON.stringify(res.body)).not.toContain('788000001');

    const stored = await prisma.reference.findFirstOrThrow();
    expect(stored.phoneEncrypted).not.toContain('788000001');
  });

  it('needs a main skill first', async () => {
    const w = await registerUser(workerBody());
    const res = await request(app).post('/api/workers/me/references').set(auth(w.accessToken)).send(refs());
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('NO_MAIN_SKILL');
  });

  it('rejects anything other than exactly three distinct, valid references', async () => {
    const w = await workerWithSkill();
    const two = { references: refs().references.slice(0, 2) };
    await request(app).post('/api/workers/me/references').set(auth(w.accessToken)).send(two).expect(400);
    await request(app).post('/api/workers/me/references').set(auth(w.accessToken)).send(refs(['0788000001', '0788000001', '0788000003'])).expect(400);
    await request(app).post('/api/workers/me/references').set(auth(w.accessToken)).send(refs(['0788000001', '0788000002', '123'])).expect(400);
    expect(await prisma.verificationRound.count()).toBe(0);
  });

  it('does not let a worker list their own number as a reference', async () => {
    const w = await workerWithSkill();
    const res = await request(app).post('/api/workers/me/references').set(auth(w.accessToken)).send(refs(['0788123456', '0788000002', '0788000003']));
    expect(res.body.error.code).toBe('REFERENCE_IS_SELF');
  });

  it('does not allow a second submission while a round is open', async () => {
    const { w } = await submittedRound();
    const res = await request(app).post('/api/workers/me/references').set(auth(w.accessToken)).send(refs());
    expect(res.body.error.code).toBe('ROUND_OPEN');
  });

  it('shows the worker their verification status and history', async () => {
    const { w } = await submittedRound();
    const res = await request(app).get('/api/workers/me/verification').set(auth(w.accessToken)).expect(200);
    expect(res.body.mainSkill.skillType.slug).toBe('solar-technician');
    expect(res.body.rounds[0].roundNumber).toBe(1);
  });

  it('is only for workers', async () => {
    const emp = await registerUser(employerBody());
    await request(app).post('/api/workers/me/references').set(auth(emp.accessToken)).send(refs()).expect(403);
  });
});

describe('admin access', () => {
  it('is closed to workers, employers and anonymous callers', async () => {
    const w = await workerWithSkill();
    const emp = await registerUser(employerBody());
    for (const path of ['/api/admin/verifications', '/api/admin/flagged-skills']) {
      await request(app).get(path).expect(401);
      await request(app).get(path).set(auth(w.accessToken)).expect(403);
      await request(app).get(path).set(auth(emp.accessToken)).expect(403);
    }
    await record(w.accessToken, '00000000-0000-0000-0000-000000000000', 'CONFIRMED').expect(403);
  });

  it('lists open rounds with the decrypted reference phone numbers', async () => {
    await submittedRound();
    const admin = await createAdmin();
    const res = await request(app).get('/api/admin/verifications').set(auth(admin.token)).expect(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].worker.name).toBe('Jean Mugabo');
    expect(res.body[0].references.map((r: { phone: string }) => r.phone).sort()).toEqual(['+250788000001', '+250788000002', '+250788000003']);
  });
});

describe('recording results (FR 3.2 – 3.4)', () => {
  it('verifies the skill at 2 confirmations even if the third is unreachable', async () => {
    const { w, round } = await submittedRound();
    const admin = await createAdmin();
    const [r1, r2, r3] = round.references;

    let res = await record(admin.token, r1.id, 'CONFIRMED').expect(200);
    expect(res.body.status).toBe('OPEN');
    res = await record(admin.token, r3.id, 'UNREACHABLE').expect(200);
    expect(res.body.status).toBe('OPEN'); // 1 confirmed + 1 pending can still reach 2
    res = await record(admin.token, r2.id, 'CONFIRMED').expect(200);
    expect(res.body.status).toBe('VERIFIED');
    expect(res.body.closedAt).toBeTruthy();

    const me = await request(app).get('/api/workers/me').set(auth(w.accessToken));
    expect(me.body.mainSkill.status).toBe('VERIFIED');
  });

  it('records who recorded each result and when (FR 3.3)', async () => {
    const { round } = await submittedRound();
    const admin = await createAdmin();
    const res = await record(admin.token, round.references[0].id, 'CONFIRMED').expect(200);
    const ref = res.body.references.find((r: { id: string }) => r.id === round.references[0].id);
    expect(ref.recordedById).toBe(admin.id);
    expect(ref.recordedAt).toBeTruthy();
  });

  it('marks the skill Not verified as soon as 2 confirmations are impossible', async () => {
    const { w, round } = await submittedRound();
    const admin = await createAdmin();
    await record(admin.token, round.references[0].id, 'NOT_CONFIRMED').expect(200);
    const res = await record(admin.token, round.references[1].id, 'UNREACHABLE').expect(200);
    expect(res.body.status).toBe('NOT_VERIFIED');

    const status = await request(app).get('/api/workers/me/verification').set(auth(w.accessToken));
    expect(status.body.status).toBe('NOT_VERIFIED');
    expect(status.body.canSubmit).toBe(true);
  });

  it('lets an admin correct a result while the round is still open', async () => {
    const { round } = await submittedRound();
    const admin = await createAdmin();
    await record(admin.token, round.references[0].id, 'NOT_CONFIRMED').expect(200);
    const res = await record(admin.token, round.references[0].id, 'CONFIRMED').expect(200);
    expect(res.body.references.find((r: { id: string }) => r.id === round.references[0].id).result).toBe('CONFIRMED');
  });

  it('refuses changes once the round has closed', async () => {
    const { round } = await submittedRound();
    const admin = await createAdmin();
    await record(admin.token, round.references[0].id, 'CONFIRMED');
    await record(admin.token, round.references[1].id, 'CONFIRMED');
    const res = await record(admin.token, round.references[2].id, 'CONFIRMED');
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('ROUND_CLOSED');
  });

  it('validates the result value and the reference id', async () => {
    const { round } = await submittedRound();
    const admin = await createAdmin();
    await record(admin.token, round.references[0].id, 'PENDING').expect(400);
    await record(admin.token, '00000000-0000-0000-0000-000000000000', 'CONFIRMED').expect(404);
  });

  it('survives two admins recording at the same time', async () => {
    const { round } = await submittedRound();
    const a = await createAdmin('+250780000002');
    const b = await createAdmin('+250780000003');
    const results = await Promise.all([
      record(a.token, round.references[0].id, 'CONFIRMED'),
      record(b.token, round.references[1].id, 'CONFIRMED'),
    ]);
    expect(results.map((r) => r.status)).toEqual([200, 200]);
    const stored = await prisma.verificationRound.findFirstOrThrow();
    expect(stored.status).toBe('VERIFIED');
  });
});

describe('resubmission after failure (FR 3.5)', () => {
  it('starts round 2 and keeps round 1 as history', async () => {
    const { w, round } = await submittedRound();
    const admin = await createAdmin();
    await record(admin.token, round.references[0].id, 'NOT_CONFIRMED');
    await record(admin.token, round.references[1].id, 'NOT_CONFIRMED');

    const res = await request(app)
      .post('/api/workers/me/references')
      .set(auth(w.accessToken))
      .send(refs(['0788000011', '0788000012', '0788000013']))
      .expect(201);
    expect(res.body.status).toBe('PENDING');
    expect(res.body.rounds.map((r: { roundNumber: number; status: string }) => [r.roundNumber, r.status])).toEqual([
      [2, 'OPEN'],
      [1, 'NOT_VERIFIED'],
    ]);
  });

  it('does not allow resubmitting once verified', async () => {
    const { w, round } = await submittedRound();
    const admin = await createAdmin();
    await record(admin.token, round.references[0].id, 'CONFIRMED');
    await record(admin.token, round.references[1].id, 'CONFIRMED');
    const res = await request(app).post('/api/workers/me/references').set(auth(w.accessToken)).send(refs(['0788000021', '0788000022', '0788000023']));
    expect(res.body.error.code).toBe('ALREADY_VERIFIED');
  });
});

describe('interaction with profile rules', () => {
  it('BR 4(c): changing the main skill closes the open round so it can no longer verify anything', async () => {
    const { w, round } = await submittedRound();
    const admin = await createAdmin();
    const electrician = await prisma.skillType.findUniqueOrThrow({ where: { slug: 'electrician' } });
    await request(app).put('/api/workers/me/main-skill').set(auth(w.accessToken)).send({ skillTypeId: electrician.id, yearsOfExperience: 3 });

    const res = await record(admin.token, round.references[0].id, 'CONFIRMED');
    expect(res.body.error.code).toBe('ROUND_CLOSED');
    // and the worker needs 3 new references for the new skill
    await request(app).post('/api/workers/me/references').set(auth(w.accessToken)).send(refs(['0788000031', '0788000032', '0788000033'])).expect(201);
  });

  it('BR 1: a complete profile becomes visible to employers once verification succeeds', async () => {
    const { w, round } = await submittedRound();
    const admin = await createAdmin();
    const png = await sharp({ create: { width: 100, height: 100, channels: 3, background: '#3a3' } }).png().toBuffer();
    await request(app).put('/api/workers/me/photo').set(auth(w.accessToken)).attach('photo', png, 'me.png');
    await request(app).put('/api/workers/me').set(auth(w.accessToken)).send({ bio: 'Solar installer' });

    let me = await request(app).get('/api/workers/me').set(auth(w.accessToken));
    expect(me.body.visibleToEmployers).toBe(false);

    await record(admin.token, round.references[0].id, 'CONFIRMED');
    await record(admin.token, round.references[1].id, 'CONFIRMED');
    me = await request(app).get('/api/workers/me').set(auth(w.accessToken));
    expect(me.body.visibleToEmployers).toBe(true);
  });
});

describe('flagged skills (BR 4b)', () => {
  it('lists skills whose experience changed after verification, and lets an admin clear the flag', async () => {
    const { w, round } = await submittedRound();
    const admin = await createAdmin();
    await record(admin.token, round.references[0].id, 'CONFIRMED');
    await record(admin.token, round.references[1].id, 'CONFIRMED');

    const solar = await prisma.skillType.findUniqueOrThrow({ where: { slug: 'solar-technician' } });
    await request(app).put('/api/workers/me/main-skill').set(auth(w.accessToken)).send({ skillTypeId: solar.id, yearsOfExperience: 9 });

    const list = await request(app).get('/api/admin/flagged-skills').set(auth(admin.token)).expect(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0]).toMatchObject({ yearsOfExperience: 9, status: 'VERIFIED' });

    await request(app).post(`/api/admin/skills/${list.body[0].id}/clear-flag`).set(auth(admin.token)).expect(204);
    const after = await request(app).get('/api/admin/flagged-skills').set(auth(admin.token));
    expect(after.body).toHaveLength(0);
    await request(app).post('/api/admin/skills/00000000-0000-0000-0000-000000000000/clear-flag').set(auth(admin.token)).expect(404);
  });
});
