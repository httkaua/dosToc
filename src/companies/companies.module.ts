import { Module } from '@nestjs/common';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { Company } from './entities/company.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/entities/user.entity';
import { CompanyValidatorService } from './services/company-validator.service';
import { CompanyRepositoryService } from './services/company-repository.service';
import { UserValidatorService } from 'src/users/services/user-validator.service';
import { UserRepositoryService } from 'src/users/services/user-repository.service';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company, User]),
    UsersModule
  ],
  controllers: [CompaniesController],
  providers: [
    CompaniesService,
    CompanyValidatorService,
    CompanyRepositoryService
  ],
  exports: [CompaniesService],
})
export class CompaniesModule {}
