import { BadRequestException, Injectable } from '@nestjs/common';
import type { Discount } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DiscountDto, UpdateDiscountDto } from './discounts.dto';
import { discountAmount, discountError, discountState } from './discount.rules';

const toDate = (v?: string | null) => (v ? new Date(`${v}T00:00:00.000Z`) : v === null ? null : undefined);

@Injectable()
export class DiscountsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Lets the checkout preview a code. Reveals nothing about codes that do not apply. */
  async validate(code: string, subtotal: number) {
    const d = await this.prisma.discount.findUnique({ where: { code } });
    const error = discountError(d, subtotal);
    if (error || !d) return { valid: false, error: error ?? 'This code is not valid.' };
    return { valid: true, code: d.code, type: d.type, value: d.value, amount: discountAmount(d, subtotal) };
  }

  async list() {
    const rows = await this.prisma.discount.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map((d) => this.serialize(d));
  }

  async create(dto: DiscountDto) {
    this.check(dto);
    const d = await this.prisma.discount.create({
      data: {
        code: dto.code,
        type: dto.type,
        value: dto.value,
        active: dto.active ?? true,
        usageLimit: dto.usageLimit ?? null,
        minOrderAmount: dto.minOrderAmount ?? null,
        startsAt: toDate(dto.startsAt) ?? null,
        endsAt: toDate(dto.endsAt) ?? null,
      },
    });
    return this.serialize(d);
  }

  async update(id: string, dto: UpdateDiscountDto) {
    const current = await this.prisma.discount.findUniqueOrThrow({ where: { id } });
    this.check({
      type: dto.type ?? current.type,
      value: dto.value ?? current.value,
      startsAt: dto.startsAt !== undefined ? dto.startsAt : current.startsAt?.toISOString().slice(0, 10) ?? null,
      endsAt: dto.endsAt !== undefined ? dto.endsAt : current.endsAt?.toISOString().slice(0, 10) ?? null,
    });
    const d = await this.prisma.discount.update({
      where: { id },
      data: {
        code: dto.code,
        type: dto.type,
        value: dto.value,
        active: dto.active,
        usageLimit: dto.usageLimit,
        minOrderAmount: dto.minOrderAmount,
        startsAt: toDate(dto.startsAt),
        endsAt: toDate(dto.endsAt),
      },
    });
    return this.serialize(d);
  }

  async remove(id: string) {
    await this.prisma.discount.delete({ where: { id } });
  }

  private check(v: { type: string; value: number; startsAt?: string | null; endsAt?: string | null }) {
    if (v.type === 'percentage' && v.value > 100) throw new BadRequestException('A percentage discount cannot be more than 100.');
    if (v.startsAt && v.endsAt && v.endsAt < v.startsAt) throw new BadRequestException('The end date must be after the start date.');
  }

  private serialize(d: Discount) {
    return {
      id: d.id,
      code: d.code,
      type: d.type,
      value: d.value,
      active: d.active,
      usageLimit: d.usageLimit,
      usedCount: d.usedCount,
      minOrderAmount: d.minOrderAmount,
      startsAt: d.startsAt?.toISOString().slice(0, 10) ?? null,
      endsAt: d.endsAt?.toISOString().slice(0, 10) ?? null,
      state: discountState(d),
      createdAt: d.createdAt,
    };
  }
}
