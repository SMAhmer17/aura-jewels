import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../common/auth.guards';
import { AnalyticsQueryDto, CustomersQueryDto } from './admin.dto';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('overview')
  overview() {
    return this.admin.overview();
  }

  @Get('customers')
  customers(@Query() query: CustomersQueryDto) {
    return this.admin.customers(query);
  }

  @Get('analytics')
  analytics(@Query() query: AnalyticsQueryDto) {
    return this.admin.analytics(query);
  }
}
