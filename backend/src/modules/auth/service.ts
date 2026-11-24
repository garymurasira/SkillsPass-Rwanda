import { Prisma, type Language } from '@prisma/client';
import { prisma } from '../../shared/prisma';
import { AppError } from '../../shared/errors';
import { decrypt, encrypt, hashPhone } from '../../shared/crypto';
import { verifyTotp } from '../../shared/totp';
import { claimOtp, consumeOtp, issueOtp, recordFailedAttempt, verifyOtp } from './otp';
import { issueTokenPair } from './tokens';
import { registerSchema, type RegisterInput } from './schemas';

export async function startRegistration(input: RegisterInput) {
  const exists = await prisma.user.findUnique({ where: { phoneHash: hashPhone(input.phone) } });
  if (exists) throw new AppError(409, 'PHONE_TAKEN');
  // Nothing is created until the phone number is proven with the OTP.
  await issueOtp(input.phone, 'REGISTER', input, input.language);
}

export async function completeRegistration(phone: string, code: string) {
  const otp = await consumeOtp(phone, 'REGISTER', code);
  const data = registerSchema.parse(otp.payload);

  try {
    const user = await prisma.user.create({
      data: {
        role: data.role,
        phoneHash: hashPhone(data.phone),
        phoneEncrypted: encrypt(data.phone),
        name: data.name,
        language: data.language,
        ...(data.role === 'WORKER'
          ? { worker: { create: { region: data.region, city: data.city } } }
          : {
              employer: {
                create: {
                  companyName: data.companyName,
                  region: data.region,
                  city: data.city,
                  contactInfo: data.contactInfo,
                },
              },
            }),
      },
    });
    return { user: publicUser(user), ...(await issueTokenPair(user.id, user.role)) };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw new AppError(409, 'PHONE_TAKEN');
    }
    throw e;
  }
}

export async function startLogin(phone: string) {
  const user = await prisma.user.findUnique({ where: { phoneHash: hashPhone(phone) } });
  if (!user) throw new AppError(404, 'USER_NOT_FOUND');
  await issueOtp(phone, 'LOGIN', undefined, user.language);
}

export async function completeLogin(phone: string, code: string, totpCode?: string) {
  const user = await prisma.user.findUnique({
    where: { phoneHash: hashPhone(phone) },
    include: { admin: true },
  });
  if (!user) throw new AppError(404, 'USER_NOT_FOUND');

  const otp = await verifyOtp(phone, 'LOGIN', code);

  // NFR 10: admins need a second factor on top of the SMS code. The SMS code is only used up once
  // both pass, so a typo in the authenticator code doesn't cost a new SMS. Each wrong authenticator
  // code still counts as a failed try on the SMS code, so it can't be guessed at: 5 tries, then
  // a new code is needed.
  if (user.role === 'ADMIN') {
    const admin = user.admin;
    if (!admin?.secondFactorEnabled || !admin.totpSecretEncrypted) {
      throw new AppError(403, 'ADMIN_2FA_NOT_ENROLLED');
    }
    if (!totpCode) throw new AppError(401, 'TOTP_REQUIRED');
    if (!verifyTotp(decrypt(admin.totpSecretEncrypted), totpCode)) {
      await recordFailedAttempt(otp.id);
      throw new AppError(401, 'TOTP_INVALID');
    }
  }

  await claimOtp(otp.id);
  return { user: publicUser(user), ...(await issueTokenPair(user.id, user.role)) };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, 'USER_NOT_FOUND');
  return publicUser(user);
}

export async function setLanguage(userId: string, language: Language) {
  const user = await prisma.user.update({ where: { id: userId }, data: { language } });
  return publicUser(user);
}

// Never expose phone hash/ciphertext in API responses (NFR 9).
function publicUser(u: { id: string; role: string; name: string; language: string }) {
  return { id: u.id, role: u.role, name: u.name, language: u.language };
}
