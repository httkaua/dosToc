import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { LeadRepositoryService } from './services/lead-repository.service';
import { LeadValidatorService } from './services/lead-validator.service';
import { User } from 'src/users/entities/user.entity';
import { Lead } from './entities/lead.entity';
import { UserValidatorService } from 'src/users/services/user-validator.service';
import { LeadTransformerService } from './services/lead-transformer.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class LeadsService {
    constructor(
        private readonly leadRepositoryService: LeadRepositoryService,
        private readonly validator: LeadValidatorService,
        private readonly usersService: UsersService,
        private readonly transformer: LeadTransformerService,
    ) {}

    async create(createLeadDto: any, reqUser: User): Promise<Lead> {
        const user = await this.usersService.findOne(reqUser.userID)

        if (!user.userCompany) {
            throw new ConflictException('User must belong to a company to create leads.');
        }

        await this.validator.validateUniquePhoneInCompany(createLeadDto.phoneNumber, reqUser.userCompany);

        const searchableName = this.transformer.generateSearchableName(createLeadDto.name)

        return await this.leadRepositoryService.create({
            ...createLeadDto,
            leadCompany: user.userCompany,
            searchableName,
            attendingUser: user,
        });
    }

    async findAll(): Promise<Lead[]> {
        return await this.leadRepositoryService.findAll();
    }

    async findAllOfMyCompany(companyID: number): Promise<Lead[]> {
        return await this.leadRepositoryService.findAllCompanyLeads(companyID);
    }

    async findOne(id: number, reqUser: User): Promise<Lead> {
        const lead = await this.leadRepositoryService.findById(id, ['attendingUser']);
        const managers = await this.usersService.findAllManagersOfUser(lead.attendingUser);
        console.log(managers);
        const allowedUsers = [...managers, lead.attendingUser];

        await this.validator.validateLeadsAccess(allowedUsers, reqUser);

        return lead;
    }

    async update(ids: Record<string, any>, updateLeadDto: any): Promise<Lead> {
        const userToUpdate = await this.leadRepositoryService.findById(ids.userToUpdate, ['userCompany']);
        const reqUser = await this.leadRepositoryService.findById(ids.reqUser, ['userCompany']);

        if (!userToUpdate || !reqUser) {
            throw new NotFoundException('User not found');
        }

        if (updateLeadDto.name) {
            updateLeadDto['searchableName'] = this
            .transformer
            .generateSearchableName(updateLeadDto.name);
        }

        Object.assign(userToUpdate, updateLeadDto);
        return this.leadRepositoryService.save(userToUpdate);
    }

    async disable(id: number, reqUser: User): Promise<Lead> {
        const lead = await this.leadRepositoryService.findById(id, ['leadCompany']);

        if (lead.enabled == false) {
            return lead;
        }

        lead.enabled = false;
        return this.leadRepositoryService.save(lead);
    }

    async enable(id: number, reqUser: User): Promise<Lead> {
        const lead = await this.leadRepositoryService.findById(id, ['leadCompany']);

        if (lead.enabled == true) {
            return lead;
        }

        lead.enabled = true;
        return this.leadRepositoryService.save(lead);
    }

    async doNotCallTrue(id: number, reqUser: User): Promise<Lead> {
        const lead = await this.leadRepositoryService.findById(id, ['leadCompany']);

        if (lead.doNotContact == true) {
            return lead;
        }

        lead.doNotContact = true;
        return this.leadRepositoryService.save(lead);
    }

    async remove(id: number, reqUser: User): Promise<void> {
        const lead = await this.leadRepositoryService.findById(id, ['leadCompany']);
        
        await this.leadRepositoryService.remove(lead);
    }
}
