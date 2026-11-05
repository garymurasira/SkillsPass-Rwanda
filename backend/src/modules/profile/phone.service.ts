import { Prisma } from '@prisma/client';
import { prisma } from '../../shared/prisma';
import { AppError } from '../../shared/errors';
import { decrypt, encrypt, hashPhone } from '../../shared/crypto';
import { consumeOtp, issueOtp } from '../auth/otp';

// BR 4(d): the new number is parked as "pending" and only replaces the old one once its OTP is confirmed.
export async function requestPhoneChange(userId: string, newPhone: string) {
  const taken = await prisma.user.findUnique({ where: { phoneHash: hashPhone(newPhone) } });
  if (taken) throw new AppError(409, 'PHONE_TAKEN');

  await issueOtp(newPhone, 'PHONE_CHANGE');
  await prisma.user.update({
    where: { id: userId },
    data: { pendingPhoneHash: hashPhone(newPhone), pendingPhoneEncrypted: encrypt(newPhone) },
  });
}

export async function confirmPhoneChange(userId: string, code: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (!user.pendingPhoneEncrypted || !user.pendingPhoneHash) throw new AppError(400, 'NO_PENDING_PHONE');

  const newPhone = decrypt(user.pendingPhoneEncrypted);
  await consumeOtp(newPhone, 'PHONE_CHANGE', code);

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        phoneHash: user.pendingPhoneHash,
        phoneEncrypted: user.pendingPhoneEncrypted,
        pendingPhoneHash: null,
        pendingPhoneEncrypted: null,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw new AppError(409, 'PHONE_TAKEN');
    }
    throw e;
  }
  return { phone: newPhone };
}
