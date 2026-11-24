import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import type { Language, OtpPurpose, Prisma } from '@prisma/client';
import { env } from '../../config/env';
import { prisma } from '../../shared/prisma';
import { AppError } from '../../shared/errors';
import { hashPhone, normalizePhone } from '../../shared/crypto';
import { getSms } from '../../shared/sms';
import { otpMessage } from './sms-text';

const OTP_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

const hashCode = (phoneHash: string, code: string) =>
  createHmac('sha256', env.PHONE_HASH_KEY).update(`${phoneHash}:${code}`).digest('hex');

// `language` is the one saved on the person's account (or chosen at sign-up): the SMS is written in it.
export async function issueOtp(phone: string, purpose: OtpPurpose, payload?: Prisma.InputJsonValue, language: Language = 'EN') {
  const phoneHash = hashPhone(phone);

  const recent = await prisma.otpCode.findFirst({
    where: { phoneHash, createdAt: { gt: new Date(Date.now() - RESEND_COOLDOWN_MS) } },
  });
  if (recent) throw new AppError(429, 'OTP_TOO_SOON');

  const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
  const otp = await prisma.otpCode.create({
    data: {
      phoneHash,
      purpose,
      payload,
      codeHash: hashCode(phoneHash, code),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });
  try {
    await getSms().send(normalizePhone(phone), otpMessage(language, code, OTP_TTL_MS / 60_000));
  } catch (err) {
    // The code never reached the user: drop it so the resend cooldown does not block an immediate retry.
    await prisma.otpCode.delete({ where: { id: otp.id } }).catch(() => undefined);
    console.error('SMS send failed:', err instanceof Error ? err.message : 'unknown error');
    throw new AppError(502, 'SMS_SEND_FAILED');
  }
}

// Checks the latest live code without using it up. A wrong guess counts against the attempt limit.
// Use this when something else must also pass before the code is spent (see completeLogin), and
// claimOtp afterwards. Most callers just want consumeOtp.
export async function verifyOtp(phone: string, purpose: OtpPurpose, code: string) {
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
    await recordFailedAttempt(otp.id);
    throw new AppError(400, 'OTP_INVALID');
  }
  return otp;
}

// Counts one wrong try against a code. After MAX_ATTEMPTS the code is locked and a new one is needed.
export async function recordFailedAttempt(otpId: string) {
  await prisma.otpCode.update({ where: { id: otpId }, data: { attempts: { increment: 1 } } });
}

// Uses a verified code up. Single-use even under concurrent requests.
export async function claimOtp(otpId: string) {
  const claimed = await prisma.otpCode.updateMany({
    where: { id: otpId, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  if (claimed.count === 0) throw new AppError(400, 'OTP_INVALID');
}

// Validates and consumes the latest live code.
export async function consumeOtp(phone: string, purpose: OtpPurpose, code: string) {
  const otp = await verifyOtp(phone, purpose, code);
  await claimOtp(otp.id);
  return otp;
}
