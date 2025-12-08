import { Module } from '@nestjs/common';
import { PropertyownersService } from './propertyowners.service';
import { PropertyownersController } from './propertyowners.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PropertyOwner } from './entities/property-owner.entity';
import { User } from 'src/users/entities/user.entity';
import { Company } from 'src/companies/entities/company.entity';
import { UsersModule } from 'src/users/users.module';
import { CompaniesModule } from 'src/companies/companies.module';
import { PropertyOwnerValidatorService } from './services/propertyowners-validator.service';
import { PropertyOwnerRepositoryService } from './services/propertyowners-repository.service';
import { PropertyOwnersTransformerService } from './services/propertyowners-tranformer.service';
import { RealestatesModule } from 'src/realestates/realestates.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PropertyOwner, User, Company]),
    UsersModule,
    CompaniesModule
  ],
  providers: [
    PropertyownersService,
    PropertyOwnerValidatorService,
    PropertyOwnerRepositoryService,
    PropertyOwnersTransformerService
  ],
  controllers: [PropertyownersController],
  exports: [PropertyownersService]
})
export class PropertyownersModule {}
