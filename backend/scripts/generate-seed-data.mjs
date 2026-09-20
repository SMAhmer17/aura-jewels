// Regenerates prisma/seed-data.json from the frontend's mock data, so the API starts with the same
// demo catalog. Run from the backend folder:  node scripts/generate-seed-data.mjs
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const ts = require(path.resolve("../frontend/node_modules/typescript"));
const mock = (file) => path.resolve("../frontend/src/lib/mock-data", file);

function load(file) {
  const source = readFileSync(mock(file), "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: "ES2020" } });
  const module = { exports: {} };
  new Function("exports", "module", "require", outputText)(module.exports, module, require);
  return module.exports;
}

const { seedCategories } = load("categories.ts");
const { seedProducts } = load("products.ts");
const { seedDiscounts } = load("discounts.ts");
const { seedReviews } = load("reviews.ts");
const { defaultHomeContent } = load("home.ts");

const categorySlug = Object.fromEntries(seedCategories.map((c) => [c.id, c.slug]));
const productSlug = Object.fromEntries(seedProducts.map((p) => [p.id, p.slug]));

const data = {
  categories: seedCategories.map((c, i) => ({ name: c.name, slug: c.slug, description: c.description ?? null, sortOrder: i })),
  products: seedProducts.map((p) => ({
    slug: p.slug,
    name: p.name,
    description: p.description,
    price: p.price,
    compareAtPrice: p.compareAtPrice ?? null,
    categorySlug: categorySlug[p.categoryId] ?? null,
    material: p.material,
    status: p.status,
    featured: !!p.featured,
    variants: p.variants.map((v) => ({ size: v.size, stock: v.stock, sku: v.sku })),
  })),
  discounts: seedDiscounts.map((d) => ({
    code: d.code,
    type: d.type,
    value: d.value,
    active: d.active,
    usageLimit: d.usageLimit,
    minOrderAmount: d.minOrderAmount ?? null,
  })),
  reviews: seedReviews.map((r) => ({
    productSlug: productSlug[r.productId],
    author: r.author,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt,
  })),
  homeContent: defaultHomeContent,
  settings: {
    storeName: "Aura Jewels",
    tagline: "By ZAS",
    supportEmail: "contact@jewlsbyzas.com",
    supportPhone: "0311 8706843",
    shippingFlatRate: 250,
    freeShippingThreshold: 50000,
    giftBoxPrice: 300,
    lowStockThreshold: 5,
  },
};

writeFileSync("prisma/seed-data.json", JSON.stringify(data, null, 2) + "\n");
console.log(`Wrote prisma/seed-data.json: ${data.categories.length} categories, ${data.products.length} products, ${data.discounts.length} discounts, ${data.reviews.length} reviews`);
