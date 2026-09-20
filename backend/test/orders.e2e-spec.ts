import { customer, makeProduct, startApp, stockOf, stopApp, TestContext, unique } from './helpers';

describe('Orders', () => {
  let ctx: TestContext;
  const auth = () => ({ Authorization: `Bearer ${ctx.adminToken}` });
  const place = (items: unknown[], extra: Record<string, unknown> = {}) =>
    ctx.http().post('/api/v1/orders').send({ customer, items, ...extra });

  beforeAll(async () => (ctx = await startApp()));
  afterAll(() => stopApp(ctx));

  describe('placing an order', () => {
    it('prices the order from the database, takes stock, and can be viewed by its id', async () => {
      const p = await makeProduct(ctx, { price: 1000 }, [{ size: 'One Size', stock: 5 }]);
      const res = await place([{ variantId: p.variants[0].id, quantity: 2 }]).expect(201);

      expect(res.body.orderNumber).toMatch(/^AJ-\d{4}-\d{4,}$/);
      expect(res.body.total).toBe(2000 + 250); // subtotal plus the flat shipping rate
      expect(await stockOf(ctx, p.variants[0].id)).toBe(3);

      const view = await ctx.http().get(`/api/v1/orders/${res.body.id}`).expect(200);
      expect(view.body).toMatchObject({ status: 'pending', paymentMethod: 'cod', paymentStatus: 'unpaid', subtotal: 2000, shipping: 250 });
      expect(view.body.items[0]).toMatchObject({ name: expect.any(String), price: 1000, quantity: 2 });
      expect(view.body.timeline).toHaveLength(1);
      expect(view.body).not.toHaveProperty('notes');
    });

    it('remembers the cover photo on each order line, even after the product is edited', async () => {
      const cover = 'https://cdn.example.com/cover-photo.jpg';
      const p = await makeProduct(ctx, { images: [cover, 'https://cdn.example.com/2.jpg', 'https://cdn.example.com/3.jpg'] });
      const res = await place([{ variantId: p.variants[0].id, quantity: 1 }]).expect(201);
      expect((await ctx.http().get(`/api/v1/orders/${res.body.id}`).expect(200)).body.items[0].image).toBe(cover);

      // Change the product's photos; the order keeps showing what was actually bought.
      await ctx.http().patch(`/api/v1/admin/products/${p.id}`).set('Authorization', `Bearer ${ctx.adminToken}`)
        .send({ images: ['https://cdn.example.com/new-a.jpg', 'https://cdn.example.com/new-b.jpg', 'https://cdn.example.com/new-c.jpg'] }).expect(200);
      const admin = await ctx.http().get(`/api/v1/admin/orders/${res.body.id}`).set('Authorization', `Bearer ${ctx.adminToken}`).expect(200);
      expect(admin.body.items[0].image).toBe(cover);

      // Deleting the product does not break the order either.
      await ctx.http().delete(`/api/v1/admin/products/${p.id}`).set('Authorization', `Bearer ${ctx.adminToken}`).expect(204);
      const after = await ctx.http().get(`/api/v1/orders/${res.body.id}`).expect(200);
      expect(after.body.items[0]).toMatchObject({ image: cover, productId: null });
    });

    it('rejects a client that tries to send its own prices', async () => {
      const p = await makeProduct(ctx);
      await place([{ variantId: p.variants[0].id, quantity: 1, price: 1 }]).expect(400);
      await ctx.http().post('/api/v1/orders').send({ customer, items: [{ variantId: p.variants[0].id, quantity: 1 }], total: 1 }).expect(400);
    });

    it('gives free shipping at or above the threshold', async () => {
      const p = await makeProduct(ctx, { price: 60000 });
      const res = await place([{ variantId: p.variants[0].id, quantity: 1 }]).expect(201);
      expect(res.body.total).toBe(60000);
    });

    it('adds the gift box fee when asked', async () => {
      const p = await makeProduct(ctx, { price: 1000 });
      const res = await place([{ variantId: p.variants[0].id, quantity: 1 }], { giftBox: true }).expect(201);
      expect(res.body.total).toBe(1000 + 250 + 300);
    });

    it('refuses more than is in stock and leaves stock and orders unchanged', async () => {
      const p = await makeProduct(ctx, {}, [{ size: 'One Size', stock: 3 }]);
      const before = await ctx.prisma.order.count();
      const res = await place([{ variantId: p.variants[0].id, quantity: 4 }]).expect(400);
      expect(res.body.message).toMatch(/only 3 left/);
      expect(await stockOf(ctx, p.variants[0].id)).toBe(3);
      expect(await ctx.prisma.order.count()).toBe(before);
    });

    it('rolls back everything when one line of a multi-item order fails', async () => {
      const a = await makeProduct(ctx, {}, [{ size: 'One Size', stock: 5 }]);
      const b = await makeProduct(ctx, {}, [{ size: 'One Size', stock: 1 }]);
      await place([
        { variantId: a.variants[0].id, quantity: 2 },
        { variantId: b.variants[0].id, quantity: 2 },
      ]).expect(400);
      expect(await stockOf(ctx, a.variants[0].id)).toBe(5);
      expect(await stockOf(ctx, b.variants[0].id)).toBe(1);
    });

    it('never oversells when many people buy the last item at once', async () => {
      const p = await makeProduct(ctx, {}, [{ size: 'One Size', stock: 1 }]);
      const results = await Promise.all(Array.from({ length: 6 }, () => place([{ variantId: p.variants[0].id, quantity: 1 }])));
      const statuses = results.map((r) => r.status).sort();
      expect(statuses.filter((s) => s === 201)).toHaveLength(1);
      expect(statuses.filter((s) => s === 400)).toHaveLength(5);
      expect(await stockOf(ctx, p.variants[0].id)).toBe(0);
    });

    it('does not allow ordering draft or archived products', async () => {
      const p = await makeProduct(ctx, { status: 'draft', images: [] });
      const res = await place([{ variantId: p.variants[0].id, quantity: 1 }]).expect(400);
      expect(res.body.message).toMatch(/no longer available/);
    });

    it('validates the customer details and quantities', async () => {
      const p = await makeProduct(ctx);
      const item = [{ variantId: p.variants[0].id, quantity: 1 }];
      await ctx.http().post('/api/v1/orders').send({ customer: { ...customer, email: 'nope' }, items: item }).expect(400);
      await ctx.http().post('/api/v1/orders').send({ customer: { ...customer, phone: '1' }, items: item }).expect(400);
      await place([]).expect(400);
      await place([{ variantId: p.variants[0].id, quantity: 0 }]).expect(400);
      await place([{ variantId: 'not-a-uuid', quantity: 1 }]).expect(400);
    });

    it('404s for an unknown order id', async () => {
      await ctx.http().get('/api/v1/orders/11111111-1111-4111-8111-111111111111').expect(404);
    });
  });

  describe('discounts', () => {
    const createDiscount = (body: Record<string, unknown>) =>
      ctx.http().post('/api/v1/admin/discounts').set(auth()).send(body).expect(201);

    it('applies a percentage discount and counts its use', async () => {
      const code = unique('PCT').toUpperCase();
      await createDiscount({ code, type: 'percentage', value: 10 });
      const p = await makeProduct(ctx, { price: 2000 });

      const preview = await ctx.http().post('/api/v1/discounts/validate').send({ code, subtotal: 2000 }).expect(200);
      expect(preview.body).toMatchObject({ valid: true, amount: 200 });

      const res = await place([{ variantId: p.variants[0].id, quantity: 1 }], { discountCode: code.toLowerCase() }).expect(201);
      expect(res.body.total).toBe(2000 + 250 - 200);
      expect((await ctx.prisma.discount.findUniqueOrThrow({ where: { code } })).usedCount).toBe(1);
    });

    it('explains why a code cannot be used', async () => {
      const p = await makeProduct(ctx, { price: 1000 });
      const item = [{ variantId: p.variants[0].id, quantity: 1 }];

      const minCode = unique('MIN').toUpperCase();
      await createDiscount({ code: minCode, type: 'fixed', value: 100, minOrderAmount: 5000 });
      expect((await place(item, { discountCode: minCode }).expect(400)).body.message).toMatch(/Spend at least Rs\. 5,000/);

      const expired = unique('OLD').toUpperCase();
      await createDiscount({ code: expired, type: 'fixed', value: 100, startsAt: '2020-01-01', endsAt: '2020-02-01' });
      expect((await place(item, { discountCode: expired }).expect(400)).body.message).toMatch(/expired/);

      const future = unique('SOON').toUpperCase();
      await createDiscount({ code: future, type: 'fixed', value: 100, startsAt: '2999-01-01' });
      expect((await place(item, { discountCode: future }).expect(400)).body.message).toMatch(/not active yet/);

      expect((await place(item, { discountCode: 'NOPE-NOT-REAL' }).expect(400)).body.message).toMatch(/not valid/);
      const check = await ctx.http().post('/api/v1/discounts/validate').send({ code: 'NOPE-NOT-REAL', subtotal: 1000 }).expect(200);
      expect(check.body.valid).toBe(false);
      expect(await stockOf(ctx, p.variants[0].id)).toBe(5); // nothing was taken by the failed attempts
    });

    it('stops working once its usage limit is reached, and a failed order does not use it up', async () => {
      const code = unique('ONCE').toUpperCase();
      await createDiscount({ code, type: 'fixed', value: 100, usageLimit: 1 });
      const p = await makeProduct(ctx, { price: 1000 }, [{ size: 'One Size', stock: 10 }]);
      const item = [{ variantId: p.variants[0].id, quantity: 1 }];

      await place(item, { discountCode: code }).expect(201);
      expect((await place(item, { discountCode: code }).expect(400)).body.message).toMatch(/usage limit/);
      expect(await stockOf(ctx, p.variants[0].id)).toBe(9);
    });

    it('never lets a discount push the total below zero', async () => {
      const code = unique('BIG').toUpperCase();
      await createDiscount({ code, type: 'fixed', value: 100000 });
      const p = await makeProduct(ctx, { price: 500 });
      const res = await place([{ variantId: p.variants[0].id, quantity: 1 }], { discountCode: code }).expect(201);
      expect(res.body.total).toBeGreaterThanOrEqual(0);
    });
  });

  describe('admin order management', () => {
    it('cancelling returns stock, reopening takes it again, and the timeline records each change', async () => {
      const p = await makeProduct(ctx, {}, [{ size: 'One Size', stock: 5 }]);
      const order = await place([{ variantId: p.variants[0].id, quantity: 2 }]).expect(201);
      expect(await stockOf(ctx, p.variants[0].id)).toBe(3);

      await ctx.http().patch(`/api/v1/admin/orders/${order.body.id}/status`).set(auth()).send({ status: 'cancelled' }).expect(200);
      expect(await stockOf(ctx, p.variants[0].id)).toBe(5);

      await ctx.http().patch(`/api/v1/admin/orders/${order.body.id}/status`).set(auth()).send({ status: 'cancelled' }).expect(200);
      expect(await stockOf(ctx, p.variants[0].id)).toBe(5); // repeating does not restock twice

      const reopened = await ctx.http().patch(`/api/v1/admin/orders/${order.body.id}/status`).set(auth()).send({ status: 'processing' }).expect(200);
      expect(await stockOf(ctx, p.variants[0].id)).toBe(3);
      expect(reopened.body.timeline.map((e: { status: string }) => e.status)).toEqual(['pending', 'cancelled', 'processing']);
    });

    it('updates payment status and notes, and shows notes only to the admin', async () => {
      const p = await makeProduct(ctx);
      const order = await place([{ variantId: p.variants[0].id, quantity: 1 }]).expect(201);
      const updated = await ctx.http().patch(`/api/v1/admin/orders/${order.body.id}`).set(auth()).send({ paymentStatus: 'paid', notes: 'Call before delivery' }).expect(200);
      expect(updated.body).toMatchObject({ paymentStatus: 'paid', notes: 'Call before delivery' });
      const publicView = await ctx.http().get(`/api/v1/orders/${order.body.id}`).expect(200);
      expect(publicView.body).not.toHaveProperty('notes');
      await ctx.http().patch(`/api/v1/admin/orders/${order.body.id}`).set(auth()).send({ paymentStatus: 'bogus' }).expect(400);
    });

    it('filters, searches, sorts and paginates orders', async () => {
      const p = await makeProduct(ctx, { price: 1234 }, [{ size: 'One Size', stock: 50 }]);
      const buyer = { ...customer, name: 'Zed Filterable', email: 'zed.filter@example.com' };
      const a = await ctx.http().post('/api/v1/orders').send({ customer: buyer, items: [{ variantId: p.variants[0].id, quantity: 1 }] }).expect(201);
      const b = await ctx.http().post('/api/v1/orders').send({ customer: buyer, items: [{ variantId: p.variants[0].id, quantity: 3 }] }).expect(201);
      await ctx.http().patch(`/api/v1/admin/orders/${b.body.id}/status`).set(auth()).send({ status: 'shipped' }).expect(200);

      const byName = await ctx.http().get('/api/v1/admin/orders?q=zed filterable').set(auth()).expect(200);
      expect(byName.body.total).toBe(2);
      const byNumber = await ctx.http().get(`/api/v1/admin/orders?q=${a.body.orderNumber}`).set(auth()).expect(200);
      expect(byNumber.body.data.map((o: { id: string }) => o.id)).toContain(a.body.id);
      const shipped = await ctx.http().get('/api/v1/admin/orders?q=zed.filter@example.com&status=shipped').set(auth()).expect(200);
      expect(shipped.body.total).toBe(1);
      const highest = await ctx.http().get('/api/v1/admin/orders?q=zed.filter@example.com&sort=highest').set(auth()).expect(200);
      expect(highest.body.data[0].id).toBe(b.body.id);
      const page = await ctx.http().get('/api/v1/admin/orders?q=zed.filter@example.com&pageSize=1&page=2').set(auth()).expect(200);
      expect(page.body).toMatchObject({ total: 2, page: 2, pageSize: 1 });
      expect(page.body.data).toHaveLength(1);
      const today = new Date().toISOString().slice(0, 10);
      await ctx.http().get(`/api/v1/admin/orders?from=${today}&to=${today}`).set(auth()).expect(200);
      await ctx.http().get('/api/v1/admin/orders?from=yesterday').set(auth()).expect(400);

      const summary = await ctx.http().get('/api/v1/admin/orders/summary').set(auth()).expect(200);
      expect(summary.body.all).toBeGreaterThanOrEqual(2);
      expect(summary.body.shipped).toBeGreaterThanOrEqual(1);
    });

    it('requires an admin for every admin order route', async () => {
      const id = '11111111-1111-4111-8111-111111111111';
      await ctx.http().get('/api/v1/admin/orders').expect(401);
      await ctx.http().get('/api/v1/admin/orders/summary').expect(401);
      await ctx.http().patch(`/api/v1/admin/orders/${id}/status`).send({ status: 'shipped' }).expect(401);
    });
  });

  describe('customer accounts (optional)', () => {
    it('links orders to a signed-in customer and keeps guest orders separate', async () => {
      const p = await makeProduct(ctx, {}, [{ size: 'One Size', stock: 10 }]);
      const item = [{ variantId: p.variants[0].id, quantity: 1 }];
      const email = `${unique('cust')}@example.com`;
      const reg = await ctx.http().post('/api/v1/auth/register').send({ name: 'Regular Customer', email, password: 'a-good-password' }).expect(201);
      const other = await ctx.http().post('/api/v1/auth/register').send({ name: 'Someone Else', email: `${unique('other')}@example.com`, password: 'a-good-password' }).expect(201);
      const token = { Authorization: `Bearer ${reg.body.accessToken}` };

      const mine = await ctx.http().post('/api/v1/orders').set(token).send({ customer, items: item }).expect(201);
      await place(item).expect(201); // a guest order

      const list = await ctx.http().get('/api/v1/me/orders').set(token).expect(200);
      expect(list.body.map((o: { id: string }) => o.id)).toEqual([mine.body.id]);
      const theirs = await ctx.http().get('/api/v1/me/orders').set({ Authorization: `Bearer ${other.body.accessToken}` }).expect(200);
      expect(theirs.body).toEqual([]);
      await ctx.http().get('/api/v1/me/orders').expect(401);
    });

    it('guests can order without any account', async () => {
      const p = await makeProduct(ctx);
      await place([{ variantId: p.variants[0].id, quantity: 1 }]).expect(201);
    });
  });
});
