import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://postgres:test@localhost:5432/skillspass_test',
      JWT_ACCESS_SECRET: 'test-access-secret-test-access-secret',
      JWT_REFRESH_SECRET: 'test-refresh-secret-test-refresh-secret',
      DATA_ENCRYPTION_KEY: '0'.repeat(64),
      PHONE_HASH_KEY: 'test-phone-hash-key',
    },
  },
});
