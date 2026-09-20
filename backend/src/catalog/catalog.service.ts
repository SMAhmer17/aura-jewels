import { BadRequestException, Injectable } from '@nestjs/common';
import type { Prisma, Product, ProductVariant } from '@prisma/client';
import { slugify } from '../common/slugify';
import { PrismaService } from '../prisma/prisma.service';
import {
  CategoryDto, CreateProductDto, InventoryQueryDto, MIN_IMAGES, ProductQueryDto,
  UpdateCategoryDto, UpdateProductDto, VariantDto,
} from './catalog.dto';

type ProductWithVariants = Product & { variants: ProductVariant[] };

export function toProduct(p: ProductWithVariants) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    categoryId: p.categoryId,
    images: p.images,
    material: p.material,
    status: p.status,
    featured: p.featured,
    createdAt: p.createdAt,
    variants: [...p.variants].sort((a, b) => a.position - b.position).map((v) => ({ id: v.id, size: v.size, stock: v.stock, sku: v.sku })),
  };
}

const variantOrder = { orderBy: { position: 'asc' as const } };

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------- Categories ----------------
  listCategories() {
    return this.prisma.category.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] });
  }

  async listCategoriesWithCounts() {
    const rows = await this.prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { products: true } } },
    });
    return rows.map(({ _count, ...c }) => ({ ...c, productCount: _count.products }));
  }

  createCategory(dto: CategoryDto) {
    const slug = dto.slug ?? slugify(dto.name);
    if (!slug) throw new BadRequestException('Enter a name with letters or numbers.');
    return this.prisma.category.create({
      data: { name: dto.name.trim(), slug, description: dto.description ?? null, sortOrder: dto.sortOrder ?? 0 },
    });
  }

  updateCategory(id: string, dto: UpdateCategoryDto) {
    return this.prisma.category.update({
      where: { id },
      data: { name: dto.name?.trim(), slug: dto.slug, description: dto.description, sortOrder: dto.sortOrder },
    });
  }

  /** Products in the category are kept and become uncategorized (categoryId null). */
  async deleteCategory(id: string) {
    await this.prisma.category.delete({ where: { id } });
  }

  // ---------------- Public products ----------------
  async listPublicProducts() {
    const rows = await this.prisma.product.findMany({
      where: { status: 'active' },
      include: { variants: variantOrder },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toProduct);
  }

  async getPublicProduct(slug: string) {
    const p = await this.prisma.product.findFirst({ where: { slug, status: 'active' }, include: { variants: variantOrder } });
    if (!p) return null;
    return toProduct(p);
  }

  // ---------------- Admin products ----------------
  async listAdminProducts(query: ProductQueryDto) {
    const settings = await this.prisma.settings.findUnique({ where: { id: 1 } });
    const threshold = settings?.lowStockThreshold ?? 5;

    const where: Prisma.ProductWhereInput = {
      status: query.status,
      categoryId: query.categoryId,
      compareAtPrice: query.onSale ? { not: null } : undefined,
      OR: query.q
        ? [
            { name: { contains: query.q, mode: 'insensitive' } },
            { material: { contains: query.q, mode: 'insensitive' } },
            { variants: { some: { sku: { contains: query.q, mode: 'insensitive' } } } },
          ]
        : undefined,
    };
    let rows = await this.prisma.product.findMany({ where, include: { variants: variantOrder }, orderBy: { createdAt: 'desc' } });

    const total = (p: ProductWithVariants) => p.variants.reduce((s, v) => s + v.stock, 0);
    const soldOut = (p: ProductWithVariants) => p.variants.every((v) => v.stock <= 0);
    if (query.stock === 'sold') rows = rows.filter(soldOut);
    if (query.stock === 'in') rows = rows.filter((p) => !soldOut(p));
    if (query.stock === 'low') rows = rows.filter((p) => !soldOut(p) && p.variants.some((v) => v.stock > 0 && v.stock <= threshold));

    if (query.sort === 'name') rows.sort((a, b) => a.name.localeCompare(b.name));
    if (query.sort === 'priceLow') rows.sort((a, b) => a.price - b.price);
    if (query.sort === 'priceHigh') rows.sort((a, b) => b.price - a.price);
    if (query.sort === 'stockLow') rows.sort((a, b) => total(a) - total(b));
    return rows.map(toProduct);
  }

  async getAdminProduct(id: string) {
    return toProduct(await this.prisma.product.findUniqueOrThrow({ where: { id }, include: { variants: variantOrder } }));
  }

  async createProduct(dto: CreateProductDto) {
    const status = dto.status ?? 'active';
    const images = dto.images ?? [];
    this.assertImages(status, images.length, false);
    this.assertVariants(dto.variants);
    const slug = dto.slug ?? slugify(dto.name);
    if (!slug) throw new BadRequestException('Enter a name with letters or numbers.');
    if (dto.compareAtPrice != null && dto.compareAtPrice <= dto.price) {
      throw new BadRequestException('The original price must be higher than the price.');
    }
    await this.assertCategory(dto.categoryId);

    const p = await this.prisma.product.create({
      data: {
        slug,
        name: dto.name.trim(),
        description: dto.description ?? '',
        price: dto.price,
        compareAtPrice: dto.compareAtPrice ?? null,
        categoryId: dto.categoryId ?? null,
        material: dto.material ?? '',
        images,
        status,
        featured: dto.featured ?? false,
        variants: {
          create: dto.variants.map((v, i) => ({ size: v.size.trim(), stock: v.stock, sku: v.sku ?? this.sku(slug, v.size), position: i })),
        },
      },
      include: { variants: variantOrder },
    });
    return toProduct(p);
  }

  async updateProduct(id: string, dto: UpdateProductDto) {
    const current = await this.prisma.product.findUniqueOrThrow({ where: { id }, include: { variants: true } });

    const status = dto.status ?? current.status;
    const images = dto.images ?? current.images;
    // Older products that still have no images at all can be edited without being blocked.
    const legacyNoImages = current.images.length === 0 && dto.images === undefined;
    this.assertImages(status, images.length, legacyNoImages);

    const price = dto.price ?? current.price;
    const compare = dto.compareAtPrice !== undefined ? dto.compareAtPrice : current.compareAtPrice;
    if (compare != null && compare <= price) throw new BadRequestException('The original price must be higher than the price.');
    if (dto.categoryId !== undefined) await this.assertCategory(dto.categoryId);
    if (dto.variants) this.assertVariants(dto.variants, current.variants.map((v) => v.id));

    const slug = dto.slug ?? current.slug;
    await this.prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: {
          slug: dto.slug,
          name: dto.name?.trim(),
          description: dto.description,
          price: dto.price,
          compareAtPrice: dto.compareAtPrice,
          categoryId: dto.categoryId,
          material: dto.material,
          images: dto.images,
          status: dto.status,
          featured: dto.featured,
        },
      });

      if (dto.variants) {
        const keep = dto.variants.filter((v) => v.id).map((v) => v.id as string);
        await tx.productVariant.deleteMany({ where: { productId: id, id: { notIn: keep } } });
        for (const [position, v] of dto.variants.entries()) {
          if (v.id) {
            await tx.productVariant.update({ where: { id: v.id }, data: { size: v.size.trim(), stock: v.stock, sku: v.sku, position } });
          } else {
            await tx.productVariant.create({
              data: { productId: id, size: v.size.trim(), stock: v.stock, sku: v.sku ?? this.sku(slug, v.size), position },
            });
          }
        }
      }
    });
    return this.getAdminProduct(id);
  }

  async deleteProduct(id: string) {
    await this.prisma.product.delete({ where: { id } });
  }

  async setVariantStock(variantId: string, stock: number) {
    const v = await this.prisma.productVariant.update({ where: { id: variantId }, data: { stock } });
    return { id: v.id, size: v.size, stock: v.stock, sku: v.sku };
  }

  // ---------------- Inventory ----------------
  async inventory(query: InventoryQueryDto) {
    const settings = await this.prisma.settings.findUnique({ where: { id: 1 } });
    const threshold = settings?.lowStockThreshold ?? 5;
    const products = await this.prisma.product.findMany({
      include: { variants: variantOrder, category: { select: { name: true } } },
      orderBy: { name: 'asc' },
    });

    const all = products.flatMap((p) =>
      p.variants.map((v) => ({
        productId: p.id,
        productName: p.name,
        productStatus: p.status,
        category: p.category?.name ?? null,
        variantId: v.id,
        size: v.size,
        sku: v.sku,
        stock: v.stock,
        level: v.stock <= 0 ? ('sold' as const) : v.stock <= threshold ? ('low' as const) : ('ok' as const),
      })),
    );
    const term = query.q?.trim().toLowerCase();
    const rows = all.filter(
      (r) =>
        (!query.filter || r.level === query.filter) &&
        (!term || `${r.productName} ${r.size} ${r.sku}`.toLowerCase().includes(term)),
    );
    return {
      threshold,
      summary: {
        units: all.reduce((s, r) => s + r.stock, 0),
        lowVariants: all.filter((r) => r.level === 'low').length,
        soldVariants: all.filter((r) => r.level === 'sold').length,
        soldProducts: products.filter((p) => p.variants.every((v) => v.stock <= 0)).length,
      },
      rows,
    };
  }

  // ---------------- helpers ----------------
  private sku(slug: string, size: string) {
    return `${slug.toUpperCase()}-${slugify(size).toUpperCase()}`;
  }

  private assertImages(status: string, count: number, legacyNoImages: boolean) {
    if (status === 'active' && count < MIN_IMAGES && !legacyNoImages) {
      throw new BadRequestException(`Add at least ${MIN_IMAGES} images before publishing a product, or save it as a draft.`);
    }
  }

  private assertVariants(variants: VariantDto[], productVariantIds?: string[]) {
    const sizes = variants.map((v) => v.size.trim().toLowerCase());
    if (new Set(sizes).size !== sizes.length) throw new BadRequestException('Each size or option must be unique.');
    if (productVariantIds) {
      for (const v of variants) {
        if (v.id && !productVariantIds.includes(v.id)) throw new BadRequestException('A size does not belong to this product.');
      }
    }
  }

  private async assertCategory(categoryId?: string | null) {
    if (!categoryId) return;
    const exists = await this.prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } });
    if (!exists) throw new BadRequestException('That category does not exist.');
  }
}
