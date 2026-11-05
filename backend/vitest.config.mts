import 'dotenv/config';
import { defineConfig } from 'vitest/config';

// Tests run against a separate database derived from the dev DATABASE_URL (same credentials).
const devUrl = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/skillspass';
const testUrl = devUrl.replace(/\/[^/?]+(\?|$)/, '/skillspass_test$1');

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    globalSetup: ['tests/global-setup.ts'],
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: testUrl,
      JWT_ACCESS_SECRET: 'test-access-secret-test-access-secret',
      JWT_REFRESH_SECRET: 'test-refresh-secret-test-refresh-secret',
      DATA_ENCRYPTION_KEY: '0'.repeat(64),
      PHONE_HASH_KEY: 'test-phone-hash-key',
      UPLOAD_DIR: '.test-uploads',
    },
  },
});
