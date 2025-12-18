import { Controller, Request, Get, Post, UseGuards, Redirect, Inject } from '@nestjs/common';
import { AppService } from './app.service';
import { AuthService } from './auth/auth.service';
import { LocalAuthGuard } from './auth/local-auth.guard';
import type { LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Controller()
export class AppController {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    
    private readonly appService: AppService,
    private readonly authService: AuthService
  ) {}

  @Get()
  homePage(): string {
    this.logger.log('GET / (root page)');
    return this.appService.homePage();
  }

  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  async login(@Request() req) {
    this.logger.log('POST auth/login');
    return this.authService.login(req.user)
  }

  @UseGuards(LocalAuthGuard)
  @Post('auth/logout')
  async logout(@Request() req) {
    this.logger.log('POST auth/logout');
    return req.logout(() => {
      Redirect('../')
    });
  }
}
