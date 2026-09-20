import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../common/auth.guards';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './settings.dto';

@Controller()
export class SettingsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('settings')
  get() {
    return this.prisma.settings.findUniqueOrThrow({ where: { id: 1 }, omit: { id: true } });
  }

  @Put('admin/settings')
  @UseGuards(AdminGuard)
  update(@Body() dto: UpdateSettingsDto) {
    return this.prisma.settings.update({ where: { id: 1 }, data: dto, omit: { id: true } });
  }
}
