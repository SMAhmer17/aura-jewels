import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';

/** Turns common database errors into clear HTTP responses instead of 500s. */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    const map: Record<string, [number, string]> = {
      P2002: [HttpStatus.CONFLICT, 'That value is already in use.'],
      P2003: [HttpStatus.CONFLICT, 'This record is still referenced by something else.'],
      P2025: [HttpStatus.NOT_FOUND, 'Not found.'],
      P2023: [HttpStatus.BAD_REQUEST, 'Invalid identifier.'],
      P2004: [HttpStatus.BAD_REQUEST, 'That change is not allowed.'],
    };
    const [status, message] = map[exception.code] ?? [HttpStatus.INTERNAL_SERVER_ERROR, 'Something went wrong.'];
    if (status === HttpStatus.INTERNAL_SERVER_ERROR) console.error(exception);
    res.status(status).json({ statusCode: status, message, error: HttpStatus[status] });
  }
}
