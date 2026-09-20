import { BadGatewayException } from '@nestjs/common';
import { validateEnv } from '../src/config/env.validation';
import { StorageService } from '../src/uploads/storage.service';

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const SUPABASE = { SUPABASE_URL: 'https://abc.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'service-key', SUPABASE_STORAGE_BUCKET: 'product-images' };

const respond = (status: number, body = '') => ({ ok: status >= 200 && status < 300, status, text: async () => body }) as Response;

describe('Image storage', () => {
  const realFetch = global.fetch;
  const saved = { ...process.env };
  afterEach(() => {
    global.fetch = realFetch;
    process.env = { ...saved };
  });

  it('uses local disk when Supabase is not configured', async () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.SUPABASE_SECRET_KEY;
    const storage = new StorageService();
    expect(storage.driver).toBe('local');
    const saved = await storage.save(PNG, 'png');
    expect(saved.url).toMatch(/\/uploads\/[0-9a-f-]+\.png$/);
  });

  it('uploads to a public Supabase bucket, creating it once, and returns the CDN link', async () => {
    Object.assign(process.env, SUPABASE);
    const calls: { url: string; method?: string; headers: Record<string, string> }[] = [];
    global.fetch = (async (url: string, init: RequestInit) => {
      calls.push({ url, method: init.method, headers: init.headers as Record<string, string> });
      return respond(200);
    }) as typeof fetch;

    const storage = new StorageService();
    expect(storage.driver).toBe('supabase');
    const first = await storage.save(PNG, 'png');
    await storage.save(PNG, 'jpg');

    expect(first.url).toMatch(/^https:\/\/abc\.supabase\.co\/storage\/v1\/object\/public\/product-images\/[0-9a-f-]+\.png$/);
    // One bucket creation, then one upload per image.
    expect(calls.filter((c) => c.url.endsWith('/storage/v1/bucket'))).toHaveLength(1);
    const uploads = calls.filter((c) => c.url.includes('/storage/v1/object/product-images/'));
    expect(uploads).toHaveLength(2);
    expect(uploads[0].headers.Authorization).toBe('Bearer service-key');
    expect(uploads[0].headers['Content-Type']).toBe('image/png');
    expect(uploads[1].headers['Content-Type']).toBe('image/jpeg');
  });

  it('sends a new-style sb_secret key in the apikey header only, and an old service_role key as a bearer token too', async () => {
    const seen: Record<string, string>[] = [];
    global.fetch = (async (_url: string, init: RequestInit) => {
      seen.push(init.headers as Record<string, string>);
      return respond(200);
    }) as typeof fetch;

    Object.assign(process.env, { SUPABASE_URL: 'https://abc.supabase.co', SUPABASE_SECRET_KEY: 'sb_secret_abc123' });
    const modern = new StorageService();
    expect(modern.driver).toBe('supabase');
    await modern.save(PNG, 'png');
    expect(seen.every((h) => h.apikey === 'sb_secret_abc123' && h.Authorization === undefined)).toBe(true);

    seen.length = 0;
    delete process.env.SUPABASE_SECRET_KEY;
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJlegacy.jwt.key';
    await new StorageService().save(PNG, 'png');
    expect(seen.every((h) => h.apikey === 'eyJlegacy.jwt.key' && h.Authorization === 'Bearer eyJlegacy.jwt.key')).toBe(true);
  });

  it('carries on when the bucket already exists', async () => {
    Object.assign(process.env, SUPABASE);
    global.fetch = (async (url: string) =>
      url.endsWith('/storage/v1/bucket') ? respond(400, '{"error":"Duplicate","message":"The resource already exists"}') : respond(200)) as typeof fetch;
    await expect(new StorageService().save(PNG, 'webp')).resolves.toHaveProperty('url');
  });

  it('shows a friendly error, without leaking Supabase details, when storage fails', async () => {
    Object.assign(process.env, SUPABASE);
    global.fetch = (async () => respond(500, 'secret internal detail')) as typeof fetch;
    const error = await new StorageService().save(PNG, 'png').catch((e) => e);
    expect(error).toBeInstanceOf(BadGatewayException);
    expect(String(error.message)).not.toContain('secret');
  });
});

describe('Production environment checks', () => {
  const base = {
    NODE_ENV: 'production',
    DATABASE_URL: 'postgresql://x',
    JWT_SECRET: 'x'.repeat(40),
    CORS_ORIGINS: 'https://shop.example.com',
  };

  it('refuses to start in production without Supabase Storage (images would vanish on redeploy)', () => {
    expect(() => validateEnv(base)).toThrow(/SUPABASE_URL/);
  });

  it('accepts the secret key under either variable name', () => {
    const { SUPABASE_SERVICE_ROLE_KEY: _legacy, ...urlOnly } = SUPABASE;
    expect(() => validateEnv({ ...base, ...urlOnly, SUPABASE_SECRET_KEY: 'sb_secret_x' })).not.toThrow();
    expect(() => validateEnv({ ...base, ...urlOnly, SUPABASE_SERVICE_ROLE_KEY: 'legacy' })).not.toThrow();
    expect(() => validateEnv({ ...base, ...urlOnly })).toThrow(/SUPABASE_SECRET_KEY/);
  });

  it('starts with Supabase configured, or with local storage explicitly chosen', () => {
    expect(() => validateEnv({ ...base, ...SUPABASE })).not.toThrow();
    expect(() => validateEnv({ ...base, STORAGE_DRIVER: 'local' })).not.toThrow();
  });

  it('does not require Supabase outside production', () => {
    expect(() => validateEnv({ ...base, NODE_ENV: 'development' })).not.toThrow();
  });

  it('rejects a non-https Supabase URL', () => {
    expect(() => validateEnv({ ...base, ...SUPABASE, SUPABASE_URL: 'http://abc.supabase.co' })).toThrow(/https/);
  });
});
