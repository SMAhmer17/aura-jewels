import { Body, Controller, Get, HttpCode, NotFoundException, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AdminGuard, AuthedRequest, CustomerGuard, OptionalAuthGuard } from '../common/auth.guards';
import { OrderQueryDto, PlaceOrderDto, UpdateOrderDetailsDto, UpdateOrderStatusDto } from './orders.dto';
import { OrdersService } from './orders.service';

@Controller()
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  // Cash on delivery only. Signed-in customers get the order linked to their account; guests are welcome too.
  @Post('orders')
  @HttpCode(201)
  @UseGuards(OptionalAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  place(@Body() dto: PlaceOrderDto, @Req() req: AuthedRequest) {
    return this.orders.placeOrder(dto, req.user?.role === 'customer' ? req.user.sub : undefined);
  }

  // Guests track an order with just its number. Limited so numbers cannot be guessed in bulk.
  @Get('orders/track/:orderNumber')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async track(@Param('orderNumber') orderNumber: string) {
    const order = await this.orders.track(orderNumber);
    if (!order) throw new NotFoundException('We could not find an order with that number. Check it and try again.');
    return order;
  }

  @Get('orders/:id')
  async confirmation(@Param('id', ParseUUIDPipe) id: string) {
    const order = await this.orders.getPublic(id);
    if (!order) throw new NotFoundException('Order not found.');
    return order;
  }

  @Get('me/orders')
  @UseGuards(CustomerGuard)
  mine(@Req() req: AuthedRequest) {
    return this.orders.listForCustomer(req.user!.sub);
  }

  // ---- Admin ----
  @Get('admin/orders')
  @UseGuards(AdminGuard)
  list(@Query() query: OrderQueryDto) {
    return this.orders.adminList(query);
  }

  @Get('admin/orders/summary')
  @UseGuards(AdminGuard)
  summary() {
    return this.orders.summary();
  }

  @Get('admin/orders/:id')
  @UseGuards(AdminGuard)
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.orders.adminGet(id);
  }

  @Patch('admin/orders/:id/status')
  @UseGuards(AdminGuard)
  status(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.orders.updateStatus(id, dto.status);
  }

  @Patch('admin/orders/:id')
  @UseGuards(AdminGuard)
  details(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateOrderDetailsDto) {
    return this.orders.updateDetails(id, dto);
  }
}
