import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsOptional, IsUUID } from 'class-validator';
import { AdminGuard } from '../common/auth.guards';
import { CreateReviewDto, PublishReviewDto } from './reviews.dto';
import { ReviewsService } from './reviews.service';

class ReviewQuery {
  @IsOptional() @IsUUID() productId?: string;
}

@Controller()
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get('products/:slug/reviews')
  list(@Param('slug') slug: string) {
    return this.reviews.listForProduct(slug);
  }

  // Anyone can review; the limit keeps a single visitor from flooding a product with reviews.
  @Post('products/:slug/reviews')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  create(@Param('slug') slug: string, @Body() dto: CreateReviewDto) {
    return this.reviews.create(slug, dto);
  }

  @Get('admin/reviews')
  @UseGuards(AdminGuard)
  adminList(@Query() query: ReviewQuery) {
    return this.reviews.adminList(query.productId);
  }

  @Patch('admin/reviews/:id')
  @UseGuards(AdminGuard)
  publish(@Param('id', ParseUUIDPipe) id: string, @Body() dto: PublishReviewDto) {
    return this.reviews.setPublished(id, dto.isPublished);
  }

  @Delete('admin/reviews/:id')
  @HttpCode(204)
  @UseGuards(AdminGuard)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.reviews.remove(id);
  }
}
