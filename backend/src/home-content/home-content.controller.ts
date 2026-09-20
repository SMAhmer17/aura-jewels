import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { IsObject } from 'class-validator';
import { AdminGuard } from '../common/auth.guards';
import { PrismaService } from '../prisma/prisma.service';
import { validateHomeContent } from './home-content.validation';

class UpdateHomeContentDto {
  @IsObject() content: Record<string, unknown>;
}

@Controller()
export class HomeContentController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('home-content')
  async get() {
    const row = await this.prisma.homeContent.findUniqueOrThrow({ where: { id: 1 } });
    return row.content;
  }

  @Put('admin/home-content')
  @UseGuards(AdminGuard)
  async update(@Body() dto: UpdateHomeContentDto) {
    validateHomeContent(dto.content);
    const row = await this.prisma.homeContent.upsert({
      where: { id: 1 },
      update: { content: dto.content as Prisma.InputJsonValue },
      create: { id: 1, content: dto.content as Prisma.InputJsonValue },
    });
    return row.content;
  }
}
