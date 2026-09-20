import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { resolve } from 'node:path';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './common/prisma-exception.filter';

export async function createApp() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: true,
    logger: process.env.NODE_ENV === 'test' ? ['error'] : undefined,
  });

  const origins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  // Uploaded product images are shown on the storefront, which lives on a different origin.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.enableCors({ origin: origins.length ? origins : false, credentials: false });
  app.setGlobalPrefix('api/v1', { exclude: ['uploads/(.*)'] });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new PrismaExceptionFilter());
  app.useBodyParser('json', { limit: '1mb' });
  // Only needed when images are kept on this server's disk (local development). With Supabase Storage they are served from its CDN.
  if (!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)) {
    app.useStaticAssets(resolve(process.env.UPLOAD_DIR ?? './uploads'), { prefix: '/uploads', maxAge: '7d' });
  }

  // Interactive API docs at /api/docs (JSON at /api/docs-json). On by default, including production; set SWAGGER_ENABLED=false to hide them.
  if (process.env.SWAGGER_ENABLED !== 'false') {
    const config = new DocumentBuilder()
      .setTitle('Aura Jewels API')
      .setDescription(
        'Storefront and admin API for Aura Jewels (cash on delivery, prices in PKR).\n\n' +
          'Sign in with POST /auth/admin/login (admin) or POST /auth/login (customer), then click Authorize and paste the accessToken. ' +
          'Endpoints under /admin need the admin token; /me needs a customer token; everything else is public.',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const doc = SwaggerModule.createDocument(app, config);
    // Mark every protected route so the docs show a lock and send the token from the Authorize dialog.
    for (const [path, methods] of Object.entries(doc.paths)) {
      if (!/^\/api\/v1\/(admin|me)(\/|$)/.test(path)) continue;
      for (const operation of Object.values(methods) as { security?: unknown[] }[]) operation.security = [{ bearer: [] }];
    }
    SwaggerModule.setup('api/docs', app, doc, { jsonDocumentUrl: 'api/docs-json' });
  }
  return app;
}

async function bootstrap() {
  const app = await createApp();
  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port, '0.0.0.0');
  new Logger('Bootstrap').log(`API listening on port ${port}`);
}

if (require.main === module) void bootstrap();
