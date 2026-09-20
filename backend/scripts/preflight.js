#!/usr/bin/env node
/**
 * Runs before the API starts (see "start:prod"). It checks the database connection strings for obvious
 * mistakes and stops with a plain message BEFORE trying to log in. That matters because every wrong login
 * counts against Supabase's circuit breaker, which blocks the server for a while when it trips.
 * It never prints the password, only whether it looks usable.
 */
const problems = [];

function check(name, expectedPort) {
  const raw = (process.env[name] || '').trim();
  if (!raw) return problems.push(`${name} is not set.`);

  let url;
  try {
    url = new URL(raw);
  } catch {
    return problems.push(`${name} is not a valid connection string (it must look like postgresql://user:password@host:port/postgres).`);
  }
  if (!/^postgres(ql)?:$/.test(url.protocol)) problems.push(`${name} must start with postgresql://.`);
  if (/[<>[\]]|YOUR|PASSWORD|placeholder/i.test(raw)) problems.push(`${name} still contains placeholder text such as < >, [ ] or YOUR-PASSWORD.`);

  // A "%" that is not part of a valid %XX code cannot be decoded; report it clearly instead of crashing.
  let password = url.password || '';
  try {
    password = decodeURIComponent(password);
  } catch {
    problems.push(`${name} has a "%" in the password that is not written as %25. Special characters in a password must be URL-encoded.`);
  }
  if (!url.password) problems.push(`${name} has no password in it.`);
  else if (/^\.+$/.test(password)) problems.push(`${name} has "${password}" where the password should be. Paste the real connection string, not a shortened copy.`);
  else if (password.length < 6) problems.push(`${name} has a very short password (${password.length} characters). It is probably not the real one.`);

  if (url.hostname.startsWith('db.') && url.hostname.endsWith('.supabase.co')) {
    problems.push(`${name} uses the direct Supabase host (${url.hostname}), which only works over IPv6. Use the pooler host (aws-...pooler.supabase.com).`);
  }
  if (expectedPort && url.port && Number(url.port) !== expectedPort) {
    problems.push(`${name} uses port ${url.port}, expected ${expectedPort}.`);
  }
  if (name === 'DATABASE_URL' && url.hostname.endsWith('pooler.supabase.com') && !/pgbouncer=true/.test(raw)) {
    problems.push('DATABASE_URL should end with ?pgbouncer=true&connection_limit=1 (needed for the Supabase transaction pooler).');
  }

  console.log(`[preflight] ${name}: user=${url.username || '(none)'} host=${url.hostname} port=${url.port || '(default)'} passwordLength=${password.length}`);
}

check('DATABASE_URL', null);
check('DIRECT_URL', null);

if (problems.length) {
  console.error('\n[preflight] The server was NOT started because the database settings look wrong:\n');
  for (const p of problems) console.error(`  - ${p}`);
  console.error('\nFix these variables, then redeploy. No database login was attempted.\n');
  process.exit(1);
}
console.log('[preflight] Database settings look fine.');
