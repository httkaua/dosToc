import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Company } from 'src/companies/entities/company.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { PropertyOwner } from '../entities/property-owner.entity';
import type { LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";

@Injectable()
export class PropertyOwnerValidatorService {
    constructor(
        @InjectRepository(PropertyOwner)
        private readonly propertyOwnerRepository: Repository<PropertyOwner>,

        @Inject(WINSTON_MODULE_NEST_PROVIDER)
        private readonly logger: LoggerService,
    ) {}

    async validateUniquePhoneInCompany(updatePropertyOwnerDto: Record<string, any>, company: Company): Promise<void> {
        const existingPropertyOwner = await this.propertyOwnerRepository.findOne({
            where: {
                phoneNumber: updatePropertyOwnerDto.phoneNumber,
                propertyOwnerCompany: company
            }
        });

        if (existingPropertyOwner) {
            this.logger.warn(`Operation closed by validation: Property owner with this phone number already exists in the company. propertyOwnerID: ${existingPropertyOwner.propertyOwnerID}`, 'Property Owner Validator')
            throw new ConflictException(`Property owner with this phone number already exists in the company. ID ${existingPropertyOwner.propertyOwnerID}`);
        }
    }
}