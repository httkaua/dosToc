import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { LeadRepositoryService } from './services/lead-repository.service';
import { LeadValidatorService } from './services/lead-validator.service';
import { User } from 'src/users/entities/user.entity';
import { Lead } from './entities/lead.entity';
import { UserValidatorService } from 'src/users/services/user-validator.service';
import { LeadTransformerService } from './services/lead-transformer.service';
import { UsersService } from 'src/users/users.service';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { CreateLeadDto } from './dto/create-lead.dto';

@Injectable()
export class LeadsService {
    constructor(
        private readonly leadRepositoryService: LeadRepositoryService,
        private readonly validator: LeadValidatorService,
        private readonly usersService: UsersService,
        private readonly transformer: LeadTransformerService,
    ) {}

    async create(createLeadDto: CreateLeadDto, reqUser: User): Promise<Lead> {
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

    async findAll(relations: string[]): Promise<Lead[]> {
        return await this.leadRepositoryService.findAll(relations);
    }

    async findAllOfMyCompany(userID: number, relations: string[]): Promise<Lead[]> {
        const user = await this.usersService.findOne(userID)
        const companyID = user.userCompany.companyID

        if (!companyID) {
            throw new NotFoundException('Company not found.')
        }

        return await this.leadRepositoryService.findAllCompanyLeads(companyID, relations);
    }

    async findAllOfUser(userID: number, relations: string[]): Promise<Lead[]> {
        const user = await this.usersService.findOne(userID)
        const companyID = user.userCompany.companyID

        if (!companyID) {
            throw new NotFoundException('Company not found.')
        }

        return await this.leadRepositoryService.findAllUserLeads(user.userID, relations);
    }

    async findOne(id: number, reqUser: User): Promise<Lead> {
        const lead = await this.leadRepositoryService.findById(id, ['attendingUser']);

        if (!lead) {
            throw new NotFoundException(`Lead ${id} not found`)
        }

        const managers = await this.usersService.findAllManagersOfUser(lead.attendingUser);
        const allowedUsers = [...managers, lead.attendingUser];

        await this.usersService.validateAccessToAllowedUsers(allowedUsers, reqUser);

        return lead;
    }

    async update(ids: Record<string, any>, updateLeadDto: UpdateLeadDto): Promise<Lead> {
        const leadToUpdate = await this.leadRepositoryService.findById(ids.leadID, ['leadCompany', 'attendingUser']);
        const reqUser = await this.usersService.findOne(ids.reqUser);

        if (!reqUser) {
            throw new NotFoundException('User not found');
        }

        if (!leadToUpdate) {
            throw new NotFoundException(`Lead ${ids.leadID} not found`);
        }

        const managers = await this.usersService.findAllManagersOfUser(leadToUpdate.attendingUser);
        const allowedUsers = [...managers, leadToUpdate.attendingUser];

        await this.usersService.validateAccessToAllowedUsers(allowedUsers, reqUser);

        if (updateLeadDto.name) {
            updateLeadDto['searchableName'] = this
            .transformer
            .generateSearchableName(updateLeadDto.name);
        }

        Object.assign(leadToUpdate, updateLeadDto);
        return this.leadRepositoryService.save(leadToUpdate);
    }

    async disable(id: number, reqUser: User): Promise<Lead> {
        const lead = await this.leadRepositoryService.findById(id, ['leadCompany', 'attendingUser']);

        if (!lead) {
            throw new NotFoundException(`Lead ${id} not found`)
        }

        if (lead.enabled == false) {
            return lead;
        }

        const managers = await this.usersService.findAllManagersOfUser(lead.attendingUser);
        const allowedUsers = [...managers, lead.attendingUser];

        await this.usersService.validateAccessToAllowedUsers(allowedUsers, reqUser);

        lead.enabled = false;
        return this.leadRepositoryService.save(lead);
    }

    async enable(id: number, reqUser: User): Promise<Lead> {
        const lead = await this.leadRepositoryService.findById(id, ['leadCompany', 'attendingUser']);

        if (!lead) {
            throw new NotFoundException(`Lead ${id} not found`)
        }

        if (lead.enabled == true) {
            return lead;
        }

        const managers = await this.usersService.findAllManagersOfUser(lead.attendingUser);
        const allowedUsers = [...managers, lead.attendingUser];

        await this.usersService.validateAccessToAllowedUsers(allowedUsers, reqUser);

        lead.enabled = true;
        return this.leadRepositoryService.save(lead);
    }

    async doNotCallTrue(id: number, reqUser: User): Promise<Lead> {
        const lead = await this.leadRepositoryService.findById(id, ['leadCompany', 'attendingUser']);

        if (!lead) {
            throw new NotFoundException(`Lead ${id} not found`)
        }

        if (lead.doNotContact == true) {
            return lead;
        }

        const managers = await this.usersService.findAllManagersOfUser(lead.attendingUser);
        const allowedUsers = [...managers, lead.attendingUser];

        await this.usersService.validateAccessToAllowedUsers(allowedUsers, reqUser);

        lead.doNotContact = true;
        return this.leadRepositoryService.save(lead);
    }

    async doNotCallFalse(id: number, reqUser: User): Promise<Lead> {
        const lead = await this.leadRepositoryService.findById(id, ['leadCompany', 'attendingUser']);

        if (!lead) {
            throw new NotFoundException(`Lead ${id} not found`)
        }

        if (lead.doNotContact == false) {
            return lead;
        }

        const managers = await this.usersService.findAllManagersOfUser(lead.attendingUser);
        const allowedUsers = [...managers, lead.attendingUser];

        await this.usersService.validateAccessToAllowedUsers(allowedUsers, reqUser);

        lead.doNotContact = false;
        return this.leadRepositoryService.save(lead);
    }

    async remove(id: number, reqUser: User): Promise<void> {
        const lead = await this.leadRepositoryService.findById(id, ['leadCompany', 'attendingUser']);

        if (!lead) {
            throw new NotFoundException(`Lead ${id} not found`)
        }

        const managers = await this.usersService.findAllManagersOfUser(lead.attendingUser);
        const allowedUsers = [...managers, lead.attendingUser];

        await this.usersService.validateAccessToAllowedUsers(allowedUsers, reqUser);
        
        await this.leadRepositoryService.remove(lead);
    }
}
