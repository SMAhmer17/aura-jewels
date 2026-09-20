import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { makeProduct, startApp, stopApp, TestContext } from './helpers';

// A valid 1x1 PNG.
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

describe('Content, settings, reviews and uploads', () => {
  let ctx: TestContext;
  const auth = () => ({ Authorization: `Bearer ${ctx.adminToken}` });

  beforeAll(async () => (ctx = await startApp()));
  afterAll(() => stopApp(ctx));

  describe('home content', () => {
    it('is public to read and starts with the seeded page', async () => {
      const res = await ctx.http().get('/api/v1/home-content').expect(200);
      expect(res.body.hero.heading).toBeTruthy();
      expect(res.body.sections.map((s: { id: string }) => s.id)).toContain('sold');
    });

    it('saves valid edits and returns them to the storefront', async () => {
      const current = (await ctx.http().get('/api/v1/home-content').expect(200)).body;
      const edited = { ...current, hero: { ...current.hero, heading: 'A new heading' } };
      await ctx.http().put('/api/v1/admin/home-content').set(auth()).send({ content: edited }).expect(200);
      expect((await ctx.http().get('/api/v1/home-content').expect(200)).body.hero.heading).toBe('A new heading');
      await ctx.http().put('/api/v1/admin/home-content').set(auth()).send({ content: current }).expect(200); // restore
    });

    it('refuses links that could run script when clicked, and malformed content', async () => {
      const current = (await ctx.http().get('/api/v1/home-content').expect(200)).body;
      const put = (content: unknown) => ctx.http().put('/api/v1/admin/home-content').set(auth()).send({ content });

      await put({ ...current, hero: { ...current.hero, ctaHref: 'javascript:alert(1)' } }).expect(400);
      await put({ ...current, social: { ...current.social, instagramUrl: 'javascript:alert(1)' } }).expect(400);
      await put({ ...current, social: { ...current.social, posts: [{ id: 'x', caption: 'c', url: 'data:text/html,<script>' }] } }).expect(400);
      await put({ ...current, hero: { ...current.hero, ctaHref: '/shop/rings' } }).expect(200); // site paths are fine
      await put({ ...current, sections: [{ id: 'hero', visible: true }] }).expect(400);
      await put({ ...current, sections: [{ id: 'why', visible: true }, { id: 'why', visible: false }] }).expect(400);
      await put({ hero: 'nope', sections: [] }).expect(400);
      await put({ ...current, hero: current.hero }).expect(200); // restore
    });
  });

  describe('settings', () => {
    it('is public to read, and the admin can update it with checks', async () => {
      const before = (await ctx.http().get('/api/v1/settings').expect(200)).body;
      expect(before).toMatchObject({ shippingFlatRate: expect.any(Number), giftBoxPrice: expect.any(Number) });
      expect(before).not.toHaveProperty('id');

      await ctx.http().put('/api/v1/admin/settings').set(auth()).send({ lowStockThreshold: 9 }).expect(200);
      expect((await ctx.http().get('/api/v1/settings').expect(200)).body.lowStockThreshold).toBe(9);
      await ctx.http().put('/api/v1/admin/settings').set(auth()).send({ shippingFlatRate: -5 }).expect(400);
      await ctx.http().put('/api/v1/admin/settings').set(auth()).send({ supportEmail: 'not-an-email' }).expect(400);
      await ctx.http().put('/api/v1/admin/settings').set(auth()).send({ lowStockThreshold: before.lowStockThreshold }).expect(200); // restore
    });
  });

  describe('reviews', () => {
    it('lets anyone review a product, and the admin hide or delete reviews', async () => {
      const p = await makeProduct(ctx);
      const r = await ctx.http().post(`/api/v1/products/${p.slug}/reviews`).send({ author: 'Happy Customer', rating: 5, comment: 'Lovely piece.' }).expect(201);
      let list = await ctx.http().get(`/api/v1/products/${p.slug}/reviews`).expect(200);
      expect(list.body).toHaveLength(1);
      expect(list.body[0]).not.toHaveProperty('isPublished');

      await ctx.http().patch(`/api/v1/admin/reviews/${r.body.id}`).set(auth()).send({ isPublished: false }).expect(200);
      list = await ctx.http().get(`/api/v1/products/${p.slug}/reviews`).expect(200);
      expect(list.body).toHaveLength(0);
      const admin = await ctx.http().get(`/api/v1/admin/reviews?productId=${p.id}`).set(auth()).expect(200);
      expect(admin.body[0]).toMatchObject({ isPublished: false, productName: expect.any(String) });

      await ctx.http().delete(`/api/v1/admin/reviews/${r.body.id}`).set(auth()).expect(204);
      await ctx.http().patch(`/api/v1/admin/reviews/${r.body.id}`).set(auth()).send({ isPublished: true }).expect(404);
    });

    it('validates reviews and only allows them on live products', async () => {
      const p = await makeProduct(ctx);
      const post = (body: Record<string, unknown>) => ctx.http().post(`/api/v1/products/${p.slug}/reviews`).send(body);
      await post({ author: 'A', rating: 6, comment: 'x' }).expect(400);
      await post({ author: 'A', rating: 0, comment: 'x' }).expect(400);
      await post({ author: '', rating: 5, comment: 'x' }).expect(400);
      await post({ author: 'A', rating: 5, comment: 'x'.repeat(2001) }).expect(400);
      await post({ author: 'A', rating: 5, comment: 'x', isPublished: false }).expect(400);
      await ctx.http().post('/api/v1/products/no-such-product/reviews').send({ author: 'A', rating: 5, comment: 'x' }).expect(404);
    });
  });

  describe('image uploads', () => {
    it('accepts a real image from the admin and serves it back', async () => {
      const res = await ctx.http().post('/api/v1/admin/uploads').set(auth()).attach('file', PNG, { filename: 'tiny.png', contentType: 'image/png' }).expect(201);
      expect(res.body.path).toMatch(/^\/uploads\/[0-9a-f-]{36}\.png$/);
      expect(existsSync(resolve(process.env.UPLOAD_DIR ?? './uploads', res.body.path.replace('/uploads/', '')))).toBe(true);
      const served = await ctx.http().get(res.body.path).expect(200);
      expect(served.headers['content-type']).toMatch(/image\/png/);
    });

    it('rejects files that are not images even when they claim to be', async () => {
      const fake = Buffer.from('<?php echo "hi"; ?>');
      await ctx.http().post('/api/v1/admin/uploads').set(auth()).attach('file', fake, { filename: 'evil.png', contentType: 'image/png' }).expect(400);
      await ctx.http().post('/api/v1/admin/uploads').set(auth()).attach('file', Buffer.from('<svg onload=alert(1)>'), { filename: 'x.svg', contentType: 'image/svg+xml' }).expect(400);
      await ctx.http().post('/api/v1/admin/uploads').set(auth()).expect(400);
    });

    it('rejects files over the size limit and visitors', async () => {
      const big = Buffer.concat([PNG, Buffer.alloc(6 * 1024 * 1024)]);
      await ctx.http().post('/api/v1/admin/uploads').set(auth()).attach('file', big, { filename: 'big.png', contentType: 'image/png' }).expect(413);
      await ctx.http().post('/api/v1/admin/uploads').attach('file', PNG, { filename: 'tiny.png', contentType: 'image/png' }).expect(401);
    });
  });
});
