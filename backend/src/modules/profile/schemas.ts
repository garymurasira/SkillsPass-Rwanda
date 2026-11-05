import { z } from 'zod';
import { phoneSchema } from '../auth/schemas';

const place = z.string().trim().min(1).max(80);
const years = z.number().int().min(0).max(60);

export const workerUpdateSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  region: place.optional(),
  city: place.optional(),
  bio: z.string().trim().max(300).nullable().optional(), // FR 2.3
  shareContact: z.boolean().optional(), // BR 5
});

export const mainSkillSchema = z.object({ skillTypeId: z.uuid(), yearsOfExperience: years });
export const otherSkillSchema = z.object({ skillTypeId: z.uuid(), yearsOfExperience: years.default(0) });

export const employerUpdateSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  companyName: z.string().trim().min(2).max(120).optional(),
  region: place.optional(),
  city: place.optional(),
  contactInfo: z.string().trim().min(3).max(200).optional(),
});

export const phoneChangeSchema = z.object({ phone: phoneSchema });
export const phoneConfirmSchema = z.object({ code: z.string().regex(/^\d{6}$/, 'INVALID_CODE') });
