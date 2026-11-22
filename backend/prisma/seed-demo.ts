/**
 * Demo data for presentations: a handful of verified workers with photos and reviews, three
 * employers, jobs in every state, messages with unread counts, and a few verification cases for
 * the admin screens. Development only. Run the normal seed first (it creates the admin):
 *
 *   npm run prisma:seed
 *   npm run seed:demo            add the demo data (does nothing if it is already there)
 *   npm run seed:demo -- --reset remove the demo data and add it again
 *
 * Only the accounts listed below are ever touched. Real or test accounts are left alone.
 * Sign in with the phone number; the SMS code is printed in the server console.
 */
import sharp from 'sharp';
import { prisma } from '../src/shared/prisma';
import { encrypt, hashPhone } from '../src/shared/crypto';
import { getStorage } from '../src/shared/storage';
import { env } from '../src/config/env';
import { skillTypes } from './skill-types';

if (env.NODE_ENV === 'production') {
  console.error('Refusing to seed demo data in production.');
  process.exit(1);
}

type W = {
  key: string;
  name: string;
  phone: string;
  region: string;
  city: string;
  skill: string;
  years: number;
  bio: string;
  hue: number;
  share?: boolean;
  /** How the main skill stands. */
  state?: 'verified' | 'open-round' | 'new' | 'flagged' | 'failed';
};

const workers: W[] = [
  { key: 'jean', name: 'Jean Bosco Niyonzima', phone: '+250788100001', region: 'Kigali', city: 'Gasabo', skill: 'electrician', years: 8, hue: 210, bio: 'Electrician for homes and shops. Wiring, sockets, lighting and safety checks. Based in Gasabo, I travel across Kigali.' },
  { key: 'claudine', name: 'Claudine Uwase', phone: '+250788100002', region: 'Kigali', city: 'Kicukiro', skill: 'plumber', years: 5, hue: 330, bio: 'Plumber. Leaks, new pipes, bathrooms and water tanks. Quick and tidy work.' },
  { key: 'eric', name: 'Eric Habimana', phone: '+250788100003', region: 'Southern', city: 'Huye', skill: 'carpenter', years: 12, hue: 30, share: true, bio: 'Carpenter with 12 years of experience: doors, windows, roofs, furniture made to order.' },
  { key: 'aline', name: 'Aline Mukamana', phone: '+250788100004', region: 'Eastern', city: 'Rwamagana', skill: 'solar-technician', years: 4, hue: 48, bio: 'I install and repair solar panels and batteries for homes, schools and small businesses.' },
  { key: 'patrick', name: 'Patrick Nshimiyimana', phone: '+250788100005', region: 'Western', city: 'Rubavu', skill: 'mechanic', years: 10, hue: 0, bio: 'Mechanic for motorbikes and small cars. Engine repair, brakes, servicing.' },
  { key: 'emmanuel', name: 'Emmanuel Hakizimana', phone: '+250788100006', region: 'Northern', city: 'Musanze', skill: 'mason', years: 15, hue: 20, bio: 'Mason with 15 years on building sites: foundations, walls, plastering and tiling.' },
  { key: 'diane', name: 'Diane Ingabire', phone: '+250788100007', region: 'Kigali', city: 'Nyarugenge', skill: 'welder', years: 6, hue: 280, bio: 'Welder: gates, window grills, metal roofs and frames.' },
  // Verification cases for the admin screens and the worker's Verify tab
  { key: 'olivier', name: 'Olivier Mugisha', phone: '+250788100008', region: 'Southern', city: 'Muhanga', skill: 'electrician', years: 3, hue: 160, state: 'open-round', bio: 'Junior electrician, learning fast.' },
  { key: 'grace', name: 'Grace Uwimana', phone: '+250788100009', region: 'Eastern', city: 'Nyagatare', skill: 'plumber', years: 7, hue: 190, state: 'new', bio: '' },
  { key: 'vestine', name: 'Vestine Nyirahabimana', phone: '+250788100010', region: 'Northern', city: 'Gicumbi', skill: 'mason', years: 11, hue: 100, state: 'flagged', bio: 'Mason and tiler.' },
  { key: 'samuel', name: 'Samuel Tuyishime', phone: '+250788100011', region: 'Western', city: 'Rusizi', skill: 'carpenter', years: 9, hue: 70, state: 'failed', bio: 'Carpenter. Furniture and doors.' },
];

const employers = [
  { key: 'inzozi', name: 'Alexis Kamanzi', phone: '+250788200001', company: 'Inzozi Builders', region: 'Kigali', city: 'Gasabo', contact: 'info@inzozi.rw' },
  { key: 'homes', name: 'Marie Uwase', phone: '+250788200002', company: 'Kigali Homes Ltd', region: 'Kigali', city: 'Nyarugenge', contact: 'hello@kigalihomes.rw' },
  { key: 'hotel', name: 'David Mugenzi', phone: '+250788200003', company: 'Ubumwe Hotel', region: 'Kigali', city: 'Kicukiro', contact: 'maintenance@ubumwehotel.rw' },
];

const ALL_PHONES = [...workers, ...employers].map((u) => u.phone);

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);

// ── Pictures: simple generated artwork, so the demo needs no downloads and no real people's photos ──

function hsl(h: number, s: number, l: number): string {
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = l / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * c).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

async function svgToWebp(svg: string): Promise<Buffer> {
  return sharp(Buffer.from(svg)).webp({ quality: 80 }).toBuffer();
}

const avatar = (hue: number) =>
  svgToWebp(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    <rect width="512" height="512" fill="${hsl(hue, 45, 88)}"/>
    <circle cx="256" cy="200" r="92" fill="${hsl(hue, 40, 42)}"/>
    <path d="M90 512 C90 380 186 326 256 326 C326 326 422 380 422 512 Z" fill="${hsl(hue, 40, 42)}"/>
  </svg>`);

// A different little scene per picture: a house, a gate, a panel array.
const work = (hue: number, variant: number) => {
  const bg = `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${hsl(hue, 55, 80)}"/><stop offset="1" stop-color="${hsl(hue, 35, 92)}"/></linearGradient></defs><rect width="800" height="600" fill="url(#g)"/><rect y="470" width="800" height="130" fill="${hsl(hue, 25, 70)}"/>`;
  const dark = hsl(hue, 45, 35);
  const mid = hsl(hue, 40, 55);
  const scenes = [
    `<rect x="220" y="250" width="360" height="220" fill="${mid}"/><path d="M190 255 L400 120 L610 255 Z" fill="${dark}"/><rect x="365" y="340" width="70" height="130" fill="${dark}"/><rect x="260" y="300" width="60" height="60" fill="#fff" opacity=".8"/><rect x="480" y="300" width="60" height="60" fill="#fff" opacity=".8"/>`,
    `<g fill="${dark}">${Array.from({ length: 9 }, (_, i) => `<rect x="${140 + i * 56}" y="230" width="14" height="240"/>`).join('')}<rect x="140" y="250" width="490" height="14"/><rect x="140" y="420" width="490" height="14"/></g>`,
    `<g>${[0, 1, 2].flatMap((r) => [0, 1, 2, 3].map((c) => `<rect x="${170 + c * 130}" y="${190 + r * 90}" width="116" height="76" fill="${dark}" stroke="#fff" stroke-width="4"/>`)).join('')}</g>`,
    `<rect x="150" y="300" width="500" height="170" fill="${mid}"/><rect x="150" y="270" width="500" height="34" fill="${dark}"/><circle cx="260" cy="470" r="34" fill="${dark}"/><circle cx="540" cy="470" r="34" fill="${dark}"/>`,
  ];
  return svgToWebp(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">${bg}${scenes[variant % scenes.length]}</svg>`);
};

// ── Seeding ──

async function removeDemoData() {
  const users = await prisma.user.findMany({ where: { phoneHash: { in: ALL_PHONES.map(hashPhone) } }, select: { id: true } });
  const ids = users.map((u) => u.id);
  if (ids.length === 0) return 0;
  // Photos on disk first, then rows. Jobs and ratings have no cascade, so they go before the users.
  const photos = await prisma.worker.findMany({ where: { userId: { in: ids } }, select: { photoUrl: true, photos: { select: { url: true } } } });
  for (const w of photos) for (const url of [w.photoUrl, ...w.photos.map((p) => p.url)]) if (url) await getStorage().remove(url);
  await prisma.message.deleteMany({ where: { OR: [{ senderId: { in: ids } }, { receiverId: { in: ids } }] } });
  await prisma.rating.deleteMany({ where: { OR: [{ workerId: { in: ids } }, { employerId: { in: ids } }] } });
  await prisma.job.deleteMany({ where: { OR: [{ workerId: { in: ids } }, { employerId: { in: ids } }] } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
  return ids.length;
}

async function main() {
  const reset = process.argv.includes('--reset');
  if (reset) console.log(`Removed ${await removeDemoData()} demo accounts.`);

  const existing = await prisma.user.count({ where: { phoneHash: { in: ALL_PHONES.map(hashPhone) } } });
  if (existing > 0) {
    console.log('Demo data is already there. Use "npm run seed:demo -- --reset" to rebuild it.');
    return;
  }

  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) throw new Error('No admin found. Run "npm run prisma:seed" first.');

  for (const st of skillTypes) await prisma.skillType.upsert({ where: { slug: st.slug }, update: st, create: st });
  const skillId = new Map((await prisma.skillType.findMany()).map((s) => [s.slug, s.id]));

  const user = (phone: string) => ({ phoneHash: hashPhone(phone), phoneEncrypted: encrypt(phone) });
  const id: Record<string, string> = {};

  // Employers
  for (const e of employers) {
    const u = await prisma.user.create({
      data: { role: 'EMPLOYER', ...user(e.phone), name: e.name, language: 'EN', employer: { create: { companyName: e.company, region: e.region, city: e.city, contactInfo: e.contact } } },
    });
    id[e.key] = u.id;
  }

  // Workers, with their pictures, skills and verification history
  for (const w of workers) {
    const hasProfile = w.state !== 'new';
    const photoUrl = hasProfile ? await getStorage().save(await avatar(w.hue), 'profile', 'webp') : null;
    const status = w.state === undefined || w.state === 'flagged' ? 'VERIFIED' : w.state === 'failed' ? 'NOT_VERIFIED' : 'PENDING';

    const u = await prisma.user.create({
      data: {
        role: 'WORKER', ...user(w.phone), name: w.name, language: 'EN',
        worker: {
          create: {
            region: w.region, city: w.city, bio: w.bio || null, photoUrl, shareContact: w.share ?? false,
            skills: { create: { skillTypeId: skillId.get(w.skill)!, isMain: true, yearsOfExperience: w.years, status, flaggedForReview: w.state === 'flagged' } },
          },
        },
      },
      include: { worker: { include: { skills: true } } },
    });
    id[w.key] = u.id;
    const skill = u.worker!.skills[0]!;

    // Portfolio pictures for everyone with a profile
    if (hasProfile) {
      for (let i = 0; i < (w.state === undefined ? 4 : 2); i++) {
        const url = await getStorage().save(await work(w.hue, i), 'portfolio', 'webp');
        await prisma.portfolioPhoto.create({ data: { workerId: u.id, url, uploadedAt: daysAgo(40 - i * 5) } });
      }
    }

    // References and rounds
    const refs = (results: ('CONFIRMED' | 'NOT_CONFIRMED' | 'UNREACHABLE' | 'PENDING')[], roundStatus: 'VERIFIED' | 'NOT_VERIFIED' | 'OPEN', createdDaysAgo: number) =>
      prisma.verificationRound.create({
        data: {
          skillId: skill.id, roundNumber: 1, status: roundStatus, createdAt: daysAgo(createdDaysAgo),
          closedAt: roundStatus === 'OPEN' ? null : daysAgo(createdDaysAgo - 2),
          references: {
            create: results.map((result, i) => ({
              name: ['Mrs. Uwase', 'Mr. Habimana', 'Mr. Nkusi'][i]!,
              relationship: ['Customer', 'Supervisor', 'Customer'][i]!,
              phoneEncrypted: encrypt(`+2507883${String(workers.indexOf(w)).padStart(2, '0')}${i}00`), // made-up numbers: nobody is called
              result,
              ...(result === 'PENDING' ? {} : { recordedById: admin.id, recordedAt: daysAgo(createdDaysAgo - 1) }),
            })),
          },
        },
      });
    if (w.state === undefined || w.state === 'flagged') await refs(['CONFIRMED', 'UNREACHABLE', 'CONFIRMED'], 'VERIFIED', 60);
    if (w.state === 'open-round') await refs(['CONFIRMED', 'PENDING', 'PENDING'], 'OPEN', 3);
    if (w.state === 'failed') await refs(['NOT_CONFIRMED', 'UNREACHABLE', 'PENDING'], 'NOT_VERIFIED', 20);
  }

  // Jobs and ratings. Past, finished and rated work gives the workers their averages.
  const done = async (worker: string, employer: string, stars: number, comment: string | null, days: number) => {
    const job = await prisma.job.create({
      data: { workerId: id[worker]!, employerId: id[employer]!, status: 'COMPLETED', createdAt: daysAgo(days + 3), employerMarkedAt: daysAgo(days + 1), workerConfirmedAt: daysAgo(days) },
    });
    await prisma.rating.create({ data: { jobId: job.id, workerId: id[worker]!, employerId: id[employer]!, stars, comment, createdAt: daysAgo(days - 1 < 0 ? 0 : days - 1) } });
  };
  await done('jean', 'inzozi', 5, 'Fixed all the wiring in one day. Very clean work.', 40);
  await done('jean', 'homes', 4, 'Good work, arrived a little late.', 25);
  await done('jean', 'hotel', 5, 'Honest and careful. We will hire again.', 12);
  await done('claudine', 'homes', 5, 'Found the leak in minutes.', 30);
  await done('claudine', 'hotel', 4, null, 18);
  await done('eric', 'inzozi', 5, 'Beautiful doors, finished on time.', 50);
  await done('eric', 'homes', 5, 'Best carpenter we have worked with.', 35);
  await done('eric', 'hotel', 4, 'Very good, a little expensive.', 20);
  await done('aline', 'homes', 4, 'Solar system works well.', 28);
  await done('patrick', 'hotel', 3, 'Fixed it, but took two visits.', 33);
  await done('patrick', 'inzozi', 4, null, 15);
  await done('emmanuel', 'inzozi', 5, 'Strong walls, neat plaster.', 45);
  await done('emmanuel', 'homes', 5, 'Reliable team leader.', 22);

  const open = (worker: string, employer: string, status: 'IN_PROGRESS' | 'EMPLOYER_MARKED' | 'COMPLETED', days: number) =>
    prisma.job.create({
      data: {
        workerId: id[worker]!, employerId: id[employer]!, status, createdAt: daysAgo(days),
        ...(status !== 'IN_PROGRESS' ? { employerMarkedAt: daysAgo(1) } : {}),
        ...(status === 'COMPLETED' ? { workerConfirmedAt: daysAgo(0) } : {}),
      },
    });
  await open('eric', 'inzozi', 'IN_PROGRESS', 2); // the demo employer's job still running
  await open('claudine', 'inzozi', 'COMPLETED', 6); // confirmed, so Inzozi can rate it
  await open('jean', 'homes', 'EMPLOYER_MARKED', 4); // the demo worker has this one to confirm
  await open('aline', 'inzozi', 'EMPLOYER_MARKED', 5);

  // Every worker's average comes from their ratings.
  for (const w of workers) {
    const agg = await prisma.rating.aggregate({ where: { workerId: id[w.key]! }, _avg: { stars: true }, _count: { _all: true } });
    await prisma.worker.update({ where: { userId: id[w.key]! }, data: { ratingAverage: agg._avg.stars, ratingCount: agg._count._all } });
  }

  // Favorites for the demo employer
  await prisma.favorite.createMany({ data: [{ employerId: id.inzozi!, workerId: id.jean! }, { employerId: id.inzozi!, workerId: id.eric! }] });

  // Messages: Inzozi has one unread reply from Jean; Jean has an unread message from Kigali Homes.
  const say = (from: string, to: string, content: string, hoursAgo: number, read: boolean) =>
    prisma.message.create({ data: { senderId: id[from]!, receiverId: id[to]!, content, sentAt: new Date(Date.now() - hoursAgo * 3_600_000), readAt: read ? new Date(Date.now() - (hoursAgo - 0.1) * 3_600_000) : null } });
  await say('inzozi', 'jean', 'Hello Jean, are you free on Monday for a wiring job in Kimironko?', 30, true);
  await say('jean', 'inzozi', 'Yes, I am free all day Monday. What time should I come?', 29, true);
  await say('inzozi', 'jean', 'Great. 8am please. I will send the exact address.', 28, true);
  await say('jean', 'inzozi', 'Perfect, see you at 8.', 27, false);
  await say('homes', 'jean', 'Hi Jean, can you come and check our new sockets this week?', 5, false);

  const sample = (k: string) => workers.find((w) => w.key === k)!;
  console.log(`
Demo data added. Sign in with these phone numbers (the SMS code appears in the server console):

  Worker    ${sample('jean').phone}  Jean Bosco Niyonzima  verified, 3 reviews, a job to confirm, 2 unread messages
  Employer  ${employers[0]!.phone}  Inzozi Builders       2 favorites, a running job, a worker to rate, 1 unread reply
  Staff     +250780000000  Admin Alice           SMS code + authenticator code (see the first "npm run prisma:seed")

Other cases: ${sample('olivier').name} (verification in progress, shows in the admin queue), ${sample('grace').name} (new profile,
not visible yet), ${sample('vestine').name} (flagged for review), ${sample('samuel').name} (failed verification, can try again).
`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
