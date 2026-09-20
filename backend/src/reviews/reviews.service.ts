import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Review } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './reviews.dto';

/** What the storefront may see. The reviewer's email is never included. */
const toReview = (r: Review) => ({
  id: r.id,
  productId: r.productId,
  author: r.author,
  title: r.title,
  rating: r.rating,
  comment: r.comment,
  verifiedBuyer: r.verifiedBuyer,
  createdAt: r.createdAt,
});

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  private async activeProductId(slug: string) {
    const product = await this.prisma.product.findFirst({ where: { slug, status: 'active' }, select: { id: true } });
    if (!product) throw new NotFoundException('Product not found.');
    return product.id;
  }

  async listForProduct(slug: string) {
    const productId = await this.activeProductId(slug);
    const rows = await this.prisma.review.findMany({ where: { productId, isPublished: true }, orderBy: { createdAt: 'desc' } });
    return rows.map(toReview);
  }

  async create(slug: string, dto: CreateReviewDto) {
    const productId = await this.activeProductId(slug);

    const already = await this.prisma.review.findUnique({ where: { productId_email: { productId, email: dto.email } }, select: { id: true } });
    if (already) throw new ConflictException('You have already reviewed this product. Thank you!');

    // "Verified buyer": this email has an order (not cancelled) that includes the product.
    const bought = await this.prisma.order.count({
      where: { email: dto.email, status: { not: 'cancelled' }, items: { some: { productId } } },
    });

    const review = await this.prisma.review.create({
      data: { productId, author: dto.author, email: dto.email, title: dto.title || null, rating: dto.rating, comment: dto.comment, verifiedBuyer: bought > 0 },
    });
    return toReview(review);
  }

  // ---- Admin ----
  async adminList(productId?: string) {
    const rows = await this.prisma.review.findMany({
      where: { productId },
      include: { product: { select: { name: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => ({
      ...toReview(r),
      email: r.email,
      isPublished: r.isPublished,
      productName: r.product.name,
      productSlug: r.product.slug,
    }));
  }

  async setPublished(id: string, isPublished: boolean) {
    return toReview(await this.prisma.review.update({ where: { id }, data: { isPublished } }));
  }

  async remove(id: string) {
    await this.prisma.review.delete({ where: { id } });
  }
}
