import { z } from 'zod';

// FR 6.1: text only, no attachments in the MVP.
export const sendSchema = z.object({
  recipientId: z.string().min(1),
  content: z.string().trim().min(1).max(1000),
});

const cursor = z.coerce.number().int().min(0);

// Threads page by message sequence number: `before` loads older, `after` polls for newer.
export const threadQuerySchema = z
  .object({
    before: cursor.optional(),
    after: cursor.optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
  .refine((q) => q.before === undefined || q.after === undefined, 'USE_BEFORE_OR_AFTER');

export const pageSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
