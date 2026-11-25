import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  DATA_ENCRYPTION_KEY: z.string().regex(/^[0-9a-fA-F]{64}$/, 'must be 64 hex chars (32 bytes)'),
  PHONE_HASH_KEY: z.string().min(8),
  // Interactive API docs at /api/docs. On by default except in production.
  ENABLE_DOCS: z.enum(['true', 'false']).optional(),
  UPLOAD_DIR: z.string().default('uploads'),
  // "local" keeps photos on disk (development). "s3" uses any S3-compatible bucket (Cloudflare R2, Supabase, AWS S3),
  // needed on hosts whose disk is wiped on restart.
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  S3_ENDPOINT: z.string().url().optional(),
  S3_REGION: z.string().min(1).default('auto'),
  S3_BUCKET: z.string().min(1).optional(),
  S3_ACCESS_KEY_ID: z.string().min(1).optional(),
  S3_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  /** Public base URL of the bucket, e.g. https://pub-xxxx.r2.dev (no trailing slash). Photos are shown from here. */
  S3_PUBLIC_URL: z.string().url().optional(),
  SMS_PROVIDER: z.enum(['console', 'pindo']).default('console'),
  PINDO_API_TOKEN: z.string().min(1).optional(),
  PINDO_SENDER_ID: z.string().min(1).max(11).optional(),
}).superRefine((v, ctx) => {
  if (v.STORAGE_DRIVER === 's3') {
    for (const key of ['S3_ENDPOINT', 'S3_BUCKET', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY', 'S3_PUBLIC_URL'] as const) {
      if (!v[key]) ctx.addIssue({ code: 'custom', path: [key], message: `required when STORAGE_DRIVER=s3` });
    }
  }
  if (v.SMS_PROVIDER !== 'pindo') return;
  for (const key of ['PINDO_API_TOKEN', 'PINDO_SENDER_ID'] as const) {
    if (!v[key]) ctx.addIssue({ code: 'custom', path: [key], message: `required when SMS_PROVIDER=pindo` });
  }
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
