import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/shared/prisma';
import { setSms } from '../src/shared/sms';

export const app = createApp();

// Captures OTP texts so tests can read the code that would have been sent.
const sent: { to: string; message: string }[] = [];
setSms({ send: async (to, message) => void sent.push({ to, message }) });

export function lastCode(phone: string): string {
  const msg = [...sent].reverse().find((m) => m.to === phone);
  if (!msg) throw new Error(`no SMS sent to ${phone}`);
  return /(\d{6})/.exec(msg.message)![1];
}

export async function resetDb() {
  sent.length = 0;
  // Keep reference data (SkillType); wipe everything else.
  await prisma.$executeRawUnsafe(
    `TRUNCATE "Message","Rating","Job","Favorite","PortfolioPhoto","Reference","VerificationRound","Skill",
     "RefreshToken","OtpCode","Admin","Employer","Worker","User" RESTART IDENTITY CASCADE`,
  );
}

export const workerBody = (phone = '0788123456') => ({
  role: 'WORKER',
  phone,
  name: 'Jean Mugabo',
  language: 'RW',
  region: 'Kigali',
  city: 'Gasabo',
});

export const employerBody = (phone = '0722123456') => ({
  role: 'EMPLOYER',
  phone,
  name: 'Marie Uwase',
  language: 'EN',
  companyName: 'BrightHomes Ltd',
  region: 'Kigali',
  city: 'Nyarugenge',
  contactInfo: 'info@brighthomes.rw',
});

// Full sign-up flow; returns the token pair.
export async function registerUser(body: Record<string, unknown>) {
  await request(app).post('/api/auth/register').send(body).expect(202);
  const phone = '+250' + String(body.phone).replace(/^0/, '');
  const res = await request(app)
    .post('/api/auth/register/verify')
    .send({ phone: body.phone, code: lastCode(phone) })
    .expect(201);
  return res.body as { user: { id: string; role: string }; accessToken: string; refreshToken: string };
}
