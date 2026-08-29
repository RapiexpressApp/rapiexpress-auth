import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { json, urlencoded, type Express } from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { ACCESS_TOKEN_COOKIE } from './auth/services/cookie.service.js';
import { AppModule } from './app.module.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  const port = Number(process.env.PORT ?? 3000);

  app.use(helmet());
  app.use(cookieParser());

  const server = app.getHttpAdapter().getInstance() as Express;

  server.set('trust proxy', 1);

  app.use(json({ limit: '1mb' }));
  app.use(urlencoded({ extended: true, limit: '1mb' }));

  app.enableCors({
    origin: process.env.FRONTEND_URL?.split(',').map((origin) => origin.trim()) ?? true,
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.enableShutdownHooks();

  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('RapiExpress Auth API')
    .setDescription('API REST de autenticación y autorización de RapiExpress')
    .setVersion('1.0')
    .addTag('auth')
    .addCookieAuth(
      ACCESS_TOKEN_COOKIE,
      {
        type: 'apiKey',
        in: 'cookie',
        name: ACCESS_TOKEN_COOKIE,
        description:
          'Cookie HttpOnly con el token de acceso generada automáticamente al iniciar sesión.',
      },
      'cookieAuth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      withCredentials: true,
      persistAuthorization: true,
    },
  });

  await app.listen(port, '0.0.0.0');

  console.log(`Swagger: http://localhost:${port}/docs`);
  console.log(`Application running on: http://localhost:${port}/api`);
}

void bootstrap();
