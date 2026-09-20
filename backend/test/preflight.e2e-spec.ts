import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const script = resolve(__dirname, '../scripts/preflight.js');
const good = {
  DATABASE_URL: 'postgresql://postgres.abc123:S3cretPassw0rd%25x@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1',
  DIRECT_URL: 'postgresql://postgres.abc123:S3cretPassw0rd%25x@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres',
};

const run = (env: Record<string, string | undefined>) =>
  spawnSync('node', [script], { env: { PATH: process.env.PATH, ...env }, encoding: 'utf8' });

describe('Start-up database settings check', () => {
  it('passes real-looking settings and never prints the password', () => {
    const r = run(good);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('passwordLength=');
    expect(r.stdout + r.stderr).not.toContain('S3cretPassw0rd');
  });

  it.each([
    ['dots instead of a password', { ...good, DIRECT_URL: good.DIRECT_URL.replace(/(abc123:)[^@]+@/, '$1...@') }, /where the password should be/],
    ['a placeholder', { ...good, DATABASE_URL: '<transaction pooler string>?pgbouncer=true' }, /not a valid connection string|placeholder/],
    ['the label text instead of a string', { ...good, DIRECT_URL: 'session pooler (5432)' }, /not a valid connection string/],
    ['a missing variable', { ...good, DIRECT_URL: undefined }, /DIRECT_URL is not set/],
    ['no password', { ...good, DIRECT_URL: 'postgresql://postgres.abc123@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres' }, /no password/],
    ['the IPv6-only direct host', { ...good, DIRECT_URL: 'postgresql://postgres:S3cretPassw0rd@db.abc123.supabase.co:5432/postgres' }, /IPv6/],
    ['a bare percent sign in the password', { ...good, DIRECT_URL: good.DIRECT_URL.replace('%25x', '%Rz') }, /URL-encoded/],
    ['the transaction pooler without pgbouncer', { ...good, DATABASE_URL: good.DATABASE_URL.split('?')[0] }, /pgbouncer=true/],
  ])('stops before any login attempt on %s', (_name, env, message) => {
    const r = run(env as Record<string, string | undefined>);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(message as RegExp);
    expect(r.stderr).toContain('No database login was attempted');
  });
});
