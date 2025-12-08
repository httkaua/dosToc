import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Company } from 'src/companies/entities/company.entity';
import { User } from 'src/users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { PropertyOwner } from '../entities/property-owner.entity';

@Injectable()
export class PropertyOwnerValidatorService {
    constructor(
        @InjectRepository(PropertyOwner)
        private readonly propertyOwnerRepository: Repository<PropertyOwner>
    ) {}

    async validateUniquePhoneInCompany(updatePropertyOwnerDto: Record<string, any>, company: Company): Promise<void> {
        const existingPropertyOwner = await this.propertyOwnerRepository.findOne({
            where: {
                phoneNumber: updatePropertyOwnerDto.phoneNumber,
                propertyOwnerCompany: company
            }
        });

        if (existingPropertyOwner) {
            throw new ConflictException(
                `Property owner with this phone number already exists in the company. ID ${existingPropertyOwner.propertyOwnerID}`
            );
        }
    }
}