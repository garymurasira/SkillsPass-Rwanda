import { beforeEach, describe, expect, it, afterAll } from 'vitest';
import request from 'supertest';
import { app, employerBody, lastCode, registerUser, resetDb, workerBody } from './helpers';
import { prisma } from '../src/shared/prisma';
import { encrypt, hashPhone } from '../src/shared/crypto';
import { generateTotpSecret, totpAt } from '../src/shared/totp';

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe('registration', () => {
  it('creates a worker only after the OTP is verified', async () => {
    await request(app).post('/api/auth/register').send(workerBody()).expect(202);
    expect(await prisma.user.count()).toBe(0);

    const res = await request(app)
      .post('/api/auth/register/verify')
      .send({ phone: '0788123456', code: lastCode('+250788123456') });
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ role: 'WORKER', name: 'Jean Mugabo', language: 'RW' });
    expect(res.body.accessToken).toBeTruthy();
    expect(JSON.stringify(res.body)).not.toContain('788123456');
    expect(await prisma.worker.count()).toBe(1);
  });

  it('creates an employer with company details', async () => {
    const { user } = await registerUser(employerBody());
    const emp = await prisma.employer.findUnique({ where: { userId: user.id } });
    expect(emp?.companyName).toBe('BrightHomes Ltd');
  });

  it('stores the phone number encrypted, never in plaintext', async () => {
    await registerUser(workerBody());
    const u = await prisma.user.findFirstOrThrow();
    expect(u.phoneEncrypted).not.toContain('788123456');
    expect(u.phoneHash).toBe(hashPhone('0788123456'));
  });

  it('rejects an invalid phone number and an already registered one', async () => {
    const bad = await request(app).post('/api/auth/register').send(workerBody('12345'));
    expect(bad.status).toBe(400);
    expect(bad.body.error.code).toBe('VALIDATION_ERROR');

    await registerUser(workerBody());
    const dup = await request(app).post('/api/auth/register').send(workerBody('+250 788 123 456'));
    expect(dup.status).toBe(409);
    expect(dup.body.error.code).toBe('PHONE_TAKEN');
  });

  it('will not create an admin through public registration', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...workerBody(), role: 'ADMIN' });
    expect(res.status).toBe(400);
  });

  it('blocks a wrong code and locks after 5 failed attempts', async () => {
    await request(app).post('/api/auth/register').send(workerBody()).expect(202);
    const real = lastCode('+250788123456');
    const wrong = real === '000000' ? '111111' : '000000';

    for (let i = 0; i < 5; i++) {
      const r = await request(app).post('/api/auth/register/verify').send({ phone: '0788123456', code: wrong });
      expect(r.body.error.code).toBe('OTP_INVALID');
    }
    const locked = await request(app).post('/api/auth/register/verify').send({ phone: '0788123456', code: real });
    expect(locked.status).toBe(429);
    expect(locked.body.error.code).toBe('OTP_LOCKED');
  });

  it('enforces a cooldown between OTP requests and single use of a code', async () => {
    await request(app).post('/api/auth/register').send(workerBody()).expect(202);
    const again = await request(app).post('/api/auth/register').send(workerBody());
    expect(again.status).toBe(429);
    expect(again.body.error.code).toBe('OTP_TOO_SOON');

    const code = lastCode('+250788123456');
    await request(app).post('/api/auth/register/verify').send({ phone: '0788123456', code }).expect(201);
    await request(app).post('/api/auth/register/verify').send({ phone: '0788123456', code }).expect(400);
  });
});

describe('login, refresh and logout', () => {
  it('logs in an existing user with an OTP', async () => {
    await registerUser(workerBody());
    await prisma.otpCode.deleteMany(); // clear the registration code so the resend cooldown doesn't apply
    await request(app).post('/api/auth/login').send({ phone: '0788123456' }).expect(202);
    const res = await request(app)
      .post('/api/auth/login/verify')
      .send({ phone: '0788123456', code: lastCode('+250788123456') });
    expect(res.status).toBe(200);
    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${res.body.accessToken}`);
    expect(me.body.name).toBe('Jean Mugabo');
  });

  it('returns 404 when logging in an unknown phone', async () => {
    const res = await request(app).post('/api/auth/login').send({ phone: '0788999999' });
    expect(res.status).toBe(404);
  });

  it('rejects requests without a valid token', async () => {
    await request(app).get('/api/auth/me').expect(401);
    await request(app).get('/api/auth/me').set('Authorization', 'Bearer nonsense').expect(401);
  });

  it('rotates refresh tokens and revokes everything when one is reused', async () => {
    const { refreshToken } = await registerUser(workerBody());
    const first = await request(app).post('/api/auth/refresh').send({ refreshToken }).expect(200);
    expect(first.body.refreshToken).not.toBe(refreshToken);

    // Reusing the old token is treated as theft: the new one dies too.
    await request(app).post('/api/auth/refresh').send({ refreshToken }).expect(401);
    await request(app).post('/api/auth/refresh').send({ refreshToken: first.body.refreshToken }).expect(401);
  });

  it('logout revokes the refresh token', async () => {
    const { refreshToken } = await registerUser(workerBody());
    await request(app).post('/api/auth/logout').send({ refreshToken }).expect(204);
    await request(app).post('/api/auth/refresh').send({ refreshToken }).expect(401);
  });

  it('lets a user switch language', async () => {
    const { accessToken } = await registerUser(workerBody());
    const res = await request(app)
      .patch('/api/auth/me/language')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ language: 'FR' });
    expect(res.body.language).toBe('FR');
  });
});

describe('admin second factor', () => {
  async function createAdmin(enrolled: boolean) {
    const phone = '+250780000001';
    const secret = generateTotpSecret();
    await prisma.user.create({
      data: {
        role: 'ADMIN',
        phoneHash: hashPhone(phone),
        phoneEncrypted: encrypt(phone),
        name: 'Admin Alice',
        admin: { create: enrolled ? { secondFactorEnabled: true, totpSecretEncrypted: encrypt(secret) } : {} },
      },
    });
    return { phone, secret };
  }

  const loginOtp = async (phone: string) => {
    await request(app).post('/api/auth/login').send({ phone }).expect(202);
    return lastCode(phone);
  };

  it('requires the authenticator code in addition to the SMS code', async () => {
    const { phone, secret } = await createAdmin(true);

    const code1 = await loginOtp(phone);
    const missing = await request(app).post('/api/auth/login/verify').send({ phone, code: code1 });
    expect(missing.body.error.code).toBe('TOTP_REQUIRED');

    await prisma.otpCode.deleteMany();
    const code2 = await loginOtp(phone);
    const wrong = await request(app).post('/api/auth/login/verify').send({ phone, code: code2, totpCode: '000000' });
    expect(wrong.body.error.code).toBe('TOTP_INVALID');

    await prisma.otpCode.deleteMany();
    const code3 = await loginOtp(phone);
    const ok = await request(app)
      .post('/api/auth/login/verify')
      .send({ phone, code: code3, totpCode: totpAt(secret, Date.now()) });
    expect(ok.status).toBe(200);
    expect(ok.body.user.role).toBe('ADMIN');
  });

  it('refuses admin login until a second factor is enrolled', async () => {
    const { phone } = await createAdmin(false);
    const code = await loginOtp(phone);
    const res = await request(app).post('/api/auth/login/verify').send({ phone, code });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ADMIN_2FA_NOT_ENROLLED');
  });
});
