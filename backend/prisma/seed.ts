import { prisma } from '../src/shared/prisma';
import { encrypt, hashPhone, normalizePhone } from '../src/shared/crypto';
import { skillTypes } from './skill-types';
import { generateTotpSecret, otpauthUrl } from '../src/shared/totp';


// Development-only admin so the verification workflow can be exercised. Do not seed this in production.
// Set ADMIN_PHONE to seed the admin on a number you control (e.g. for a deployed demo).
const DEV_ADMIN_PHONE = process.env.ADMIN_PHONE ?? '+250780000000';

async function main() {
  for (const st of skillTypes) {
    await prisma.skillType.upsert({ where: { slug: st.slug }, update: st, create: st });
  }

  const phone = normalizePhone(DEV_ADMIN_PHONE);
  await prisma.user.upsert({
    where: { phoneHash: hashPhone(phone) },
    update: {},
    create: {
      role: 'ADMIN',
      phoneHash: hashPhone(phone),
      phoneEncrypted: encrypt(phone),
      name: 'Admin Alice',
      language: 'EN',
      admin: { create: { secondFactorEnabled: false } },
    },
  });

  // Admins must log in with a second factor (NFR 10), so enroll the dev admin once and print the secret.
  const admin = await prisma.admin.findFirstOrThrow({ where: { user: { phoneHash: hashPhone(phone) } } });
  if (!admin.totpSecretEncrypted) {
    const secret = generateTotpSecret();
    await prisma.admin.update({
      where: { userId: admin.userId },
      data: { secondFactorEnabled: true, totpSecretEncrypted: encrypt(secret) },
    });
    console.log(`Dev admin authenticator secret (add to an authenticator app): ${secret}`);
    console.log(otpauthUrl(secret, phone));
  }

  console.log(`Seeded ${skillTypes.length} skill types and dev admin (${phone}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
