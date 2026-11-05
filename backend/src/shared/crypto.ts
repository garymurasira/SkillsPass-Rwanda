import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'node:crypto';
import { env } from '../config/env';

const key = Buffer.from(env.DATA_ENCRYPTION_KEY, 'hex');

// AES-256-GCM; output is base64(iv | tag | ciphertext). Used for personal data at rest (NFR 8).
export function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64');
}

export function decrypt(payload: string): string {
  const buf = Buffer.from(payload, 'base64');
  const decipher = createDecipheriv('aes-256-gcm', key, buf.subarray(0, 12));
  decipher.setAuthTag(buf.subarray(12, 28));
  return Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString('utf8');
}

// Deterministic keyed hash so a phone number can be looked up without storing it in plaintext.
export function hashPhone(phone: string): string {
  return createHmac('sha256', env.PHONE_HASH_KEY).update(normalizePhone(phone)).digest('hex');
}

// Rwanda numbers: accept 07XXXXXXXX, 2507XXXXXXXX or +2507XXXXXXXX and store as +2507XXXXXXXX.
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/[^\d]/g, '');
  if (digits.startsWith('250')) return `+${digits}`;
  if (digits.startsWith('0')) return `+250${digits.slice(1)}`;
  return `+250${digits}`;
}
