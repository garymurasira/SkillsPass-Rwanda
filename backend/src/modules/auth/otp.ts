import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import type { OtpPurpose, Prisma } from '@prisma/client';
import { env } from '../../config/env';
import { prisma } from '../../shared/prisma';
import { AppError } from '../../shared/errors';
import { hashPhone, normalizePhone } from '../../shared/crypto';
import { getSms } from '../../shared/sms';

const OTP_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

const hashCode = (phoneHash: string, code: string) =>
  createHmac('sha256', env.PHONE_HASH_KEY).update(`${phoneHash}:${code}`).digest('hex');

export async function issueOtp(phone: string, purpose: OtpPurpose, payload?: Prisma.InputJsonValue) {
  const phoneHash = hashPhone(phone);

  const recent = await prisma.otpCode.findFirst({
    where: { phoneHash, createdAt: { gt: new Date(Date.now() - RESEND_COOLDOWN_MS) } },
  });
  if (recent) throw new AppError(429, 'OTP_TOO_SOON');

  const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
  await prisma.otpCode.create({
    data: {
      phoneHash,
      purpose,
      payload,
      codeHash: hashCode(phoneHash, code),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });
  await getSms().send(normalizePhone(phone), `Your SkillsPass code is ${code}. It expires in 5 minutes.`);
}

// Validates and consumes the latest live code. A wrong guess counts against the attempt limit.
export async function consumeOtp(phone: string, purpose: OtpPurpose, code: string) {
  const phoneHash = hashPhone(phone);
  const otp = await prisma.otpCode.findFirst({
    where: { phoneHash, purpose, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });
  if (!otp) throw new AppError(400, 'OTP_INVALID');
  if (otp.attempts >= MAX_ATTEMPTS) throw new AppError(429, 'OTP_LOCKED');

  const expected = Buffer.from(otp.codeHash);
  const given = Buffer.from(hashCode(phoneHash, code));
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    await prisma.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    throw new AppError(400, 'OTP_INVALID');
  }

  // Single-use even under concurrent requests.
  const claimed = await prisma.otpCode.updateMany({
    where: { id: otp.id, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  if (claimed.count === 0) throw new AppError(400, 'OTP_INVALID');

  return otp;
}
