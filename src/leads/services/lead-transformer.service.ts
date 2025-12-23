import { Inject, Injectable } from "@nestjs/common";
import * as bcrypt from 'bcrypt';
import type { LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";

@Injectable()
export class LeadTransformerService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  generateSearchableName(name: string): string {
    const start = Date.now()
    const searchableName = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (this.logger.debug) {
      this.logger.debug(`LeadTransformerService.generateSearchableName executed, durationMs: ${Date.now() - start}`, 'Lead Transformer')
    }

    return searchableName;
  }
  async hashPassword(password: string): Promise<string> {
    const start = Date.now()
    const hashedPassword = await bcrypt.hash(password, 10);
    if (this.logger.debug) {
      this.logger.debug(`LeadTransformerService.hashPassword executed, durationMs: ${Date.now() - start}`, 'Lead Transformer')
    }
    return hashedPassword;
  }

}