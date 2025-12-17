import { Global, Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';

const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp(),
  winston.format.printf(
    ({ level, message, timestamp, context }) =>
      `[${timestamp}] ${level} ${context ?? ''} ${message}`,
  ),
);

const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json(),
);

const isProd = process.env.NODE_ENV === 'production';

const logDir = path.join(process.cwd(), 'logs');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

@Global()
@Module({
  imports: [
    WinstonModule.forRoot({
      level: isProd ? 'info' : 'debug',
      transports: [
        new winston.transports.Console({
          format: isProd ? prodFormat : devFormat,
        }),
        new winston.transports.File({
          filename: path.join(logDir, 'error.log'),
          level: 'error',
        }),
        new winston.transports.File({
          filename: path.join(logDir, 'app.log'),
        }),
      ],
    }),
  ],
  exports: [WinstonModule],
})
export class LoggersModule {}
