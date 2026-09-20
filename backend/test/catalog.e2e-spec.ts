import { makeProduct, startApp, stopApp, TestContext, unique } from './helpers';

describe('Catalog', () => {
  let ctx: TestContext;
  const auth = () => ({ Authorization: `Bearer ${ctx.adminToken}` });
  const img = ['https://example.com/1.jpg', 'https://example.com/2.jpg', 'https://example.com/3.jpg'];

  beforeAll(async () => (ctx = await startApp()));
  afterAll(() => stopApp(ctx));

  describe('storefront (public)', () => {
    it('lists categories and only active products, with their sizes and stock', async () => {
      const draft = await makeProduct(ctx, { status: 'draft', images: [] });
      const live = await makeProduct(ctx, {}, [{ size: 'Size 5', stock: 2 }, { size: 'Size 6', stock: 0 }]);

      const cats = await ctx.http().get('/api/v1/categories').expect(200);
      expect(cats.body.map((c: { slug: string }) => c.slug)).toContain('rings');

      const list = await ctx.http().get('/api/v1/products').expect(200);
      const ids = list.body.map((p: { id: string }) => p.id);
      expect(ids).toContain(live.id);
      expect(ids).not.toContain(draft.id);
      const found = list.body.find((p: { id: string }) => p.id === live.id);
      expect(found.variants.map((v: { size: string }) => v.size)).toEqual(['Size 5', 'Size 6']); // admin's order is kept
    });

    it('serves one product by slug and hides drafts', async () => {
      const draft = await makeProduct(ctx, { status: 'draft', images: [] });
      const live = await makeProduct(ctx);
      await ctx.http().get(`/api/v1/products/${live.slug}`).expect(200);
      await ctx.http().get(`/api/v1/products/${draft.slug}`).expect(404);
      await ctx.http().get('/api/v1/products/does-not-exist').expect(404);
    });

    it('keeps sold out products visible so the storefront can show them as sold', async () => {
      const sold = await makeProduct(ctx, {}, [{ size: 'One Size', stock: 0 }]);
      const list = await ctx.http().get('/api/v1/products').expect(200);
      expect(list.body.map((p: { id: string }) => p.id)).toContain(sold.id);
    });
  });

  describe('admin products', () => {
    it('requires at least 3 images to publish, but allows drafts without them', async () => {
      const base = { name: unique('Ring'), price: 500, variants: [{ size: 'One Size', stock: 1 }] };
      const two = await ctx.http().post('/api/v1/admin/products').set(auth()).send({ ...base, images: img.slice(0, 2) }).expect(400);
      expect(two.body.message).toMatch(/at least 3 images/);
      await ctx.http().post('/api/v1/admin/products').set(auth()).send({ ...base, name: unique('Ring'), images: [], status: 'draft' }).expect(201);
      await ctx.http().post('/api/v1/admin/products').set(auth()).send({ ...base, name: unique('Ring'), images: img }).expect(201);
    });

    it('rejects unsafe or oversized image lists', async () => {
      const base = { name: unique('Ring'), price: 500, variants: [{ size: 'One Size', stock: 1 }] };
      for (const bad of ['javascript:alert(1)', 'data:image/png;base64,AAAA', '//evil.com/x.jpg', 'ftp://x/y.jpg']) {
        await ctx.http().post('/api/v1/admin/products').set(auth()).send({ ...base, name: unique('R'), images: [...img.slice(0, 2), bad] }).expect(400);
      }
      const nine = Array.from({ length: 9 }, (_, i) => `https://example.com/${i}.jpg`);
      await ctx.http().post('/api/v1/admin/products').set(auth()).send({ ...base, name: unique('R'), images: nine }).expect(400);
    });

    it('validates prices, sizes, slugs and categories', async () => {
      const ok = { price: 500, images: img, variants: [{ size: 'One Size', stock: 1 }] };
      await ctx.http().post('/api/v1/admin/products').set(auth()).send({ ...ok, name: unique('P'), price: -1 }).expect(400);
      await ctx.http().post('/api/v1/admin/products').set(auth()).send({ ...ok, name: unique('P'), compareAtPrice: 400 }).expect(400);
      await ctx.http().post('/api/v1/admin/products').set(auth()).send({ ...ok, name: unique('P'), variants: [] }).expect(400);
      await ctx.http().post('/api/v1/admin/products').set(auth()).send({ ...ok, name: unique('P'), variants: [{ size: 'A', stock: 1 }, { size: 'a', stock: 1 }] }).expect(400);
      await ctx.http().post('/api/v1/admin/products').set(auth()).send({ ...ok, name: unique('P'), variants: [{ size: 'A', stock: -1 }] }).expect(400);
      await ctx.http().post('/api/v1/admin/products').set(auth()).send({ ...ok, name: unique('P'), slug: 'Bad Slug!' }).expect(400);
      await ctx.http().post('/api/v1/admin/products').set(auth()).send({ ...ok, name: unique('P'), categoryId: '11111111-1111-4111-8111-111111111111' }).expect(400);
    });

    it('rejects a duplicate slug with a conflict', async () => {
      const first = await makeProduct(ctx);
      await ctx.http().post('/api/v1/admin/products').set(auth()).send({ name: unique('Other'), slug: first.slug, price: 1, images: img, variants: [{ size: 'S', stock: 1 }] }).expect(409);
    });

    it('updates fields and syncs sizes: keeps, edits, adds, and removes', async () => {
      const p = await makeProduct(ctx, {}, [{ size: 'Small', stock: 1 }, { size: 'Medium', stock: 2 }, { size: 'Large', stock: 3 }]);
      const [small, , large] = p.variants;
      const res = await ctx
        .http()
        .patch(`/api/v1/admin/products/${p.id}`)
        .set(auth())
        .send({
          price: 2500,
          compareAtPrice: 3000,
          featured: true,
          variants: [{ id: large.id, size: 'Large', stock: 9 }, { id: small.id, size: 'Small', stock: 1 }, { size: 'XL', stock: 4 }],
        })
        .expect(200);
      expect(res.body).toMatchObject({ price: 2500, compareAtPrice: 3000, featured: true });
      expect(res.body.variants.map((v: { size: string; stock: number }) => `${v.size}:${v.stock}`)).toEqual(['Large:9', 'Small:1', 'XL:4']);
      const foreign = await makeProduct(ctx);
      await ctx.http().patch(`/api/v1/admin/products/${p.id}`).set(auth()).send({ variants: [{ id: foreign.variants[0].id, size: 'X', stock: 1 }] }).expect(400);
    });

    it('enforces the image rule on update, but lets older placeholder-only products be edited', async () => {
      const draft = await makeProduct(ctx, { status: 'draft', images: [] });
      await ctx.http().patch(`/api/v1/admin/products/${draft.id}`).set(auth()).send({ status: 'active' }).expect(200); // no images at all: allowed (legacy)
      const two = await makeProduct(ctx, { images: img });
      await ctx.http().patch(`/api/v1/admin/products/${two.id}`).set(auth()).send({ images: img.slice(0, 2) }).expect(400);
      await ctx.http().patch(`/api/v1/admin/products/${two.id}`).set(auth()).send({ status: 'draft', images: img.slice(0, 2) }).expect(200);

      const seeded = await ctx.prisma.product.findFirstOrThrow({ where: { slug: 'aurora-solitaire-ring' } });
      await ctx.http().patch(`/api/v1/admin/products/${seeded.id}`).set(auth()).send({ price: seeded.price }).expect(200);
    });

    it('filters and sorts the admin list', async () => {
      const cheap = await makeProduct(ctx, { price: 100, compareAtPrice: 200 }, [{ size: 'S', stock: 0 }]);
      await makeProduct(ctx, { price: 900 }, [{ size: 'S', stock: 7 }]);
      const sold = await ctx.http().get('/api/v1/admin/products?stock=sold').set(auth()).expect(200);
      expect(sold.body.map((p: { id: string }) => p.id)).toContain(cheap.id);
      const sale = await ctx.http().get('/api/v1/admin/products?onSale=true').set(auth()).expect(200);
      expect(sale.body.every((p: { compareAtPrice: number | null }) => p.compareAtPrice !== null)).toBe(true);
      const low = await ctx.http().get('/api/v1/admin/products?sort=priceLow').set(auth()).expect(200);
      const prices = low.body.map((p: { price: number }) => p.price);
      expect(prices).toEqual([...prices].sort((a: number, b: number) => a - b));
      const search = await ctx.http().get(`/api/v1/admin/products?q=${cheap.slug.slice(-6)}`).set(auth()).expect(200);
      expect(search.body.length).toBeGreaterThanOrEqual(1);
      await ctx.http().get('/api/v1/admin/products?status=nonsense').set(auth()).expect(400);
    });

    it('deletes a product without losing the history of orders that contained it', async () => {
      const p = await makeProduct(ctx, {}, [{ size: 'One Size', stock: 3 }]);
      const order = await ctx.http().post('/api/v1/orders').send({
        customer: { name: 'B', email: 'b@example.com', phone: '03001234567', address: 'x', city: 'y' },
        items: [{ variantId: p.variants[0].id, quantity: 1 }],
      }).expect(201);
      await ctx.http().delete(`/api/v1/admin/products/${p.id}`).set(auth()).expect(204);
      const view = await ctx.http().get(`/api/v1/orders/${order.body.id}`).expect(200);
      expect(view.body.items[0]).toMatchObject({ name: expect.any(String), size: 'One Size', productId: null });
    });
  });

  describe('categories', () => {
    it('creates, renames and deletes a category, leaving its products uncategorized', async () => {
      const name = unique('Anklets');
      const cat = await ctx.http().post('/api/v1/admin/categories').set(auth()).send({ name }).expect(201);
      expect(cat.body.slug).toBe(name.toLowerCase());
      await ctx.http().post('/api/v1/admin/categories').set(auth()).send({ name, slug: cat.body.slug }).expect(409);
      await ctx.http().patch(`/api/v1/admin/categories/${cat.body.id}`).set(auth()).send({ description: 'Foot jewellery' }).expect(200);

      const p = await makeProduct(ctx, { categoryId: cat.body.id });
      const counts = await ctx.http().get('/api/v1/admin/categories').set(auth()).expect(200);
      expect(counts.body.find((c: { id: string }) => c.id === cat.body.id).productCount).toBe(1);

      await ctx.http().delete(`/api/v1/admin/categories/${cat.body.id}`).set(auth()).expect(204);
      const after = await ctx.http().get(`/api/v1/products/${p.slug}`).expect(200);
      expect(after.body.categoryId).toBeNull();
    });
  });

  describe('inventory', () => {
    it('reports stock levels with the low-stock threshold, filters, and lets the admin set stock', async () => {
      const p = await makeProduct(ctx, {}, [{ size: 'A', stock: 0 }, { size: 'B', stock: 3 }, { size: 'C', stock: 20 }]);
      const inv = await ctx.http().get(`/api/v1/admin/inventory?q=${p.slug}`).set(auth()).expect(200);
      expect(inv.body.threshold).toBe(5);
      expect(inv.body.rows.map((r: { level: string }) => r.level)).toEqual(['sold', 'low', 'ok']);
      const low = await ctx.http().get(`/api/v1/admin/inventory?q=${p.slug}&filter=low`).set(auth()).expect(200);
      expect(low.body.rows).toHaveLength(1);
      expect(inv.body.summary.units).toBeGreaterThan(0);

      await ctx.http().patch(`/api/v1/admin/variants/${p.variants[0].id}/stock`).set(auth()).send({ stock: 12 }).expect(200);
      await ctx.http().patch(`/api/v1/admin/variants/${p.variants[0].id}/stock`).set(auth()).send({ stock: -1 }).expect(400);
      await ctx.http().patch(`/api/v1/admin/variants/${p.variants[0].id}/stock`).send({ stock: 1 }).expect(401);
    });
  });

  describe('dashboard data', () => {
    it('gives overview, customers, and analytics that leave out cancelled orders', async () => {
      const p = await makeProduct(ctx, { price: 1000 }, [{ size: 'One Size', stock: 20 }]);
      const buyer = { name: 'Analytics Buyer', email: `${unique('an')}@example.com`, phone: '03001234567', address: 'x', city: 'Lahore' };
      const keep = await ctx.http().post('/api/v1/orders').send({ customer: buyer, items: [{ variantId: p.variants[0].id, quantity: 2 }] }).expect(201);
      const drop = await ctx.http().post('/api/v1/orders').send({ customer: buyer, items: [{ variantId: p.variants[0].id, quantity: 1 }] }).expect(201);
      await ctx.http().patch(`/api/v1/admin/orders/${drop.body.id}/status`).set(auth()).send({ status: 'cancelled' }).expect(200);

      const customers = await ctx.http().get(`/api/v1/admin/customers?q=${buyer.email}`).set(auth()).expect(200);
      expect(customers.body).toHaveLength(1);
      expect(customers.body[0]).toMatchObject({ name: 'Analytics Buyer', orderCount: 1, totalSpent: keep.body.total });

      const overview = await ctx.http().get('/api/v1/admin/overview').set(auth()).expect(200);
      expect(overview.body.counts.orders).toBeGreaterThanOrEqual(2);
      expect(overview.body.revenue).toBeGreaterThanOrEqual(keep.body.total);

      const analytics = await ctx.http().get('/api/v1/admin/analytics?range=today').set(auth()).expect(200);
      expect(analytics.body.statusCounts.cancelled).toBeGreaterThanOrEqual(1);
      expect(analytics.body.orders).toBeGreaterThanOrEqual(1);
      expect(analytics.body.revenueByDay.length).toBeGreaterThanOrEqual(1);
      await ctx.http().get('/api/v1/admin/analytics?range=forever').set(auth()).expect(400);
    });
  });
});
