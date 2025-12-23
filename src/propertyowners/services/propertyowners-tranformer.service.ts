import { Inject, Injectable } from '@nestjs/common';
import type { LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";

@Injectable()
export class PropertyOwnersTransformerService {
    constructor(
      @Inject(WINSTON_MODULE_NEST_PROVIDER)
      private readonly logger: LoggerService,
    ) {}

  generateSearchableName(username: string): string {
    const start = Date.now()
    const searchableName = username
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (this.logger.debug) {
      this.logger.debug(`PropertyOwnersTransformerService.generateSearchableName executed, username: ${username}, searchableName: ${searchableName}, durationMs: ${Date.now() - start}`, 'Property Owners Transformer');
    }

    return searchableName;
  }

}