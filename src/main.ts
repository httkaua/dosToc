import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import "reflect-metadata"; //* TYPEORM REQUIREMENT
import { ForbiddenException, InternalServerErrorException, ValidationPipe } from '@nestjs/common';
import session from 'express-session';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  if (!process?.env?.SECRET) {
    throw new InternalServerErrorException('missing the session secret.')
  }

  app.use(
    session({
      secret: process?.env?.SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 3600000 }
    })
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();