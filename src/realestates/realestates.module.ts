import { Module } from '@nestjs/common';
import { RealestatesService } from './realestates.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RealestatesController } from './realestates.controller';
import { RealEstate } from './entities/real-estate.entity';
import { User } from 'src/users/entities/user.entity';
import { UsersModule } from 'src/users/users.module';
import { RealestateValidatorService } from './services/realestate-validator.service';
import { RealestateRepositoryService } from './services/realestate-repository.service';
import { Company } from 'src/companies/entities/company.entity';
import { CompaniesModule } from 'src/companies/companies.module';
import { RealestateIdentifierService } from './services/realestate.identifier.service';
import { PropertyownersModule } from 'src/propertyowners/propertyowners.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RealEstate, User, Company]),
    UsersModule,
    CompaniesModule,
    PropertyownersModule  
  ],
  controllers: [RealestatesController],
  providers: [
    RealestatesService,
    RealestateRepositoryService,
    RealestateValidatorService,
    RealestateIdentifierService
  ],
  exports: [RealestatesService]
})
export class RealestatesModule {}
