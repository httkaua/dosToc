import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Lead } from '../entities/lead.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import type { LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";

@Injectable()
export class LeadRepositoryService {
    constructor(
        @InjectRepository(Lead)
        private readonly leadRepository: Repository<Lead>,

        @Inject(WINSTON_MODULE_NEST_PROVIDER)
        private readonly logger: LoggerService,
    ) {}

    async findById(id: number, relations: string[] = []): Promise<Lead | null> {
        const start = Date.now()
        const lead = await this.leadRepository.findOne({
            where: { leadID: id },
            relations,
        })

        if (this.logger.debug) {
            this.logger.debug(`LeadsRepository.findById executed, leadID: ${lead?.leadID}, relations: ${relations}, durationMs: ${Date.now() - start}`, 'Leads Repository Service')
        }
        
        return lead;
    }

    async findByName(name: string): Promise<Lead | null> {
        const start = Date.now()
        const lead = await this.leadRepository.findOne({
        where: { searchableName: name}
        })

        if (this.logger.debug) {
            this.logger.debug(`LeadsRepository.findByName executed, name: ${lead?.name}, durationMs: ${Date.now() - start}`, 'Leads Repository Service')
        }

        return lead;
    }

    async findByEmail(email: string): Promise<Lead | null> {
        const start = Date.now()
        const lead = await this.leadRepository.findOne({
        where: { email }
        });

        if (this.logger.debug) {
            this.logger.debug(`LeadsRepository.findByEmail executed, email: ${lead?.email}, durationMs: ${Date.now() - start}`, 'Leads Repository Service')
        }

        return lead;
    }

    async findAll(relations: string[]): Promise<Lead[]> {
        const start = Date.now()
        if (!relations) {
            this.logger.warn(`Invalid attempt to find all leads with no relations: ${relations}`, 'Leads Repository Service')
            throw new ForbiddenException('Leads relations forbidden.')
        }

        const leads = await this.leadRepository.find({
        relations,
        order: { createdAt: 'DESC' }
        })

        if (this.logger.debug) {
            this.logger.debug(`LeadsRepository.findAll executed, resultCount: ${leads.length}, relations: ${relations}, durationMs: ${Date.now() - start}`, 'Leads Repository Service')
        }

        return leads
    }

    async save(lead: Lead): Promise<Lead> {
        const start = Date.now()
        const savedLead = await this.leadRepository.save(lead);

        if (this.logger.debug) {
            this.logger.debug(`LeadsRepository.save executed, durationMs: ${Date.now() - start}`, 'Leads Repository Service')
        }
        return savedLead;
    }

    async create(leadData: Partial<Lead>): Promise<Lead> {
        const start = Date.now()
        const lead = this.leadRepository.create(leadData)
        this.save(lead)

        if (this.logger.debug) {
            this.logger.debug(`LeadsRepository.create executed, durationMs: ${Date.now() - start}`, 'Leads Repository Service');
        }
        return lead;
    }

    async remove(lead: Lead): Promise<void> {
        const start = Date.now()
        await this.leadRepository.remove(lead)
        if (this.logger.debug) {
            this.logger.debug(`LeadsRepository.remove executed, durationMs: ${Date.now() - start}`, 'Leads Repository Service');
        }
    }

    async findAllCompanyLeads(id: number, relations: string[]): Promise<Lead[]> {
        const start = Date.now()
        const leads = await this.leadRepository.find({
            where: { leadCompany: { companyID: id } },
            relations,
            order: { createdAt: 'DESC' }
        })

        if (!leads || leads.length === 0) {
            this.logger.warn(`No leads found. companyID: ${id}`, 'Leads Repository Service')
            throw new NotFoundException(`No leads found for company with ID ${id}.`);
        }

        if (this.logger.debug) {
            this.logger.debug(`LeadsRepository.findAllCompanyLeads executed, resultCount: ${leads.length}, durationMs: ${Date.now() - start}`, 'Leads Repository Service');
        }

        return leads
    }

    async findAllUserLeads(id: number, relations: string[]): Promise<Lead[]> {
        const start = Date.now()
    const leads = await this.leadRepository.find({
        where: { attendingUser: { userID: id } },
        relations,
        order: { createdAt: 'DESC' }
    });

    if (!leads || leads.length === 0) {
        this.logger.warn(`No leads found for user with ID ${id}`, 'Leads Repository Service')
        throw new NotFoundException(`No leads found for user with ID ${id}.`);
    }

    return leads
    }
}