import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import * as seed from "./seed-data.json";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD before seeding.");
  if (password.length < 10) throw new Error("ADMIN_PASSWORD must be at least 10 characters.");

  // The single admin. Re-running the seed updates the password to match ADMIN_PASSWORD.
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.adminUser.deleteMany({ where: { email: { not: email.toLowerCase() } } });
  await prisma.adminUser.upsert({
    where: { email: email.toLowerCase() },
    update: { passwordHash },
    create: { email: email.toLowerCase(), passwordHash },
  });

  // Settings and home content are created once and never overwritten by a re-seed.
  await prisma.settings.upsert({ where: { id: 1 }, update: {}, create: { id: 1, ...seed.settings } });
  await prisma.homeContent.upsert({ where: { id: 1 }, update: {}, create: { id: 1, content: seed.homeContent } });

  if (process.env.SEED_DEMO === "false") {
    console.log("Seeded admin, settings, and home content only (SEED_DEMO=false).");
    return;
  }

  for (const c of seed.categories) {
    await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c });
  }

  for (const p of seed.products) {
    const exists = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (exists) {
      // Keep the size order in step with the seed data on re-runs, without touching anything else.
      for (const [position, v] of p.variants.entries()) {
        await prisma.productVariant.updateMany({ where: { sku: v.sku }, data: { position } });
      }
      continue;
    }
    const category = p.categorySlug ? await prisma.category.findUnique({ where: { slug: p.categorySlug } }) : null;
    await prisma.product.create({
      data: {
        slug: p.slug,
        name: p.name,
        description: p.description,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        material: p.material,
        status: p.status as "active" | "draft" | "archived",
        featured: p.featured,
        categoryId: category?.id ?? null,
        variants: { create: p.variants.map((v, position) => ({ ...v, position })) },
      },
    });
  }

  for (const d of seed.discounts) {
    await prisma.discount.upsert({
      where: { code: d.code },
      update: {},
      create: { ...d, type: d.type as "percentage" | "fixed" },
    });
  }

  if ((await prisma.review.count()) === 0) {
    for (const r of seed.reviews) {
      const product = await prisma.product.findUnique({ where: { slug: r.productSlug } });
      if (!product) continue;
      await prisma.review.create({
        data: { productId: product.id, author: r.author, rating: r.rating, comment: r.comment, createdAt: new Date(r.createdAt) },
      });
    }
  }

  console.log(
    `Seeded demo data: ${await prisma.category.count()} categories, ${await prisma.product.count()} products.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
