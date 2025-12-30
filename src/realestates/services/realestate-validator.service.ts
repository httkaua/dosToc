import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Company } from 'src/companies/entities/company.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { RealEstate } from '../entities/real-estate.entity';
import type { LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";

@Injectable()
export class RealestateValidatorService {
    constructor(
        @InjectRepository(RealEstate)
        private readonly realestateRepository: Repository<RealEstate>,

        @Inject(WINSTON_MODULE_NEST_PROVIDER)
        private readonly logger: LoggerService,
    ) {}

    async validateUniqueAddressInCompany(newRealEstate: Record<string, any>, company: Company): Promise<void> {
        const existingRealestate = await this.realestateRepository.findOne({
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
        })

        if (existingRealestate) {
            this.logger.warn(`Operation closed by validation: Real estate with this address already exists in the company. easyID: ${existingRealestate.easyID}`, 'Real Estate Validator')
            throw new ConflictException(`Real estate with this address already exists in the company. easyID: ${existingRealestate.easyID}`);
        }
    }
}