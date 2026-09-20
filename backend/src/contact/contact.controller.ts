import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AdminGuard } from '../common/auth.guards';
import { CreateMessageDto, MessageQueryDto, UpdateMessageStatusDto } from './contact.dto';
import { ContactService } from './contact.service';

@Controller()
export class ContactController {
  constructor(private readonly contact: ContactService) {}

  // The storefront contact form. Limited so it cannot be used to flood the inbox.
  @Post('contact')
  @HttpCode(201)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  create(@Body() dto: CreateMessageDto) {
    return this.contact.create(dto);
  }

  @Get('admin/messages')
  @UseGuards(AdminGuard)
  list(@Query() query: MessageQueryDto) {
    return this.contact.list(query);
  }

  @Patch('admin/messages/:id')
  @UseGuards(AdminGuard)
  setStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMessageStatusDto) {
    return this.contact.setStatus(id, dto.status);
  }

  @Delete('admin/messages/:id')
  @HttpCode(204)
  @UseGuards(AdminGuard)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.contact.remove(id);
  }
}
