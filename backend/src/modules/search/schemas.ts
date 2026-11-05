import { z } from 'zod';

const text = z.string().trim().min(1).max(80);

// FR 4.1 – 4.3: skill (slug or id), location and minimum rating.
export const searchSchema = z.object({
  skill: text.optional(),
  region: text.optional(),
  city: text.optional(),
  minRating: z.coerce.number().min(1).max(5).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
export type SearchInput = z.infer<typeof searchSchema>;

export const pageSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
