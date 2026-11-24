import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/shared/prisma';
import { setSms } from '../src/shared/sms';
import { skillTypes } from '../prisma/skill-types';
import { encrypt, hashPhone } from '../src/shared/crypto';
import { signAccessToken } from '../src/modules/auth/tokens';

export const app = createApp();

// Captures OTP texts so tests can read the code that would have been sent.
const sent: { to: string; message: string }[] = [];
setSms({ send: async (to, message) => void sent.push({ to, message }) });

/** The full text of the last SMS sent to a number. */
export function lastSms(phone: string): string {
  const msg = [...sent].reverse().find((m) => m.to === phone);
  if (!msg) throw new Error(`no SMS sent to ${phone}`);
  return msg.message;
}

export function lastCode(phone: string): string {
  const msg = [...sent].reverse().find((m) => m.to === phone);
  if (!msg) throw new Error(`no SMS sent to ${phone}`);
  return /(\d{6})/.exec(msg.message)![1];
}

export async function resetDb() {
  sent.length = 0;
  // Keep reference data (SkillType, ensured below); wipe everything else.
  await prisma.$executeRawUnsafe(
    `TRUNCATE "Message","Rating","Job","Favorite","PortfolioPhoto","Reference","VerificationRound","Skill",
     "RefreshToken","OtpCode","Admin","Employer","Worker","User" RESTART IDENTITY CASCADE`,
  );
  for (const st of skillTypes) {
    await prisma.skillType.upsert({ where: { slug: st.slug }, update: st, create: st });
  }
}

let phoneCounter = 0;

// Creates a worker straight in the DB (fast) for search tests. Defaults to fully visible to employers.
export async function createVisibleWorker(
  o: {
    name?: string;
    skill?: string;
    region?: string;
    city?: string;
    rating?: number | null;
    ratingCount?: number;
    status?: 'PENDING' | 'VERIFIED' | 'NOT_VERIFIED';
    bio?: string | null;
    photoUrl?: string | null;
    shareContact?: boolean;
    years?: number;
  } = {},
) {
  const phone = `+25078${String(1_000_000 + ++phoneCounter)}`;
  const skillType = await prisma.skillType.findUniqueOrThrow({ where: { slug: o.skill ?? 'solar-technician' } });
  const rating = o.rating === undefined ? null : o.rating;
  const user = await prisma.user.create({
    data: {
      role: 'WORKER',
      phoneHash: hashPhone(phone),
      phoneEncrypted: encrypt(phone),
      name: o.name ?? `Worker ${phoneCounter}`,
      worker: {
        create: {
          region: o.region ?? 'Kigali',
          city: o.city ?? 'Gasabo',
          bio: o.bio === undefined ? 'Experienced technician' : o.bio,
          photoUrl: o.photoUrl === undefined ? '/uploads/profile/x.webp' : o.photoUrl,
          shareContact: o.shareContact ?? false,
          ratingAverage: rating,
          ratingCount: o.ratingCount ?? (rating === null ? 0 : 3),
          skills: {
            create: { skillTypeId: skillType.id, isMain: true, status: o.status ?? 'VERIFIED', yearsOfExperience: o.years ?? 5 },
          },
        },
      },
    },
  });
  return { id: user.id, phone, token: signAccessToken(user.id, 'WORKER') };
}

// Creates an admin directly in the DB and returns a ready-made access token (login is covered in auth tests).
export async function createAdmin(phone = '+250780000002') {
  const user = await prisma.user.create({
    data: {
      role: 'ADMIN',
      phoneHash: hashPhone(phone),
      phoneEncrypted: encrypt(phone),
      name: 'Admin Alice',
      admin: { create: { secondFactorEnabled: true } },
    },
  });
  return { id: user.id, token: signAccessToken(user.id, 'ADMIN') };
}

export const workerBody =(phone = '0788123456') => ({
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
