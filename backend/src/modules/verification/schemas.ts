import { z } from 'zod';
import { phoneSchema } from '../auth/schemas';

const reference = z.object({
  name: z.string().trim().min(2).max(100),
  phone: phoneSchema,
  relationship: z.string().trim().min(2).max(60), // e.g. customer, supervisor
});

// FR 3.1: exactly three references, each reachable on a different number.
export const submitReferencesSchema = z.object({
  references: z
    .array(reference)
    .length(3)
    .refine((refs) => new Set(refs.map((r) => r.phone)).size === refs.length, 'DUPLICATE_REFERENCE_PHONE'),
});

export const recordResultSchema = z.object({
  result: z.enum(['CONFIRMED', 'NOT_CONFIRMED', 'UNREACHABLE']),
});

export const listRoundsSchema = z.object({
  status: z.enum(['OPEN', 'VERIFIED', 'NOT_VERIFIED']).default('OPEN'),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
