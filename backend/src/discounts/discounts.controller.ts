import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AdminGuard } from '../common/auth.guards';
import { DiscountDto, UpdateDiscountDto, ValidateDiscountDto } from './discounts.dto';
import { DiscountsService } from './discounts.service';

@Controller()
export class DiscountsController {
  constructor(private readonly discounts: DiscountsService) {}

  // Limited so the checkout preview cannot be used to guess codes quickly.
  @Post('discounts/validate')
  @HttpCode(200)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  validate(@Body() dto: ValidateDiscountDto) {
    return this.discounts.validate(dto.code, dto.subtotal);
  }

  @Get('admin/discounts')
  @UseGuards(AdminGuard)
  list() {
    return this.discounts.list();
  }

  @Post('admin/discounts')
  @UseGuards(AdminGuard)
  create(@Body() dto: DiscountDto) {
    return this.discounts.create(dto);
  }

  @Patch('admin/discounts/:id')
  @UseGuards(AdminGuard)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateDiscountDto) {
    return this.discounts.update(id, dto);
  }

  @Delete('admin/discounts/:id')
  @HttpCode(204)
  @UseGuards(AdminGuard)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.discounts.remove(id);
  }
}
