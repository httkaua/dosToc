import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { Company } from 'src/companies/entities/company.entity';
import { UserRepositoryService } from './services/user-repository.service';
import { UserValidatorService } from './services/user-validator.service';
import { UserTransformerService } from './services/user-transformer.service';
import { TeamManagementService } from './services/team-management.service';
import { TeamsController } from './users-team.controller';
import { CompaniesService } from 'src/companies/companies.service';
import { CompanyRepositoryService } from 'src/companies/services/company-repository.service';
import { CompanyValidatorService } from 'src/companies/services/company-validator.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Company])],
  controllers: [
    TeamsController,
    UsersController,
  ],
  providers: [
    UsersService,
    UserRepositoryService,
    UserValidatorService,
    UserTransformerService,
    TeamManagementService,
    CompaniesService,
    CompanyRepositoryService,
    CompanyValidatorService
  ],
  exports: [
    UsersService,
    UserValidatorService
  ],
})
export class UsersModule {}