import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';

const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp(),
  winston.format.simple(),
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

export const winstonLogger = WinstonModule.createLogger({
  level: isProd ? 'info' : 'debug',

  transports: [
    new winston.transports.Console({
      format: isProd
        ? prodFormat
        : devFormat,
    }),

    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
    }),

    new winston.transports.File({
      filename: path.join(logDir, 'app.log'),
    }),
  ],
});
