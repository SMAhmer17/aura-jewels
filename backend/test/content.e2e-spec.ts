import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { customer, makeProduct, startApp, stopApp, TestContext } from './helpers';

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

      // Post pictures and videos: only web links or files this API uploaded, and the type must be stated.
      const withPost = (post: Record<string, unknown>) => ({ ...current, social: { ...current.social, posts: [{ id: 'x', caption: 'c', url: 'https://instagram.com/p/1', ...post }] } });
      await put(withPost({ mediaUrl: '/uploads/abc.mp4', mediaType: 'video' })).expect(200);
      await put(withPost({ mediaUrl: 'https://cdn.example.com/a.jpg', mediaType: 'image' })).expect(200);
      await put(withPost({ mediaUrl: 'javascript:alert(1)', mediaType: 'image' })).expect(400);
      await put(withPost({ mediaUrl: 'data:text/html,<script>', mediaType: 'image' })).expect(400);
      await put(withPost({ mediaUrl: '/uploads/../secret', mediaType: 'image' })).expect(400);
      await put(withPost({ mediaUrl: '/uploads/abc.mp4' })).expect(400);
      await put(withPost({ mediaUrl: '/uploads/abc.mp4', mediaType: 'audio' })).expect(400);
      await put({ ...current }).expect(200); // restore
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
    const review = (over: Record<string, unknown> = {}) => ({ author: 'Happy Customer', email: 'happy@example.com', rating: 5, comment: 'Lovely piece, beautifully made.', ...over });

    it('lets anyone review a product, and the admin hide or delete reviews', async () => {
      const p = await makeProduct(ctx);
      const r = await ctx.http().post(`/api/v1/products/${p.slug}/reviews`).send(review({ title: 'Beautiful' })).expect(201);
      let list = await ctx.http().get(`/api/v1/products/${p.slug}/reviews`).expect(200);
      expect(list.body).toHaveLength(1);
      expect(list.body[0]).toMatchObject({ author: 'Happy Customer', title: 'Beautiful', rating: 5, verifiedBuyer: false });
      // The reviewer's email and moderation state are never public.
      expect(list.body[0]).not.toHaveProperty('email');
      expect(list.body[0]).not.toHaveProperty('isPublished');
      expect(JSON.stringify(r.body)).not.toContain('happy@example.com');

      await ctx.http().patch(`/api/v1/admin/reviews/${r.body.id}`).set(auth()).send({ isPublished: false }).expect(200);
      list = await ctx.http().get(`/api/v1/products/${p.slug}/reviews`).expect(200);
      expect(list.body).toHaveLength(0);
      const admin = await ctx.http().get(`/api/v1/admin/reviews?productId=${p.id}`).set(auth()).expect(200);
      expect(admin.body[0]).toMatchObject({ isPublished: false, email: 'happy@example.com', productName: expect.any(String) });

      await ctx.http().delete(`/api/v1/admin/reviews/${r.body.id}`).set(auth()).expect(204);
      await ctx.http().patch(`/api/v1/admin/reviews/${r.body.id}`).set(auth()).send({ isPublished: true }).expect(404);
    });

    it('marks real buyers as verified, and only for orders that were not cancelled', async () => {
      const p = await makeProduct(ctx);
      const buyer = { ...customer, email: 'verified-buyer@example.com' };
      const order = await ctx.http().post('/api/v1/orders').send({ customer: buyer, items: [{ variantId: p.variants[0].id, quantity: 1 }] }).expect(201);

      const yes = await ctx.http().post(`/api/v1/products/${p.slug}/reviews`).send(review({ email: 'Verified-Buyer@Example.com' })).expect(201);
      expect(yes.body.verifiedBuyer).toBe(true);
      const no = await ctx.http().post(`/api/v1/products/${p.slug}/reviews`).send(review({ email: 'someone-else@example.com' })).expect(201);
      expect(no.body.verifiedBuyer).toBe(false);

      // A cancelled order does not count.
      const p2 = await makeProduct(ctx);
      const o2 = await ctx.http().post('/api/v1/orders').send({ customer: buyer, items: [{ variantId: p2.variants[0].id, quantity: 1 }] }).expect(201);
      await ctx.http().patch(`/api/v1/admin/orders/${o2.body.id}/status`).set(auth()).send({ status: 'cancelled' }).expect(200);
      const cancelled = await ctx.http().post(`/api/v1/products/${p2.slug}/reviews`).send(review({ email: buyer.email })).expect(201);
      expect(cancelled.body.verifiedBuyer).toBe(false);
      expect(order.body.id).toBeTruthy();
    });

    it('allows one review per email per product', async () => {
      const p = await makeProduct(ctx);
      await ctx.http().post(`/api/v1/products/${p.slug}/reviews`).send(review()).expect(201);
      const again = await ctx.http().post(`/api/v1/products/${p.slug}/reviews`).send(review({ email: 'HAPPY@example.com', comment: 'Trying to review twice.' })).expect(409);
      expect(again.body.message).toMatch(/already reviewed/i);
      const p2 = await makeProduct(ctx);
      await ctx.http().post(`/api/v1/products/${p2.slug}/reviews`).send(review()).expect(201); // a different product is fine
    });

    it('validates reviews and only allows them on live products', async () => {
      const p = await makeProduct(ctx);
      const post = (body: Record<string, unknown>) => ctx.http().post(`/api/v1/products/${p.slug}/reviews`).send(body);
      await post(review({ rating: 6 })).expect(400);
      await post(review({ rating: 0 })).expect(400);
      await post(review({ author: '' })).expect(400);
      await post(review({ email: 'not-an-email' })).expect(400);
      const { email: _email, ...noEmail } = review();
      await post(noEmail).expect(400);
      await post(review({ comment: 'too short' })).expect(400);
      await post(review({ comment: 'x'.repeat(2001) })).expect(400);
      await post(review({ title: 't'.repeat(101) })).expect(400);
      await post(review({ isPublished: false })).expect(400);
      await post(review({ verifiedBuyer: true })).expect(400); // cannot claim to be verified
      await ctx.http().post('/api/v1/products/no-such-product/reviews').send(review()).expect(404);
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

    it('accepts MP4 and WebM videos by content and rejects other files, .mov and visitors', async () => {
      const mp4 = Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from('ftypisom'), Buffer.alloc(64)]);
      const webm = Buffer.concat([Buffer.from([0x1a, 0x45, 0xdf, 0xa3]), Buffer.alloc(64)]);
      const mov = Buffer.concat([Buffer.from([0, 0, 0, 20]), Buffer.from('ftypqt  '), Buffer.alloc(64)]);
      const post = () => ctx.http().post('/api/v1/admin/uploads/video');

      const a = await post().set(auth()).attach('file', mp4, { filename: 'clip.mp4', contentType: 'video/mp4' }).expect(201);
      expect(a.body.path).toMatch(/^\/uploads\/[0-9a-f-]{36}\.mp4$/);
      const served = await ctx.http().get(a.body.path).expect(200);
      expect(served.headers['content-type']).toMatch(/video\/mp4/);
      await post().set(auth()).attach('file', webm, { filename: 'clip.webm', contentType: 'video/webm' }).expect(201);

      await post().set(auth()).attach('file', mov, { filename: 'clip.mov', contentType: 'video/quicktime' }).expect(400);
      await post().set(auth()).attach('file', Buffer.from('<script>alert(1)</script>'.repeat(4)), { filename: 'evil.mp4', contentType: 'video/mp4' }).expect(400);
      await post().set(auth()).attach('file', PNG, { filename: 'image.mp4', contentType: 'video/mp4' }).expect(400);
      await post().set(auth()).expect(400);
      await post().attach('file', mp4, { filename: 'clip.mp4', contentType: 'video/mp4' }).expect(401);
    });

    it('rejects files over the size limit and visitors', async () => {
      const big = Buffer.concat([PNG, Buffer.alloc(6 * 1024 * 1024)]);
      await ctx.http().post('/api/v1/admin/uploads').set(auth()).attach('file', big, { filename: 'big.png', contentType: 'image/png' }).expect(413);
      await ctx.http().post('/api/v1/admin/uploads').attach('file', PNG, { filename: 'tiny.png', contentType: 'image/png' }).expect(401);
    });
  });
});
