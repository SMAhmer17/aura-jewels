import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto, MessageQueryDto } from './contact.dto';

@Injectable()
export class ContactService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMessageDto) {
    // A filled-in hidden field means a bot. Pretend it worked so it does not learn anything.
    if (dto.website) return { received: true };
    await this.prisma.contactMessage.create({
      data: { name: dto.name, email: dto.email, phone: dto.phone || null, orderNumber: dto.orderNumber || null, message: dto.message },
    });
    return { received: true };
  }

  list(query: MessageQueryDto) {
    const term = query.q?.trim();
    return this.prisma.contactMessage.findMany({
      where: {
        status: query.status,
        OR: term
          ? [
              { name: { contains: term, mode: 'insensitive' } },
              { email: { contains: term, mode: 'insensitive' } },
              { message: { contains: term, mode: 'insensitive' } },
              { orderNumber: { contains: term, mode: 'insensitive' } },
            ]
          : undefined,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  setStatus(id: string, status: 'unread' | 'read' | 'resolved') {
    return this.prisma.contactMessage.update({ where: { id }, data: { status } });
  }

  async remove(id: string) {
    await this.prisma.contactMessage.delete({ where: { id } });
  }
}
