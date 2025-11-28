import { Injectable, NotFoundException } from '@nestjs/common';
import { Lead } from '../entities/lead.entity';
import { Repository } from 'typeorm';
import { ResponseLeadDto } from '../dto/response-lead.dto';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class LeadRepositoryService {
    constructor(

        @InjectRepository(Lead)
        private readonly leadRepository: Repository<Lead>,
    ) {}

    async findById(id: number, relations: string[]): Promise<Lead> {
        const lead = await this.leadRepository.findOne({
        where: { leadID: id },
        relations,
        });

        if (!lead) {
        throw new NotFoundException(`Lead with ID ${id} not found.`);
        }
        return lead;
    }

    async findByName(name: string): Promise<Lead | null> {
        return this.leadRepository.findOne({
        where: { searchableName: name}
        });
    }

    async findByEmail(email: string): Promise<Lead | null> {
        return this.leadRepository.findOne({
        where: { email }
        });
    }

    async findAll(relations: string[] = []): Promise<Lead[]> {
        return this.leadRepository.find({
        relations,
        order: { createdAt: 'DESC' }
        });
    }

    async save(lead: Lead): Promise<Lead> {
        return this.leadRepository.save(lead);
    }

    async create(leadData: Partial<Lead>): Promise<Lead> {
        const lead = this.leadRepository.create(leadData);
        return this.save(lead);
    }

    async remove(lead: Lead): Promise<void> {
        await this.leadRepository.remove(lead);
    }

    async findAllCompanyLeads(id: number): Promise<Lead[]> {
    const leads = await this.leadRepository.find({
        where: { leadCompany: { companyID: id } },
        relations: ['attendingUser'],
        order: { createdAt: 'DESC' }
    });

    if (!leads || leads.length === 0) {
        throw new NotFoundException(`No leads found for company with ID ${id}.`);
    }

    return leads
    }
}