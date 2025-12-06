import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Company } from 'src/companies/entities/company.entity';
import { User } from 'src/users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { RealEstate } from '../entities/real-estate.entity';

@Injectable()
export class RealestateValidatorService {
    constructor(
        @InjectRepository(RealEstate)
        private readonly realestateRepository: Repository<RealEstate>
    ) {}

    async validateUniqueAddressInCompany(newRealEstate: Record<string, any>, company: Company): Promise<void> {
        const existingRealestate = await this.realestateRepository.find({
            where: {
                zipCode: newRealEstate.zipCode,
                street: newRealEstate.street,
                streetNumber: newRealEstate.streetNumber,
                neighborhood: newRealEstate.neighborhood,
                city: newRealEstate.city,
                state: newRealEstate.state,
                country: newRealEstate.country,
                realEstateCompany: company
            }
        });

        if (existingRealestate.length > 0) {
            throw new ConflictException(`Real estate with this address already exists in the company: easyID: ${existingRealestate[0].easyID}`);
        }
    }
}