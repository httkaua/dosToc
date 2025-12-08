import { Injectable } from '@nestjs/common';

@Injectable()
export class PropertyOwnersTransformerService {

  generateSearchableName(username: string): string {
    return username
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

}