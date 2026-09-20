import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

export type Role = 'admin' | 'customer';
export interface AuthUser {
  sub: string;
  role: Role;
}
export type AuthedRequest = Request & { user?: AuthUser };

function readToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  return scheme?.toLowerCase() === 'bearer' && token ? token : null;
}

abstract class BaseGuard implements CanActivate {
  constructor(protected readonly jwt: JwtService) {}

  protected abstract handle(user: AuthUser | null): boolean;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const token = readToken(req);
    let user: AuthUser | null = null;
    if (token) {
      try {
        user = await this.jwt.verifyAsync<AuthUser>(token);
      } catch {
        user = null;
      }
    }
    req.user = user ?? undefined;
    return this.handle(user);
  }
}

/** Only the store admin. */
@Injectable()
export class AdminGuard extends BaseGuard {
  // Explicit constructor: NestJS cannot inject into a constructor inherited from a base class.
  constructor(jwt: JwtService) {
    super(jwt);
  }

  protected handle(user: AuthUser | null) {
    if (!user) throw new UnauthorizedException('Please sign in.');
    if (user.role !== 'admin') throw new ForbiddenException('Admin access only.');
    return true;
  }
}

/** A signed-in customer. */
@Injectable()
export class CustomerGuard extends BaseGuard {
  // Explicit constructor: NestJS cannot inject into a constructor inherited from a base class.
  constructor(jwt: JwtService) {
    super(jwt);
  }

  protected handle(user: AuthUser | null) {
    if (!user) throw new UnauthorizedException('Please sign in.');
    if (user.role !== 'customer') throw new ForbiddenException('Customer account required.');
    return true;
  }
}

/** Lets guests through but still identifies a signed-in customer when a token is sent. */
@Injectable()
export class OptionalAuthGuard extends BaseGuard {
  constructor(jwt: JwtService) {
    super(jwt);
  }

  protected handle() {
    return true;
  }
}
