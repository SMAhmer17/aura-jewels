import { Injectable } from '@nestjs/common';
import { formatOrderNumber } from '../common/order-number';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsQueryDto, CustomersQueryDto } from './admin.dto';

const karachiDay = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi' }).format(d);

function rangeStart(range: AnalyticsQueryDto['range']): Date | undefined {
  const now = new Date();
  if (range === 'today') return new Date(`${karachiDay(now)}T00:00:00+05:00`);
  if (range === '7d') return new Date(now.getTime() - 7 * 86_400_000);
  if (range === '30d') return new Date(now.getTime() - 30 * 86_400_000);
  return undefined;
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /** Everything the dashboard overview needs in one call. Cancelled orders are not counted as sales. */
  async overview() {
    const settings = await this.prisma.settings.findUniqueOrThrow({ where: { id: 1 } });
    const [products, categories, orders, revenue, variants, pending] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.category.count(),
      this.prisma.order.count(),
      this.prisma.order.aggregate({ where: { status: { not: 'cancelled' } }, _sum: { total: true } }),
      this.prisma.productVariant.findMany({ include: { product: { select: { id: true, name: true } } } }),
      this.prisma.order.findMany({ where: { status: 'pending' }, orderBy: { createdAt: 'desc' }, take: 5 }),
    ]);

    const byProduct = new Map<string, number>();
    for (const v of variants) byProduct.set(v.productId, (byProduct.get(v.productId) ?? 0) + v.stock);
    return {
      counts: { products, categories, orders },
      revenue: revenue._sum.total ?? 0,
      lowStockThreshold: settings.lowStockThreshold,
      lowStock: variants
        .filter((v) => v.stock > 0 && v.stock <= settings.lowStockThreshold)
        .slice(0, 5)
        .map((v) => ({ productId: v.productId, productName: v.product.name, size: v.size, stock: v.stock })),
      soldOutProducts: [...byProduct.values()].filter((total) => total <= 0).length,
      pendingOrders: pending.map((o) => ({
        id: o.id,
        orderNumber: formatOrderNumber(o.orderNo, o.createdAt),
        customerName: o.customerName,
        total: o.total,
      })),
    };
  }

  /** Customers are built from order history (guests included), grouped by email. Cancelled orders do not count. */
  async customers(q: CustomersQueryDto) {
    const [groups, latest] = await Promise.all([
      this.prisma.order.groupBy({
        by: ['email'],
        where: { status: { not: 'cancelled' } },
        _count: { _all: true },
        _sum: { total: true },
        _max: { createdAt: true },
      }),
      this.prisma.order.findMany({
        where: { status: { not: 'cancelled' } },
        distinct: ['email'],
        orderBy: { createdAt: 'desc' },
        select: { email: true, customerName: true, phone: true, city: true },
      }),
    ]);
    const info = new Map(latest.map((o) => [o.email, o]));

    let rows = groups.map((g) => ({
      email: g.email,
      name: info.get(g.email)?.customerName ?? '',
      phone: info.get(g.email)?.phone ?? '',
      city: info.get(g.email)?.city ?? '',
      orderCount: g._count._all,
      totalSpent: g._sum.total ?? 0,
      lastOrderAt: g._max.createdAt as Date,
    }));

    const term = q.q?.trim().toLowerCase();
    if (term) rows = rows.filter((c) => `${c.name} ${c.email} ${c.phone} ${c.city}`.toLowerCase().includes(term));
    if (q.repeatOnly) rows = rows.filter((c) => c.orderCount >= 2);
    rows.sort((a, b) =>
      q.sort === 'orders' ? b.orderCount - a.orderCount
      : q.sort === 'recent' ? b.lastOrderAt.getTime() - a.lastOrderAt.getTime()
      : q.sort === 'name' ? a.name.localeCompare(b.name)
      : b.totalSpent - a.totalSpent,
    );
    return rows;
  }

  async analytics(q: AnalyticsQueryDto) {
    const from = rangeStart(q.range);
    const inRange = await this.prisma.order.findMany({
      where: { createdAt: from ? { gte: from } : undefined },
      include: { items: true },
    });
    const sales = inRange.filter((o) => o.status !== 'cancelled');

    const byDay = new Map<string, number>();
    for (const o of sales) byDay.set(karachiDay(o.createdAt), (byDay.get(karachiDay(o.createdAt)) ?? 0) + o.total);

    const byProduct = new Map<string, number>();
    for (const o of sales) for (const i of o.items) byProduct.set(i.name, (byProduct.get(i.name) ?? 0) + i.quantity);

    const statusCounts = { pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 };
    for (const o of inRange) statusCounts[o.status] += 1;

    const revenue = sales.reduce((s, o) => s + o.total, 0);
    return {
      revenue,
      orders: sales.length,
      averageOrderValue: sales.length ? Math.round(revenue / sales.length) : 0,
      productsSold: sales.reduce((s, o) => s + o.items.reduce((n, i) => n + i.quantity, 0), 0),
      revenueByDay: [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([day, total]) => ({ day, revenue: total })),
      topProducts: [...byProduct.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, quantity]) => ({ name, quantity })),
      statusCounts,
    };
  }
}
