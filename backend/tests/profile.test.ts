import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import sharp from 'sharp';
import { rm } from 'node:fs/promises';
import { app, employerBody, lastCode, registerUser, resetDb, workerBody } from './helpers';
import { prisma } from '../src/shared/prisma';
import { UPLOAD_ROOT } from '../src/shared/storage';

beforeEach(resetDb);
afterAll(async () => {
  await rm(UPLOAD_ROOT, { recursive: true, force: true });
  await prisma.$disconnect();
});

const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

async function skillTypeId(slug: string) {
  return (await prisma.skillType.findUniqueOrThrow({ where: { slug } })).id;
}

// A large noisy image so compression has real work to do.
const bigImage = () =>
  sharp({ create: { width: 3000, height: 2400, channels: 3, background: '#888', noise: { type: 'gaussian', mean: 128, sigma: 60 } } })
    .jpeg({ quality: 95 })
    .toBuffer();

async function newWorker() {
  return registerUser(workerBody());
}

describe('skill types', () => {
  it('lists the dropdown options publicly', async () => {
    const res = await request(app).get('/api/skill-types').expect(200);
    expect(res.body.map((s: { slug: string }) => s.slug)).toContain('solar-technician');
  });
});

describe('worker profile', () => {
  it('starts incomplete and reports what is missing', async () => {
    const { accessToken } = await newWorker();
    const res = await request(app).get('/api/workers/me').set(auth(accessToken)).expect(200);
    expect(res.body.profileComplete).toBe(false);
    expect(res.body.missing).toEqual(['mainSkill', 'photo', 'bio']);
    expect(res.body.visibleToEmployers).toBe(false);
    expect(res.body.phone).toBe('+250788123456');
  });

  it('only workers can use worker endpoints', async () => {
    const emp = await registerUser(employerBody());
    await request(app).get('/api/workers/me').set(auth(emp.accessToken)).expect(403);
    await request(app).get('/api/workers/me').expect(401);
  });

  it('updates details and clears the bio with an empty string', async () => {
    const { accessToken } = await newWorker();
    let res = await request(app)
      .put('/api/workers/me')
      .set(auth(accessToken))
      .send({ bio: 'Solar installer, 5 years', city: 'Kicukiro', shareContact: true })
      .expect(200);
    expect(res.body).toMatchObject({ bio: 'Solar installer, 5 years', city: 'Kicukiro', shareContact: true });

    res = await request(app).put('/api/workers/me').set(auth(accessToken)).send({ bio: '' }).expect(200);
    expect(res.body.bio).toBeNull();
  });

  it('rejects a bio over 300 characters', async () => {
    const { accessToken } = await newWorker();
    await request(app).put('/api/workers/me').set(auth(accessToken)).send({ bio: 'x'.repeat(301) }).expect(400);
  });
});

describe('skills and BR 4', () => {
  it('sets a main skill as PENDING and lists other skills separately', async () => {
    const { accessToken } = await newWorker();
    const solar = await skillTypeId('solar-technician');
    const welder = await skillTypeId('welder');

    let res = await request(app)
      .put('/api/workers/me/main-skill')
      .set(auth(accessToken))
      .send({ skillTypeId: solar, yearsOfExperience: 5 })
      .expect(200);
    expect(res.body.mainSkill).toMatchObject({ yearsOfExperience: 5, status: 'PENDING' });

    res = await request(app)
      .post('/api/workers/me/other-skills')
      .set(auth(accessToken))
      .send({ skillTypeId: welder, yearsOfExperience: 2 })
      .expect(201);
    expect(res.body.otherSkills).toHaveLength(1);

    // the same skill can't be both main and other, or added twice
    await request(app).post('/api/workers/me/other-skills').set(auth(accessToken)).send({ skillTypeId: welder }).expect(409);
    await request(app).post('/api/workers/me/other-skills').set(auth(accessToken)).send({ skillTypeId: solar }).expect(409);
  });

  it('BR 4(b): changing years on a verified main skill keeps it verified and flags it for review', async () => {
    const { accessToken, user } = await newWorker();
    const solar = await skillTypeId('solar-technician');
    await request(app).put('/api/workers/me/main-skill').set(auth(accessToken)).send({ skillTypeId: solar, yearsOfExperience: 5 });
    await prisma.skill.updateMany({ where: { workerId: user.id }, data: { status: 'VERIFIED' } });

    const res = await request(app)
      .put('/api/workers/me/main-skill')
      .set(auth(accessToken))
      .send({ skillTypeId: solar, yearsOfExperience: 8 })
      .expect(200);
    expect(res.body.mainSkill).toMatchObject({ yearsOfExperience: 8, status: 'VERIFIED', flaggedForReview: true });
  });

  it('BR 4(c): changing the main skill resets verification and demotes the old one', async () => {
    const { accessToken, user } = await newWorker();
    const solar = await skillTypeId('solar-technician');
    const electrician = await skillTypeId('electrician');
    await request(app).put('/api/workers/me/main-skill').set(auth(accessToken)).send({ skillTypeId: solar, yearsOfExperience: 5 });
    const old = await prisma.skill.findFirstOrThrow({ where: { workerId: user.id } });
    await prisma.skill.update({ where: { id: old.id }, data: { status: 'VERIFIED' } });
    await prisma.verificationRound.create({ data: { skillId: old.id, roundNumber: 1 } });

    const res = await request(app)
      .put('/api/workers/me/main-skill')
      .set(auth(accessToken))
      .send({ skillTypeId: electrician, yearsOfExperience: 3 })
      .expect(200);

    expect(res.body.mainSkill.skillType.slug).toBe('electrician');
    expect(res.body.mainSkill.status).toBe('PENDING');
    expect(res.body.otherSkills.map((s: { skillType: { slug: string } }) => s.skillType.slug)).toEqual(['solar-technician']);
    expect(res.body.otherSkills[0].status).toBe('PENDING');
    // the abandoned round can no longer verify anything
    expect((await prisma.verificationRound.findFirstOrThrow({ where: { skillId: old.id } })).status).toBe('NOT_VERIFIED');
  });

  it('can promote an existing other skill to main', async () => {
    const { accessToken } = await newWorker();
    const solar = await skillTypeId('solar-technician');
    const welder = await skillTypeId('welder');
    await request(app).put('/api/workers/me/main-skill').set(auth(accessToken)).send({ skillTypeId: solar, yearsOfExperience: 5 });
    await request(app).post('/api/workers/me/other-skills').set(auth(accessToken)).send({ skillTypeId: welder, yearsOfExperience: 2 });

    const res = await request(app)
      .put('/api/workers/me/main-skill')
      .set(auth(accessToken))
      .send({ skillTypeId: welder, yearsOfExperience: 2 })
      .expect(200);
    expect(res.body.mainSkill.skillType.slug).toBe('welder');
    expect(res.body.otherSkills).toHaveLength(1);
  });

  it('removes other skills but never the main skill', async () => {
    const { accessToken } = await newWorker();
    const solar = await skillTypeId('solar-technician');
    const welder = await skillTypeId('welder');
    let res = await request(app).put('/api/workers/me/main-skill').set(auth(accessToken)).send({ skillTypeId: solar, yearsOfExperience: 5 });
    const mainId = res.body.mainSkill.id;
    res = await request(app).post('/api/workers/me/other-skills').set(auth(accessToken)).send({ skillTypeId: welder });

    await request(app).delete(`/api/workers/me/other-skills/${mainId}`).set(auth(accessToken)).expect(409);
    res = await request(app).delete(`/api/workers/me/other-skills/${res.body.otherSkills[0].id}`).set(auth(accessToken)).expect(200);
    expect(res.body.otherSkills).toHaveLength(0);
  });
});

describe('photos', () => {
  it('compresses a profile photo under 500KB', async () => {
    const { accessToken } = await newWorker();
    const raw = await bigImage();
    expect(raw.length).toBeGreaterThan(500 * 1024);

    const res = await request(app).put('/api/workers/me/photo').set(auth(accessToken)).attach('photo', raw, 'me.jpg').expect(200);
    const file = await request(app).get(res.body.photoUrl).expect(200);
    expect(file.body.length).toBeLessThan(500 * 1024);
  });

  it('compresses portfolio photos under 500KB and enforces the 12-photo limit', async () => {
    const { accessToken } = await newWorker();
    const raw = await bigImage();

    const first = await request(app).post('/api/workers/me/portfolio').set(auth(accessToken)).attach('photo', raw, 'a.jpg').expect(201);
    const stored = await request(app).get(first.body.portfolio[0].url).expect(200);
    expect(stored.body.length).toBeLessThan(500 * 1024);

    const small = await sharp({ create: { width: 200, height: 200, channels: 3, background: '#a33' } }).png().toBuffer();
    for (let i = 1; i < 12; i++) {
      await request(app).post('/api/workers/me/portfolio').set(auth(accessToken)).attach('photo', small, 'p.png').expect(201);
    }
    const over = await request(app).post('/api/workers/me/portfolio').set(auth(accessToken)).attach('photo', small, 'p.png');
    expect(over.status).toBe(409);
    expect(over.body.error.code).toBe('PORTFOLIO_FULL');
  });

  it('rejects files that are not images, and missing files', async () => {
    const { accessToken } = await newWorker();
    const fake = await request(app).post('/api/workers/me/portfolio').set(auth(accessToken)).attach('photo', Buffer.from('not an image'), 'x.jpg');
    expect(fake.status).toBe(400);
    expect(fake.body.error.code).toBe('INVALID_IMAGE');

    const none = await request(app).post('/api/workers/me/portfolio').set(auth(accessToken));
    expect(none.body.error.code).toBe('PHOTO_REQUIRED');
  });

  it('deletes a portfolio photo and its file', async () => {
    const { accessToken } = await newWorker();
    const small = await sharp({ create: { width: 100, height: 100, channels: 3, background: '#33a' } }).png().toBuffer();
    const added = await request(app).post('/api/workers/me/portfolio').set(auth(accessToken)).attach('photo', small, 'p.png');
    const { id, url } = added.body.portfolio[0];

    const res = await request(app).delete(`/api/workers/me/portfolio/${id}`).set(auth(accessToken)).expect(200);
    expect(res.body.portfolio).toHaveLength(0);
    await request(app).get(url).expect(404);
  });
});

describe('completeness and visibility (FR 1.4, BR 1)', () => {
  it('is visible to employers only when complete AND the main skill is verified', async () => {
    const { accessToken, user } = await newWorker();
    const solar = await skillTypeId('solar-technician');
    const small = await sharp({ create: { width: 100, height: 100, channels: 3, background: '#3a3' } }).png().toBuffer();

    await request(app).put('/api/workers/me/main-skill').set(auth(accessToken)).send({ skillTypeId: solar, yearsOfExperience: 5 });
    await request(app).put('/api/workers/me/photo').set(auth(accessToken)).attach('photo', small, 'me.png');
    let res = await request(app).put('/api/workers/me').set(auth(accessToken)).send({ bio: 'Solar installer' });

    expect(res.body.profileComplete).toBe(true);
    expect(res.body.visibleToEmployers).toBe(false); // complete, but not verified yet

    await prisma.skill.updateMany({ where: { workerId: user.id, isMain: true }, data: { status: 'VERIFIED' } });
    res = await request(app).get('/api/workers/me').set(auth(accessToken));
    expect(res.body.visibleToEmployers).toBe(true);
  });
});

describe('employer profile', () => {
  it('reads and updates company details', async () => {
    const { accessToken } = await registerUser(employerBody());
    let res = await request(app).get('/api/employers/me').set(auth(accessToken)).expect(200);
    expect(res.body.companyName).toBe('BrightHomes Ltd');

    res = await request(app).put('/api/employers/me').set(auth(accessToken)).send({ companyName: 'BrightHomes Rwanda', city: 'Gasabo' }).expect(200);
    expect(res.body).toMatchObject({ companyName: 'BrightHomes Rwanda', city: 'Gasabo' });
  });

  it('is off limits to workers', async () => {
    const { accessToken } = await newWorker();
    await request(app).get('/api/employers/me').set(auth(accessToken)).expect(403);
  });
});

describe('phone change (BR 4d)', () => {
  it('keeps the old number until the new one is confirmed by OTP', async () => {
    const { accessToken } = await newWorker();
    await request(app).post('/api/me/phone/change').set(auth(accessToken)).send({ phone: '0733000111' }).expect(202);

    let me = await request(app).get('/api/workers/me').set(auth(accessToken));
    expect(me.body.phone).toBe('+250788123456');
    expect(me.body.pendingPhone).toBe('+250733000111');

    const wrong = await request(app).post('/api/me/phone/confirm').set(auth(accessToken)).send({ code: '000000' });
    expect(wrong.status).toBe(400);

    await request(app).post('/api/me/phone/confirm').set(auth(accessToken)).send({ code: lastCode('+250733000111') }).expect(200);
    me = await request(app).get('/api/workers/me').set(auth(accessToken));
    expect(me.body.phone).toBe('+250733000111');
    expect(me.body.pendingPhone).toBeNull();

    await prisma.otpCode.deleteMany(); // clear the resend cooldown
    // the new number now logs in; the old one no longer exists
    await request(app).post('/api/auth/login').send({ phone: '0733000111' }).expect(202);
    await request(app).post('/api/auth/login').send({ phone: '0788123456' }).expect(404);
  });

  it('refuses a number that already belongs to someone else, and confirm without a request', async () => {
    const { accessToken } = await newWorker();
    await registerUser(employerBody('0722123456'));
    const taken = await request(app).post('/api/me/phone/change').set(auth(accessToken)).send({ phone: '0722123456' });
    expect(taken.status).toBe(409);

    const none = await request(app).post('/api/me/phone/confirm').set(auth(accessToken)).send({ code: '123456' });
    expect(none.body.error.code).toBe('NO_PENDING_PHONE');
  });
});
