import { z } from 'zod';

export const createJobSchema = z.object({ workerId: z.string().min(1) });

export const ratingSchema = z.object({
  jobId: z.string().min(1),
  stars: z.number().int().min(1).max(5), // FR 5.1
  comment: z
    .string()
    .trim()
    .max(200) // FR 5.2
    .optional()
    .transform((c) => c || null),
});

export const listJobsSchema = z.object({
  status: z.enum(['IN_PROGRESS', 'EMPLOYER_MARKED', 'COMPLETED']).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const pageSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
