import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** Reads .env.test so tests always run against the separate aura_jewels_test database. */
export function loadTestEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  for (const line of readFileSync(resolve(__dirname, '../.env.test'), 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  if (!env.DATABASE_URL?.includes('aura_jewels_test')) {
    throw new Error('Refusing to run tests: DATABASE_URL in .env.test must point at aura_jewels_test.');
  }
  return env;
}
