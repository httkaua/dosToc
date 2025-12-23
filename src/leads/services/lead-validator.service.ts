import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { Lead } from '../entities/lead.entity';
import { Repository } from 'typeorm';
import { Company } from 'src/companies/entities/company.entity';
import { InjectRepository } from '@nestjs/typeorm';
import type { LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";

@Injectable()
export class LeadValidatorService {
    constructor(
        @InjectRepository(Lead)
        private readonly leadRepository: Repository<Lead>,

        @Inject(WINSTON_MODULE_NEST_PROVIDER)
        private readonly logger: LoggerService,
    ) {}

    async validateUniquePhoneInCompany(phoneNumber: string, company: Company): Promise<void> {
        const existingLead = await this.leadRepository.find({
            where: {
                phoneNumber,
                leadCompany: company
            }
        });

        if (existingLead.length > 0) {
            this.logger.warn(`Operation closed by validation: Lead with this phone number already exists in the company. leadID: ${existingLead[0]?.leadID}`, 'Lead Validator')
            throw new ConflictException('Lead with this phone number already exists in the company');
        }
    }
}