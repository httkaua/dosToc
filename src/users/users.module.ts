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
  ],
  exports: [
    UsersService
  ],
})
export class UsersModule {}