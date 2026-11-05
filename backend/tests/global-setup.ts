import { execSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';

// Creates the skillspass_test database if needed and applies all migrations to it.
export default async function setup() {
  const devUrl = process.env.DATABASE_URL!;
  const testUrl = devUrl.replace(/\/[^/?]+(\?|$)/, '/skillspass_test$1');
  const adminUrl = devUrl.replace(/\/[^/?]+(\?|$)/, '/postgres$1');

  const admin = new PrismaClient({ datasources: { db: { url: adminUrl } } });
  try {
    const rows = await admin.$queryRaw<{ n: number }[]>`SELECT 1 AS n FROM pg_database WHERE datname = 'skillspass_test'`;
    if (rows.length === 0) await admin.$executeRawUnsafe('CREATE DATABASE skillspass_test');
  } finally {
    await admin.$disconnect();
  }

  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: testUrl },
    stdio: 'pipe',
  });
}
