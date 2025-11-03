import { Module } from '@nestjs/common';
import { TypeormController } from './typeorm.controller';
import { TypeormService } from './typeorm.service';
import { databaseProviders } from './database.providers';

@Module({
  providers: [...databaseProviders],
  exports: [...databaseProviders],
})
export class DatabaseModule {}
