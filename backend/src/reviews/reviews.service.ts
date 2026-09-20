import { Injectable, NotFoundException } from '@nestjs/common';
import type { Review } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './reviews.dto';

const toReview = (r: Review) => ({
  id: r.id,
  productId: r.productId,
  author: r.author,
  rating: r.rating,
  comment: r.comment,
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
    return toReview(await this.prisma.review.create({ data: { productId, ...dto } }));
  }

  // ---- Admin ----
  async adminList(productId?: string) {
    const rows = await this.prisma.review.findMany({
      where: { productId },
      include: { product: { select: { name: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => ({ ...toReview(r), isPublished: r.isPublished, productName: r.product.name, productSlug: r.product.slug }));
  }

  async setPublished(id: string, isPublished: boolean) {
    return toReview(await this.prisma.review.update({ where: { id }, data: { isPublished } }));
  }

  async remove(id: string) {
    await this.prisma.review.delete({ where: { id } });
  }
}
