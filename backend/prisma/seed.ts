import { prisma } from '../src/shared/prisma';
import { encrypt, hashPhone, normalizePhone } from '../src/shared/crypto';
import { generateTotpSecret, otpauthUrl } from '../src/shared/totp';

const skillTypes = [
  { slug: 'electrician', nameEn: 'Electrician', nameRw: 'Umukozi w\'amashanyarazi', nameFr: 'Électricien' },
  { slug: 'plumber', nameEn: 'Plumber', nameRw: 'Umukanishi w\'amazi', nameFr: 'Plombier' },
  { slug: 'carpenter', nameEn: 'Carpenter', nameRw: 'Umubaji', nameFr: 'Menuisier' },
  { slug: 'solar-technician', nameEn: 'Solar technician', nameRw: 'Umutekinisiye w\'imirasire y\'izuba', nameFr: 'Technicien solaire' },
  { slug: 'mechanic', nameEn: 'Mechanic', nameRw: 'Umukanishi', nameFr: 'Mécanicien' },
  { slug: 'mason', nameEn: 'Mason', nameRw: 'Umufundi', nameFr: 'Maçon' },
  { slug: 'welder', nameEn: 'Welder', nameRw: 'Umusudira', nameFr: 'Soudeur' },
];

// Development-only admin so the verification workflow can be exercised. Do not seed this in production.
const DEV_ADMIN_PHONE = '+250780000000';

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
