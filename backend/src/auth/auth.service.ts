import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './auth.dto';

// Compared against when the email is unknown, so response time does not reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async adminLogin({ email, password }: LoginDto) {
    const admin = await this.prisma.adminUser.findUnique({ where: { email } });
    const ok = await bcrypt.compare(password, admin?.passwordHash ?? DUMMY_HASH);
    if (!admin || !ok) throw new UnauthorizedException('Incorrect email or password.');
    return { accessToken: await this.jwt.signAsync({ sub: admin.id, role: 'admin' }), email: admin.email };
  }

  async register({ name, email, password, phone }: RegisterDto) {
    const existing = await this.prisma.customer.findUnique({ where: { email } });
    if (existing) throw new ConflictException('An account with this email already exists.');
    const customer = await this.prisma.customer.create({
      data: { name: name.trim(), email, phone: phone?.trim() || null, passwordHash: await bcrypt.hash(password, 12) },
    });
    return this.session(customer);
  }

  async customerLogin({ email, password }: LoginDto) {
    const customer = await this.prisma.customer.findUnique({ where: { email } });
    const ok = await bcrypt.compare(password, customer?.passwordHash ?? DUMMY_HASH);
    if (!customer || !ok) throw new UnauthorizedException('Incorrect email or password.');
    return this.session(customer);
  }

  async me(customerId: string) {
    const c = await this.prisma.customer.findUniqueOrThrow({ where: { id: customerId } });
    return { id: c.id, name: c.name, email: c.email, phone: c.phone };
  }

  private async session(c: { id: string; name: string; email: string; phone: string | null }) {
    return {
      accessToken: await this.jwt.signAsync({ sub: c.id, role: 'customer' }),
      customer: { id: c.id, name: c.name, email: c.email, phone: c.phone },
    };
  }
}
