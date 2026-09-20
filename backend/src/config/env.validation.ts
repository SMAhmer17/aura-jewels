/** Fails fast at startup with a clear message instead of failing later on the first request. */
export function validateEnv(config: Record<string, unknown>) {
  const errors: string[] = [];
  const str = (key: string) => (typeof config[key] === 'string' ? (config[key] as string).trim() : '');

  for (const key of ['DATABASE_URL', 'JWT_SECRET']) {
    if (!str(key)) errors.push(`${key} is required`);
  }
  const isProd = str('NODE_ENV') === 'production';
  if (str('JWT_SECRET') && (str('JWT_SECRET').length < 32 || str('JWT_SECRET') === 'change-me')) {
    if (isProd || str('JWT_SECRET').length < 16) {
      errors.push('JWT_SECRET must be a long random string (at least 32 characters)');
    }
  }
  if (isProd && !str('CORS_ORIGINS')) errors.push('CORS_ORIGINS is required in production');

  // Railway's disk is wiped on every deploy, so production must store images in Supabase Storage.
  const hasSupabase = str('SUPABASE_URL') && (str('SUPABASE_SECRET_KEY') || str('SUPABASE_SERVICE_ROLE_KEY'));
  if (isProd && !hasSupabase && str('STORAGE_DRIVER') !== 'local') {
    errors.push('SUPABASE_URL and SUPABASE_SECRET_KEY are required in production (uploaded images would be lost on redeploy). Set STORAGE_DRIVER=local to override.');
  }
  if (str('SUPABASE_URL') && !/^https:\/\//.test(str('SUPABASE_URL'))) errors.push('SUPABASE_URL must start with https://');

  if (errors.length) throw new Error(`Invalid environment:\n - ${errors.join('\n - ')}`);
  return config;
}
