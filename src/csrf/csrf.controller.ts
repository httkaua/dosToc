import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';

@Controller('csrf')
export class CsrfController {
  @Get('token')
  getCsrfToken(@Req() req) {
    return {
      csrfToken: req.csrfToken ? req.csrfToken() : null,
    };
  }
}