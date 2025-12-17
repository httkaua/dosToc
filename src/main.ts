import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import "reflect-metadata"; //* TYPEORM REQUIREMENT
import { InternalServerErrorException, ValidationPipe } from '@nestjs/common';
import session from 'express-session';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { doubleCsrf } from 'csrf-csrf';
import { winstonLogger } from './loggers/logger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: winstonLogger,
  });

  app.use(helmet());

  app.use(cookieParser());

  if (!process?.env?.SECRET) {
    throw new InternalServerErrorException('missing the session secret.')
  }

  app.use(
    session({
      secret: process?.env?.SECRET,
      resave: false,
      saveUninitialized: true,
      cookie: { 
        maxAge: 3600000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      }
    })
  );

  const { doubleCsrfProtection } = doubleCsrf({
    getSecret: () => process.env.CSRF_SECRET || 'your-csrf-secret-key',
    cookieName: 'x-csrf-token',
    cookieOptions: {
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
    },
    size: 64,
    ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
    getSessionIdentifier: (req) => {
      if (!req.session) {
        throw new Error('Session not initialized');
      }
      return req.session?.id || '';
    },
  });

  app.use(doubleCsrfProtection);

  app.enableCors({
    origin: process.env.NODE_ENV === 'production' 
      ? 'http://localhost:3000' 
      : 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();