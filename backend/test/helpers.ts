import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { createApp } from '../src/main';

export interface TestContext {
  app: INestApplication;
  prisma: PrismaClient;
  http: () => ReturnType<typeof request>;
  adminToken: string;
}

export async function startApp(): Promise<TestContext> {
  const app = await createApp();
  await app.init();
  const prisma = new PrismaClient();
  const http = () => request(app.getHttpServer());
  const login = await http()
    .post('/api/v1/auth/admin/login')
    .send({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD })
    .expect(200);
  return { app, prisma, http, adminToken: login.body.accessToken };
}

export async function stopApp(ctx: TestContext) {
  await ctx.prisma.$disconnect();
  await ctx.app.close();
}

let counter = 0;
export const unique = (prefix = 'item') => `${prefix}-${Date.now().toString(36)}-${counter++}`;

const IMAGES = ['https://example.com/a.jpg', 'https://example.com/b.jpg', 'https://example.com/c.jpg'];

/** Creates a published product with the given sizes so each test works with its own stock. */
export async function makeProduct(
  ctx: TestContext,
  overrides: Record<string, unknown> = {},
  variants: { size: string; stock: number }[] = [{ size: 'One Size', stock: 5 }],
) {
  const name = unique('Test Product');
  const res = await ctx
    .http()
    .post('/api/v1/admin/products')
    .set('Authorization', `Bearer ${ctx.adminToken}`)
    .send({ name, price: 1000, images: IMAGES, variants, ...overrides })
    .expect(201);
  return res.body as { id: string; slug: string; variants: { id: string; size: string; stock: number }[] };
}

export const customer = { name: 'Test Buyer', email: 'buyer@example.com', phone: '03001234567', address: '12 Test Street', city: 'Karachi' };

export async function stockOf(ctx: TestContext, variantId: string) {
  return (await ctx.prisma.productVariant.findUniqueOrThrow({ where: { id: variantId } })).stock;
}
