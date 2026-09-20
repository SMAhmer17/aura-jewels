import { startApp, stopApp, TestContext, unique } from './helpers';

describe('Auth and access control', () => {
  let ctx: TestContext;
  beforeAll(async () => (ctx = await startApp()));
  afterAll(() => stopApp(ctx));

  it('reports health', async () => {
    const res = await ctx.http().get('/api/v1/health').expect(200);
    expect(res.body).toEqual({ status: 'ok', database: 'up' });
  });

  it('signs the admin in and rejects wrong credentials without saying which part was wrong', async () => {
    const bad = await ctx.http().post('/api/v1/auth/admin/login').send({ email: process.env.ADMIN_EMAIL, password: 'wrong-password' }).expect(401);
    const unknown = await ctx.http().post('/api/v1/auth/admin/login').send({ email: 'nobody@example.com', password: 'wrong-password' }).expect(401);
    expect(bad.body.message).toBe(unknown.body.message);
    expect(ctx.adminToken).toBeTruthy();
  });

  it('protects every admin route from visitors, bad tokens, and customers', async () => {
    const routes = ['orders', 'products', 'categories', 'discounts', 'reviews', 'inventory', 'overview', 'customers', 'analytics'];
    for (const route of routes) await ctx.http().get(`/api/v1/admin/${route}`).expect(401);
    await ctx.http().get('/api/v1/admin/orders').set('Authorization', 'Bearer not.a.token').expect(401);

    const customer = await ctx.http().post('/api/v1/auth/register').send({ name: 'Cust', email: `${unique('c')}@example.com`, password: 'a-good-password' }).expect(201);
    for (const route of routes) {
      await ctx.http().get(`/api/v1/admin/${route}`).set('Authorization', `Bearer ${customer.body.accessToken}`).expect(403);
    }
    await ctx.http().post('/api/v1/admin/uploads').expect(401);
    await ctx.http().put('/api/v1/admin/settings').send({ shippingFlatRate: 0 }).expect(401);
    await ctx.http().put('/api/v1/admin/home-content').send({ content: {} }).expect(401);
  });

  it('lets an admin token in', async () => {
    await ctx.http().get('/api/v1/admin/overview').set('Authorization', `Bearer ${ctx.adminToken}`).expect(200);
  });

  it('handles customer registration and sign in', async () => {
    const email = `${unique('reg')}@example.com`;
    await ctx.http().post('/api/v1/auth/register').send({ name: 'A', email, password: 'short' }).expect(400);
    await ctx.http().post('/api/v1/auth/register').send({ name: 'A', email: 'not-an-email', password: 'a-good-password' }).expect(400);
    await ctx.http().post('/api/v1/auth/register').send({ name: 'A', email, password: 'a-good-password' }).expect(201);
    await ctx.http().post('/api/v1/auth/register').send({ name: 'A', email: email.toUpperCase(), password: 'a-good-password' }).expect(409);

    const login = await ctx.http().post('/api/v1/auth/login').send({ email, password: 'a-good-password' }).expect(200);
    const me = await ctx.http().get('/api/v1/me').set('Authorization', `Bearer ${login.body.accessToken}`).expect(200);
    expect(me.body).toMatchObject({ name: 'A', email });
    await ctx.http().post('/api/v1/auth/login').send({ email, password: 'wrong-password' }).expect(401);
    // An admin token is not a customer session.
    await ctx.http().get('/api/v1/me').set('Authorization', `Bearer ${ctx.adminToken}`).expect(403);
  });

  it('never returns password hashes', async () => {
    const email = `${unique('hash')}@example.com`;
    const reg = await ctx.http().post('/api/v1/auth/register').send({ name: 'A', email, password: 'a-good-password' }).expect(201);
    expect(JSON.stringify(reg.body)).not.toMatch(/passwordHash|\$2[aby]\$/);
  });

  it('limits repeated sign-in attempts', async () => {
    process.env.THROTTLE_DISABLED = 'false';
    try {
      const statuses: number[] = [];
      for (let i = 0; i < 8; i++) {
        const r = await ctx.http().post('/api/v1/auth/admin/login').send({ email: 'x@example.com', password: 'wrong-password' });
        statuses.push(r.status);
      }
      expect(statuses).toContain(429);
    } finally {
      process.env.THROTTLE_DISABLED = 'true';
    }
  });

  it('rejects unknown fields and oversized bodies', async () => {
    await ctx.http().post('/api/v1/auth/admin/login').send({ email: process.env.ADMIN_EMAIL, password: 'x', isAdmin: true }).expect(400);
    const huge = 'x'.repeat(2 * 1024 * 1024);
    await ctx.http().post('/api/v1/auth/login').send({ email: 'a@b.co', password: huge }).expect(413);
  });
});
