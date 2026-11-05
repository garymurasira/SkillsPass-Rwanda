import { z } from 'zod';
import { normalizePhone } from '../../shared/crypto';

// Rwandan mobile numbers (MTN 078/079, Airtel 072/073) in any common format.
export const phoneSchema = z
  .string()
  .transform(normalizePhone)
  .pipe(z.string().regex(/^\+2507[2389]\d{7}$/, 'INVALID_PHONE'));

const language = z.enum(['RW', 'EN', 'FR']).default('RW');
const place = z.string().trim().min(1).max(80);

const base = { phone: phoneSchema, name: z.string().trim().min(2).max(100), language };

export const registerSchema = z.discriminatedUnion('role', [
  z.object({ role: z.literal('WORKER'), ...base, region: place, city: place }),
  z.object({
    role: z.literal('EMPLOYER'),
    ...base,
    companyName: z.string().trim().min(2).max(120),
    region: place,
    city: place,
    contactInfo: z.string().trim().min(3).max(200),
  }),
]);
export type RegisterInput = z.infer<typeof registerSchema>;

const code = z.string().regex(/^\d{6}$/, 'INVALID_CODE');

export const verifyRegistrationSchema = z.object({ phone: phoneSchema, code });
export const loginSchema = z.object({ phone: phoneSchema });
export const verifyLoginSchema = z.object({ phone: phoneSchema, code, totpCode: z.string().optional() });
export const refreshSchema = z.object({ refreshToken: z.string().min(1) });
export const languageSchema = z.object({ language: z.enum(['RW', 'EN', 'FR']) });
