import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AdminGuard, CustomerGuard, OptionalAuthGuard } from '../common/auth.guards';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: (config.get<string>('JWT_EXPIRES_IN') ?? '7d') as never },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AdminGuard, CustomerGuard, OptionalAuthGuard],
  exports: [AuthService, AdminGuard, CustomerGuard, OptionalAuthGuard],
})
export class AuthModule {}
