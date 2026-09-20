import { BadRequestException, Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { formatOrderNumber } from '../common/order-number';
import { discountAmount, discountError } from '../discounts/discount.rules';
import { PrismaService } from '../prisma/prisma.service';
import { OrderQueryDto, PlaceOrderDto, UpdateOrderDetailsDto } from './orders.dto';

const include = { items: true, events: { orderBy: { createdAt: 'asc' as const } } } satisfies Prisma.OrderInclude;
type OrderFull = Prisma.OrderGetPayload<{ include: typeof include }>;

export function toOrder(o: OrderFull, admin = false) {
  return {
    id: o.id,
    orderNumber: formatOrderNumber(o.orderNo, o.createdAt),
    customerName: o.customerName,
    email: o.email,
    phone: o.phone,
    address: o.address,
    city: o.city,
    items: o.items.map((i) => ({ productId: i.productId, variantId: i.variantId, name: i.name, size: i.size, price: i.price, quantity: i.quantity })),
    subtotal: o.subtotal,
    shipping: o.shipping,
    discountCode: o.discountCode,
    discountAmount: o.discountAmount,
    giftBoxFee: o.giftBoxFee,
    total: o.total,
    status: o.status,
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    timeline: o.events.map((e) => ({ status: e.status, at: e.createdAt })),
    createdAt: o.createdAt,
    ...(admin ? { notes: o.notes } : {}),
  };
}

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async placeOrder(dto: PlaceOrderDto, customerId?: string) {
    return this.prisma.$transaction(async (tx) => {
      const settings = await tx.settings.findUniqueOrThrow({ where: { id: 1 } });

      // Combine duplicate lines, then work in a stable order so two orders can never deadlock.
      const wanted = new Map<string, number>();
      for (const line of dto.items) wanted.set(line.variantId, (wanted.get(line.variantId) ?? 0) + line.quantity);
      const ids = [...wanted.keys()].sort();
      if (ids.some((id) => (wanted.get(id) as number) > 20)) throw new BadRequestException('You can order at most 20 of one item.');

      const variants = await tx.productVariant.findMany({ where: { id: { in: ids } }, include: { product: true } });
      if (variants.length !== ids.length || variants.some((v) => v.product.status !== 'active')) {
        throw new BadRequestException('An item in your cart is no longer available.');
      }

      // Prices always come from the database, never from the request.
      const subtotal = variants.reduce((sum, v) => sum + v.product.price * (wanted.get(v.id) as number), 0);
      const shipping = subtotal >= settings.freeShippingThreshold ? 0 : settings.shippingFlatRate;
      const giftBoxFee = dto.giftBox ? settings.giftBoxPrice : 0;

      let discount = null as Awaited<ReturnType<typeof tx.discount.findUnique>>;
      let discountValue = 0;
      if (dto.discountCode) {
        discount = await tx.discount.findUnique({ where: { code: dto.discountCode.toUpperCase() } });
        const error = discountError(discount, subtotal);
        if (error || !discount) throw new BadRequestException(error ?? 'This code is not valid.');
        discountValue = discountAmount(discount, subtotal);
      }

      // Take the stock. Each decrement only succeeds if enough is left, so concurrent orders cannot oversell.
      for (const id of ids) {
        const qty = wanted.get(id) as number;
        const taken = await tx.productVariant.updateMany({ where: { id, stock: { gte: qty } }, data: { stock: { decrement: qty } } });
        if (taken.count === 0) {
          const v = variants.find((x) => x.id === id)!;
          const fresh = await tx.productVariant.findUnique({ where: { id }, select: { stock: true } });
          throw new BadRequestException(
            !fresh || fresh.stock <= 0 ? `${v.product.name} (${v.size}) has just sold out.` : `${v.product.name} (${v.size}) has only ${fresh.stock} left.`,
          );
        }
      }

      if (discount) {
        if (discount.usageLimit !== null) {
          const used = await tx.discount.updateMany({
            where: { id: discount.id, usedCount: { lt: discount.usageLimit } },
            data: { usedCount: { increment: 1 } },
          });
          if (used.count === 0) throw new BadRequestException('This code has reached its usage limit.');
        } else {
          await tx.discount.update({ where: { id: discount.id }, data: { usedCount: { increment: 1 } } });
        }
      }

      const account = customerId ? await tx.customer.findUnique({ where: { id: customerId }, select: { id: true } }) : null;
      const order = await tx.order.create({
        data: {
          customerId: account?.id ?? null,
          customerName: dto.customer.name,
          email: dto.customer.email.toLowerCase(),
          phone: dto.customer.phone,
          address: dto.customer.address,
          city: dto.customer.city,
          subtotal,
          shipping,
          discountCode: discount?.code ?? null,
          discountAmount: discountValue,
          giftBoxFee,
          total: Math.max(0, subtotal + shipping + giftBoxFee - discountValue),
          items: {
            create: variants.map((v) => ({
              productId: v.productId,
              variantId: v.id,
              name: v.product.name,
              size: v.size,
              price: v.product.price,
              quantity: wanted.get(v.id) as number,
            })),
          },
          events: { create: { status: 'pending' } },
        },
      });
      return { id: order.id, orderNumber: formatOrderNumber(order.orderNo, order.createdAt), total: order.total };
    });
  }

  /** Guests have no login, so the confirmation page uses the order's unguessable id. */
  async getPublic(id: string) {
    const o = await this.prisma.order.findUnique({ where: { id }, include });
    return o ? toOrder(o) : null;
  }

  async listForCustomer(customerId: string) {
    const rows = await this.prisma.order.findMany({ where: { customerId }, include, orderBy: { createdAt: 'desc' } });
    return rows.map((o) => toOrder(o));
  }

  // ---------------- Admin ----------------
  async adminList(q: OrderQueryDto) {
    const page = q.page ?? 1;
    const pageSize = q.pageSize ?? 50;
    const term = q.q?.trim();
    const orderNoMatch = term?.match(/(\d{4,})$/);
    const orderNo = orderNoMatch ? Number(orderNoMatch[1]) - 1000 : null;

    const where: Prisma.OrderWhereInput = {
      status: q.status,
      paymentStatus: q.payment,
      createdAt: {
        gte: q.from ? new Date(`${q.from}T00:00:00+05:00`) : undefined,
        lte: q.to ? new Date(`${q.to}T23:59:59.999+05:00`) : undefined,
      },
      OR: term
        ? [
            { customerName: { contains: term, mode: 'insensitive' } },
            { email: { contains: term, mode: 'insensitive' } },
            { phone: { contains: term } },
            ...(orderNo && orderNo > 0 ? [{ orderNo }] : []),
          ]
        : undefined,
    };
    const orderBy: Prisma.OrderOrderByWithRelationInput =
      q.sort === 'oldest' ? { createdAt: 'asc' } : q.sort === 'highest' ? { total: 'desc' } : q.sort === 'lowest' ? { total: 'asc' } : { createdAt: 'desc' };

    const [rows, total] = await Promise.all([
      this.prisma.order.findMany({ where, include, orderBy, skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.order.count({ where }),
    ]);
    return { data: rows.map((o) => toOrder(o, true)), total, page, pageSize };
  }

  async summary() {
    const groups = await this.prisma.order.groupBy({ by: ['status'], _count: { _all: true } });
    const counts = { all: 0, pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 };
    for (const g of groups) {
      counts[g.status] = g._count._all;
      counts.all += g._count._all;
    }
    return counts;
  }

  async adminGet(id: string) {
    return toOrder(await this.prisma.order.findUniqueOrThrow({ where: { id }, include }), true);
  }

  /** Cancelling returns the items to stock; reopening a cancelled order takes them out again. */
  async updateStatus(id: string, status: OrderFull['status']) {
    await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUniqueOrThrow({ where: { id }, include: { items: true } });
      if (order.status === status) return;

      const perVariant = new Map<string, number>();
      for (const i of order.items) {
        if (i.variantId) perVariant.set(i.variantId, (perVariant.get(i.variantId) ?? 0) + i.quantity);
      }
      const ids = [...perVariant.keys()].sort();

      if (status === 'cancelled') {
        for (const vid of ids) {
          await tx.productVariant.update({ where: { id: vid }, data: { stock: { increment: perVariant.get(vid) as number } } });
        }
      } else if (order.status === 'cancelled') {
        for (const vid of ids) {
          await tx.$executeRaw`UPDATE "ProductVariant" SET "stock" = GREATEST(0, "stock" - ${perVariant.get(vid) as number}) WHERE "id" = ${vid}`;
        }
      }

      await tx.order.update({ where: { id }, data: { status, events: { create: { status } } } });
    });
    return this.adminGet(id);
  }

  async updateDetails(id: string, dto: UpdateOrderDetailsDto) {
    await this.prisma.order.update({ where: { id }, data: { paymentStatus: dto.paymentStatus, notes: dto.notes } });
    return this.adminGet(id);
  }
}
