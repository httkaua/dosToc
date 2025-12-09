import { Module } from '@nestjs/common';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lead } from './entities/lead.entity';
import { User } from 'src/users/entities/user.entity';
import { UsersModule } from 'src/users/users.module';
import { LeadRepositoryService } from './services/lead-repository.service';
import { LeadValidatorService } from './services/lead-validator.service';
import { LeadTransformerService } from './services/lead-transformer.service';

@Module({
  imports: [
      TypeOrmModule.forFeature([Lead, User]),
      UsersModule
    ],
  controllers: [LeadsController],
  providers: [
    LeadsService,
    LeadRepositoryService,
    LeadValidatorService,
    LeadTransformerService
  ],
  exports: [LeadsService]
})
export class LeadsModule {}
