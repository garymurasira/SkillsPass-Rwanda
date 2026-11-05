import { prisma } from '../../shared/prisma';
import { AppError } from '../../shared/errors';
import { decrypt } from '../../shared/crypto';

export async function getEmployerProfile(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { employer: true } });
  if (!user?.employer) throw new AppError(404, 'PROFILE_NOT_FOUND');
  const e = user.employer;
  return {
    id: user.id,
    name: user.name,
    phone: decrypt(user.phoneEncrypted),
    pendingPhone: user.pendingPhoneEncrypted ? decrypt(user.pendingPhoneEncrypted) : null,
    language: user.language,
    companyName: e.companyName,
    region: e.region,
    city: e.city,
    contactInfo: e.contactInfo,
  };
}

export async function updateEmployer(
  userId: string,
  input: { name?: string; companyName?: string; region?: string; city?: string; contactInfo?: string },
) {
  const { name, ...employer } = input;
  await prisma.$transaction([
    ...(name ? [prisma.user.update({ where: { id: userId }, data: { name } })] : []),
    prisma.employer.update({ where: { userId }, data: employer }),
  ]);
  return getEmployerProfile(userId);
}
