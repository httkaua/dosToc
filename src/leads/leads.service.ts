import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { LeadRepositoryService } from './services/lead-repository.service';
import { LeadValidatorService } from './services/lead-validator.service';
import { User } from 'src/users/entities/user.entity';
import { Lead } from './entities/lead.entity';
import { LeadTransformerService } from './services/lead-transformer.service';
import { UsersService } from 'src/users/users.service';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { CreateLeadDto } from './dto/create-lead.dto';
import type { LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Injectable()
export class LeadsService {
    constructor(
        @Inject(WINSTON_MODULE_NEST_PROVIDER)
        private readonly logger: LoggerService,
        
        private readonly leadRepositoryService: LeadRepositoryService,
        private readonly validator: LeadValidatorService,
        private readonly usersService: UsersService,
        private readonly transformer: LeadTransformerService,
    ) {}

    async create(createLeadDto: CreateLeadDto, reqUser: User): Promise<Lead> {
        if (this.logger.debug) {
            this.logger.debug(`Creating lead: ${createLeadDto.email}`, 'Leads Service')
        }
        const user = await this.usersService.findOne(reqUser.userID)

        if (!user.userCompany) {
            this.logger.warn(`Invalid attempt to create lead with a creator user without a company. userID: ${reqUser.userID}, userCompany: ${user.userCompany}`, 'Leads Service')
            throw new ConflictException('User must belong to a company to create leads.')
        }

        await this.validator.validateUniquePhoneInCompany(createLeadDto.phoneNumber, reqUser.userCompany)

        const searchableName = this.transformer.generateSearchableName(createLeadDto.name)

        const lead = await this.leadRepositoryService.create({
            ...createLeadDto,
            leadCompany: user.userCompany,
            searchableName,
            attendingUser: user,
        })

        this.logger.log(`Lead created successfully: leadID: ${lead.leadID}`, 'Leads Service')
        return lead;
    }

    async findAll(relations: string[]): Promise<Lead[]> {
        if (this.logger.debug) {
            this.logger.debug(`Function called: findAll`, 'Leads Service');
        }

        const companies = await this.leadRepositoryService.findAll(relations)
        return companies;
    }

    async findAllOfMyCompany(userID: number, relations: string[]): Promise<Lead[]> {
        if (this.logger.debug) {
            this.logger.debug(`Function called: findAllOfMyCompany`, 'Leads Service');
        }
        const user = await this.usersService.findOne(userID)
        const companyID = user.userCompany.companyID

        if (!companyID) {
            this.logger.warn(`User company not found. userCompany: ${user.userCompany}`, 'Leads Service')
            throw new NotFoundException('Company not found.')
        }

        const leads = await this.leadRepositoryService.findAllCompanyLeads(companyID, relations)
        return leads;
    }

    async findAllOfUser(userID: number, relations: string[]): Promise<Lead[]> {
        if (this.logger.debug) {
            this.logger.debug(`Function called: findAllOfUser`, 'Leads Service');
        }
        const user = await this.usersService.findOne(userID)
        const companyID = user.userCompany.companyID

        if (!companyID) {
            this.logger.warn(`User company not found. userCompany: ${user.userCompany}`, 'Leads Service')
            throw new NotFoundException('Company not found.')
        }

        const leads = await this.leadRepositoryService.findAllUserLeads(user.userID, relations)
        return leads;
    }

    async findOne(id: number, reqUser: User): Promise<Lead> {
        if (this.logger.debug) {
            this.logger.debug(`Function called: findOne`, 'Leads Service')
        }
        const lead = await this.leadRepositoryService.findById(id, ['attendingUser'])

        if (!lead) {
            this.logger.warn(`Lead not found: ${id}`, 'Leads Service')
            throw new NotFoundException(`Lead ${id} not found`)
        }

        const managers = await this.usersService.findAllManagersOfUser(lead.attendingUser)
        const allowedUsers = [...managers, lead.attendingUser]

        await this.usersService.validateAccessToAllowedUsers(allowedUsers, reqUser)
        return lead;
    }

    async update(ids: Record<string, any>, updateLeadDto: UpdateLeadDto): Promise<Lead> {
        if (this.logger.debug) {
            this.logger.debug(`Updating lead: ${ids.leadID}`, 'Leads Service')
        }
        const leadToUpdate = await this.leadRepositoryService.findById(ids.leadID, ['leadCompany', 'attendingUser']);
        const reqUser = await this.usersService.findOne(ids.reqUser);

        if (!reqUser) {
            this.logger.warn(`User not found: ${ids.reqUser}`, 'Leads Service')
            throw new NotFoundException('User not found');
        }

        if (!leadToUpdate) {
            this.logger.warn(`Lead not found: ${ids.leadID}`, 'Leads Service')
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

        Object.assign(leadToUpdate, updateLeadDto)
        this.logger.log(`Lead updated successfully: ${leadToUpdate.leadID}`, 'Leads Service')
        return this.leadRepositoryService.save(leadToUpdate)
    }

    async disable(id: number, reqUser: User): Promise<Lead> {
        if (this.logger.debug) {
            this.logger.debug(`Disabling lead: ${id}`, 'Leads Service')
        }
        const lead = await this.leadRepositoryService.findById(id, ['leadCompany', 'attendingUser'])

        if (!lead) {
            this.logger.warn(`Lead not found: ${id}`, 'Leads Service')
            throw new NotFoundException(`Lead ${id} not found`);
        }

        if (lead.enabled == false) {
            this.logger.log(`Lead already disabled: ${id}`, 'Leads Service')
            return lead;
        }

        const managers = await this.usersService.findAllManagersOfUser(lead.attendingUser)
        const allowedUsers = [...managers, lead.attendingUser]

        await this.usersService.validateAccessToAllowedUsers(allowedUsers, reqUser)

        lead.enabled = false
        this.logger.log(`Lead disabled successfully: ${lead.leadID}`, 'Leads Service')
        return this.leadRepositoryService.save(lead);
    }

    async enable(id: number, reqUser: User): Promise<Lead> {
        if (this.logger.debug) {
            this.logger.debug(`Enabling lead: ${id}`, 'Leads Service')
        }
        const lead = await this.leadRepositoryService.findById(id, ['leadCompany', 'attendingUser'])

        if (!lead) {
            this.logger.warn(`Lead not found: ${id}`, 'Leads Service')
            throw new NotFoundException(`Lead ${id} not found`)
        }

        if (lead.enabled == true) {
            this.logger.log(`Lead already disabled: ${id}`, 'Leads Service')
            return lead;
        }

        const managers = await this.usersService.findAllManagersOfUser(lead.attendingUser)
        const allowedUsers = [...managers, lead.attendingUser]

        await this.usersService.validateAccessToAllowedUsers(allowedUsers, reqUser)

        lead.enabled = true
        this.logger.log(`Lead enabled successfully: ${lead.leadID}`, 'Leads Service')
        return this.leadRepositoryService.save(lead);
    }

    async doNotCallTrue(id: number, reqUser: User): Promise<Lead> {
        if (this.logger.debug) {
            this.logger.debug(`Setting doNotContact to true for the lead: ${id}`, 'Leads Service')
        }
        const lead = await this.leadRepositoryService.findById(id, ['leadCompany', 'attendingUser']);

        if (!lead) {
            this.logger.warn(`Lead not found: ${id}`, 'Leads Service')
            throw new NotFoundException(`Lead ${id} not found`)
        }

        if (lead.doNotContact == true) {
            this.logger.log(`Lead already doNotContact set true: ${id}`, 'Leads Service')
            return lead;
        }

        const managers = await this.usersService.findAllManagersOfUser(lead.attendingUser);
        const allowedUsers = [...managers, lead.attendingUser];

        await this.usersService.validateAccessToAllowedUsers(allowedUsers, reqUser);

        lead.doNotContact = true;
        this.logger.log(`Lead doNotContact set to true successfully: ${lead.leadID}`, 'Leads Service')
        return this.leadRepositoryService.save(lead);
    }

    async doNotCallFalse(id: number, reqUser: User): Promise<Lead> {
        if (this.logger.debug) {
            this.logger.debug(`Setting doNotContact to false for the lead: ${id}`, 'Leads Service')
        }
        const lead = await this.leadRepositoryService.findById(id, ['leadCompany', 'attendingUser'])

        if (!lead) {
            this.logger.warn(`Lead not found: ${id}`, 'Leads Service')
            throw new NotFoundException(`Lead ${id} not found`);
        }

        if (lead.doNotContact == false) {
            this.logger.log(`Lead already doNotContact set false: ${id}`, 'Leads Service')
            return lead;
        }

        const managers = await this.usersService.findAllManagersOfUser(lead.attendingUser)
        const allowedUsers = [...managers, lead.attendingUser]

        await this.usersService.validateAccessToAllowedUsers(allowedUsers, reqUser)

        lead.doNotContact = false
        this.logger.log(`Lead doNotContact set to false successfully: ${lead.leadID}`, 'Leads Service')
        return this.leadRepositoryService.save(lead);
    }

    async remove(id: number, reqUser: User): Promise<void> {
        if (this.logger.debug) {
            this.logger.debug(`Removing lead: ${id}`, 'Leads Service')
        }
        const lead = await this.leadRepositoryService.findById(id, ['leadCompany', 'attendingUser'])

        if (!lead) {
            this.logger.warn(`Lead not found: ${id}`, 'Leads Service')
            throw new NotFoundException(`Lead ${id} not found`)
        }

        const managers = await this.usersService.findAllManagersOfUser(lead.attendingUser)
        const allowedUsers = [...managers, lead.attendingUser]

        await this.usersService.validateAccessToAllowedUsers(allowedUsers, reqUser)
        await this.leadRepositoryService.remove(lead)
        this.logger.log(`Lead removed successfully: ${lead.leadID}`, 'Leads Service');
    }
}
