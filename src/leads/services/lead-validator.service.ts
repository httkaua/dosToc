import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Lead } from '../entities/lead.entity';
import { LeadRepositoryService } from './lead-repository.service';
import { Repository } from 'typeorm';
import { Company } from 'src/companies/entities/company.entity';
import { User } from 'src/users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class LeadValidatorService {
    constructor(
        private readonly leadRepositoryService: LeadRepositoryService,

        @InjectRepository(Lead)
        private readonly leadRepository: Repository<Lead>
    ) {}

    async validateUniquePhoneInCompany(phoneNumber: string, company: Company): Promise<void> {
        const existingLead = await this.leadRepository.find({
            where: {
                phoneNumber,
                leadCompany: company
            }
        });

        if (existingLead.length > 0) {
            throw new ConflictException('Lead with this phone number already exists in the company');
        }
    }

    async validateLeadsAccess(allowedUsers: User[] , reqUser: User): Promise<void> {
        if (!allowedUsers.some(user => user.userID === reqUser.userID)) {
            throw new UnauthorizedException('Access denied to this lead');
        }
    }
}