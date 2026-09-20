import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthedRequest, CustomerGuard } from '../common/auth.guards';
import { LoginDto, RegisterDto } from './auth.dto';
import { AuthService } from './auth.service';

// Sign-in endpoints allow only a few attempts per minute per IP to slow down password guessing.
const strict = { default: { limit: 5, ttl: 60_000 } };

@Controller()
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('auth/admin/login')
  @HttpCode(200)
  @Throttle(strict)
  adminLogin(@Body() dto: LoginDto) {
    return this.auth.adminLogin(dto);
  }

  @Post('auth/register')
  @Throttle(strict)
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('auth/login')
  @HttpCode(200)
  @Throttle(strict)
  login(@Body() dto: LoginDto) {
    return this.auth.customerLogin(dto);
  }

  @Get('me')
  @UseGuards(CustomerGuard)
  me(@Req() req: AuthedRequest) {
    return this.auth.me(req.user!.sub);
  }
}
