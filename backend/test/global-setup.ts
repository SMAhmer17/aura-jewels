import { execSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { loadTestEnv } from './env';

/** Once per test run: bring the test database up to date, empty it, and load the demo data. */
export default async function globalSetup() {
  const env: Record<string, string | undefined> = { ...process.env, ...loadTestEnv(), NODE_ENV: 'test' };
  execSync('npx prisma migrate deploy', { env, stdio: 'ignore' });

  const prisma = new PrismaClient({ datasources: { db: { url: env.DATABASE_URL as string } } });
  try {
    await prisma.$executeRawUnsafe(
      'TRUNCATE "OrderEvent","OrderItem","Order","Review","ProductVariant","Product","Category","Discount","Customer","AdminUser","HomeContent","Settings" RESTART IDENTITY CASCADE',
    );
  } finally {
    await prisma.$disconnect();
  }
  execSync('npx prisma db seed', { env, stdio: 'ignore' });
}
