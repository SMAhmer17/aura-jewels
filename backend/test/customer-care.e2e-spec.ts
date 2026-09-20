import { customer, makeProduct, startApp, stopApp, TestContext } from './helpers';

describe('Order tracking and contact messages', () => {
  let ctx: TestContext;
  const auth = () => ({ Authorization: `Bearer ${ctx.adminToken}` });

  beforeAll(async () => (ctx = await startApp()));
  afterAll(() => stopApp(ctx));

  describe('tracking an order by its number', () => {
    it('shows status and items to anyone with the order number, but no personal details', async () => {
      const p = await makeProduct(ctx, { price: 1500 }, [{ size: 'M', stock: 5 }]);
      const placed = await ctx.http().post('/api/v1/orders').send({ customer, items: [{ variantId: p.variants[0].id, quantity: 2 }] }).expect(201);

      const res = await ctx.http().get(`/api/v1/orders/track/${placed.body.orderNumber}`).expect(200);
      expect(res.body).toMatchObject({
        orderNumber: placed.body.orderNumber,
        status: 'pending',
        paymentMethod: 'cod',
        subtotal: 3000,
        items: [{ size: 'M', quantity: 2, price: 1500 }],
      });
      expect(res.body.timeline).toHaveLength(1);

      // Order numbers are sequential, so none of the customer's details may ever be exposed here.
      const text = JSON.stringify(res.body);
      for (const secret of [customer.name, customer.email, customer.phone, customer.address]) expect(text).not.toContain(secret);
      expect(res.body).not.toHaveProperty('id');
      expect(res.body).not.toHaveProperty('email');
      expect(res.body).not.toHaveProperty('notes');
    });

    it('follows the order as the admin moves it along', async () => {
      const p = await makeProduct(ctx);
      const placed = await ctx.http().post('/api/v1/orders').send({ customer, items: [{ variantId: p.variants[0].id, quantity: 1 }] }).expect(201);
      const orderId = placed.body.id;
      for (const status of ['processing', 'shipped']) {
        await ctx.http().patch(`/api/v1/admin/orders/${orderId}/status`).set(auth()).send({ status }).expect(200);
      }
      const res = await ctx.http().get(`/api/v1/orders/track/${placed.body.orderNumber}`).expect(200);
      expect(res.body.status).toBe('shipped');
      expect(res.body.timeline.map((e: { status: string }) => e.status)).toEqual(['pending', 'processing', 'shipped']);
    });

    it('accepts lower case and spaces around the number, and gives one clear answer for anything unknown', async () => {
      const p = await makeProduct(ctx);
      const placed = await ctx.http().post('/api/v1/orders').send({ customer, items: [{ variantId: p.variants[0].id, quantity: 1 }] }).expect(201);
      await ctx.http().get(`/api/v1/orders/track/${encodeURIComponent(' ' + placed.body.orderNumber.toLowerCase() + ' ')}`).expect(200);

      const year = new Date().getFullYear();
      for (const bad of ['AJ-2026-999999', `AJ-${year - 1}-${placed.body.orderNumber.split('-')[2]}`, 'AJ-2026-1', 'hello', 'AJ-2026-abc', '1001', 'AJ-0000-0000']) {
        const r = await ctx.http().get(`/api/v1/orders/track/${encodeURIComponent(bad)}`).expect(404);
        expect(r.body.message).toMatch(/could not find an order/i);
      }
    });
  });

  describe('contact messages', () => {
    const message = (over: Record<string, unknown> = {}) => ({ name: 'Ayesha Khan', email: 'Ayesha@Example.com', phone: '03001234567', message: 'Where is my order? It was due yesterday.', ...over });

    it('saves a message from anyone, and the admin can read, filter, resolve and delete it', async () => {
      await ctx.http().post('/api/v1/contact').send(message({ orderNumber: 'aj-2026-1001' })).expect(201);

      const list = await ctx.http().get('/api/v1/admin/messages?status=unread').set(auth()).expect(200);
      const saved = list.body.find((m: { name: string }) => m.name === 'Ayesha Khan');
      expect(saved).toMatchObject({ email: 'ayesha@example.com', phone: '03001234567', orderNumber: 'AJ-2026-1001', status: 'unread' });

      const found = await ctx.http().get('/api/v1/admin/messages?q=due%20yesterday').set(auth()).expect(200);
      expect(found.body.some((m: { id: string }) => m.id === saved.id)).toBe(true);

      await ctx.http().patch(`/api/v1/admin/messages/${saved.id}`).set(auth()).send({ status: 'resolved' }).expect(200);
      const resolved = await ctx.http().get('/api/v1/admin/messages?status=resolved').set(auth()).expect(200);
      expect(resolved.body.some((m: { id: string }) => m.id === saved.id)).toBe(true);
      const unread = await ctx.http().get('/api/v1/admin/messages?status=unread').set(auth()).expect(200);
      expect(unread.body.some((m: { id: string }) => m.id === saved.id)).toBe(false);

      await ctx.http().patch(`/api/v1/admin/messages/${saved.id}`).set(auth()).send({ status: 'nonsense' }).expect(400);
      await ctx.http().delete(`/api/v1/admin/messages/${saved.id}`).set(auth()).expect(204);
      await ctx.http().delete(`/api/v1/admin/messages/${saved.id}`).set(auth()).expect(404);
    });

    it('validates what customers send', async () => {
      const post = (body: Record<string, unknown>) => ctx.http().post('/api/v1/contact').send(body);
      await post(message({ name: '' })).expect(400);
      await post(message({ email: 'nope' })).expect(400);
      await post(message({ message: 'short' })).expect(400);
      await post(message({ message: 'x'.repeat(2001) })).expect(400);
      await post(message({ phone: '123' })).expect(400);
      await post(message({ orderNumber: 'ORDER-5' })).expect(400);
      await post(message({ status: 'resolved' })).expect(400); // cannot set its own status
      await post(message({ phone: undefined, orderNumber: undefined })).expect(201); // both are optional
    });

    it('quietly ignores bots that fill in the hidden field', async () => {
      const before = (await ctx.http().get('/api/v1/admin/messages').set(auth()).expect(200)).body.length;
      await ctx.http().post('/api/v1/contact').send(message({ website: 'http://spam.example.com' })).expect(201);
      const after = (await ctx.http().get('/api/v1/admin/messages').set(auth()).expect(200)).body.length;
      expect(after).toBe(before);
    });

    it('keeps the inbox private to the admin', async () => {
      await ctx.http().get('/api/v1/admin/messages').expect(401);
      const customerLogin = await ctx.http().post('/api/v1/auth/register').send({ name: 'Nosy', email: 'nosy@example.com', password: 'longenough1' }).expect(201);
      await ctx.http().get('/api/v1/admin/messages').set({ Authorization: `Bearer ${customerLogin.body.accessToken}` }).expect(403);
    });
  });
});
