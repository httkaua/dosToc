import { Controller, Get, Inject, Req } from '@nestjs/common';
import { Request } from 'express';
import type { LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Controller('csrf')
export class CsrfController {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService
  ) {}

  @Get('token')
  getCsrfToken(@Req() req) {
    this.logger.log('GET /csrf/token');
    return {
      csrfToken: req.csrfToken ? req.csrfToken() : null,
    };
  }
}