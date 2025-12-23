import { ConflictException, ForbiddenException, Inject, Injectable, InternalServerErrorException, NotFoundException, Query, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './entities/company.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { User } from 'src/users/entities/user.entity';
import { CompanyValidatorService } from './services/company-validator.service';
import { CompanyRepositoryService } from './services/company-repository.service';
import { ResponseCompanyDto } from './dto/response-company.dto';
import type { LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { UsersService } from 'src/users/users.service';
import { Role } from  '../rbac/role.enum'

@Injectable()
export class CompaniesService {
    constructor(
        private readonly validator: CompanyValidatorService,
        private readonly repository: CompanyRepositoryService,

        @Inject(WINSTON_MODULE_NEST_PROVIDER)
        private readonly logger: LoggerService,

        @InjectRepository(User)
        private readonly usersService: UsersService,
    ) {}

    async create(reqUser: Partial<User>, createCompanyDto: CreateCompanyDto): Promise<Company> {
        if (this.logger.debug) {
            this.logger.debug(`Creating company: ${createCompanyDto.email}`, 'Companies Service');
        }

        if (!reqUser || !reqUser.userID) {
            this.logger.warn(`Invalid attempt to create company without creator user set. userID: ${reqUser.userID}`, 'Companies Service');
            throw new ForbiddenException('User forbidden. Please logout, then login again.')
        }

        await this.validator.validateUniqueCompany(createCompanyDto);

        const user = await this.usersService.findOne(reqUser.userID);

        if (!user) {
            this.logger.warn(`Invalid attempt to create company with creator user not found. userID: ${reqUser.userID}`, 'Companies Service');
            throw new NotFoundException('User not found. Please logout, then login again.')
        }

        if (user.userCompany || user.underManagement.length > 0) {
            this.logger.warn(`Invalid attempt to create company with creator user that currently have a company or subordinates. userID: ${reqUser.userID}`, 'Companies Service');
            throw new ConflictException('You already have a company or subordinates. If you are sure creating this, at first redistribute your employees.')
        }

        const newCompany = this.repository.create(createCompanyDto, user)

        const savedCompany = await this.repository.save(await newCompany);

        user.userCompany = savedCompany;
        await this.usersService.save(user);
        this.logger.log(`Company created successfully: compantID: ${savedCompany.companyID}`, 'Companies Service');

        return savedCompany
    }

    async findAll(): Promise<ResponseCompanyDto[]> {
        if (this.logger.debug) {
            this.logger.debug(`Function called: findAll`, 'Companies Service');
        }

        const companies = await this.repository.findAll(['supervisors', 'assistants', 'agents'])

        if (!companies || companies.length === 0) {
            this.logger.warn('No companies found');
            throw new NotFoundException('Companies not found', 'Companies Service');
        }

        this.logger.log('Companies found', 'Companies Service');
        return companies
    }

    async findOne(id: number): Promise<Company> {
        if (this.logger.debug) {
            this.logger.debug(`Function called: findOne`, 'Companies Service');
        }

        const company = await this.repository.findById(id, ['supervisors', 'agents', 'assistants']);

        if (!company) {
            this.logger.warn(`Company not found: ${id}`);
            throw new NotFoundException(`Company with ID ${id} not found.`)
        }

        this.logger.log(`User found: ${id}`, 'Users Service');
        return company
    }

    async update(ids: Record<string, any>, updateCompanyDto: UpdateCompanyDto): Promise<Company> {
        if (this.logger.debug) {
            this.logger.debug(`Updating company: ${ids.companyID}`, 'Companies Service');
        }
        const company = await this.repository.findById(ids.companyID, ['supervisors', 'agents', 'assistants']);

        if (updateCompanyDto.name || updateCompanyDto.email || updateCompanyDto.nationalDocument || updateCompanyDto.phoneNumber) {
            await this.validator.validateUniqueCompany(updateCompanyDto);
        }

        this.validator.validateSignPlanNotChanged(updateCompanyDto);
        this.validator.validateMembersNotChanged(updateCompanyDto);

        Object.assign(company, updateCompanyDto);
        this.logger.log(`Company updated successfully: ${company.companyID}`, 'Companies Service');
        return await this.repository.save(company);
    }

    async signPlan(id: number, newPlan: string): Promise<Company> {
        if (this.logger.debug) {
            this.logger.debug(`Company signing plan: ${id}`, 'Companies Service');
        }
        const company = await this.findOne(id)

        if (newPlan !== 'FREE' && newPlan !== 'SINGLE' && newPlan !== 'BUSINESS') {
            this.logger.warn(`Invalid attempt to set an invalid plan option: ${newPlan}`, 'Companies Service')
            throw new ForbiddenException('Update plan must have one of the options.')
        }

        company.signPlan = newPlan
        this.repository.save(company)

        this.logger.log(`Company plan updated successfully: ${company.companyID}`, 'Companies Service');
        return company
    }

    async assignMemberToPosition(ids: Record<string, any>, targetUserClassification: number): Promise<void> {
        if (this.logger.debug) {
            this.logger.debug(`Assigning member to position: userID: ${ids.targetUser}, new userClassification: ${Role[targetUserClassification]}`, 'Companies Service')
        }
        if (!ids.reqUser || !ids.targetUser || !ids.companyID) {
            this.logger.warn(`Invalid attempt to assign member to a new position, forbidden id. reqUser: ${ids.reqUser}, targetUser: ${ids.targetUser}, companyID: ${ids.companyID}, `, 'Companies Service')
            throw new ForbiddenException('User forbidden. Please logout, then login again.')
        }

        const company = await this.repository.findById(ids.companyID, ['supervisors', 'agents', 'assistants'])

        if (targetUserClassification < 4 || targetUserClassification > 6) {
            this.logger.warn(`Invalid attempt to assign member to a new position. The new classification is not valid in the context. ${Role[targetUserClassification]}`, 'Companies Service')
            throw new ForbiddenException('Only supervisors, assistants and agents can be assigned to position.')
        }

        const userToAssign = await this.usersService.findOne(ids.targetUser);

        if (!userToAssign) {
            this.logger.warn(`User not found. userID: ${ids.targetUser}`, 'Companies Service')
            throw new NotFoundException('Target user not found.')
        }

        switch (targetUserClassification) {
            case 4:
                if (company.supervisors.some(s => s.userID === ids.targetUser)) {
                    return;
                }
                company.supervisors = [...company.supervisors, userToAssign]
                await this.repository.save(company)
                break;

            case 5:
                if (company.agents.some(s => s.userID === ids.targetUser)) {
                    return;
                }
                company.agents = [...company.agents, userToAssign]
                await this.repository.save(company)
                break;

            case 6:
                if (company.assistants.some(s => s.userID === ids.targetUser)) {
                    return;
                }
                company.assistants = [...company.assistants, userToAssign]
                await this.repository.save(company)
                break;
        }

        this.logger.log(`User assigned successfully: ${ids.targetUser}`, 'Companies Service')
    }

    async unassignMemberToPosition(ids: Record<string, any>, targetUserClassification: number): Promise<void> {
        if (this.logger.debug) {
            this.logger.debug(`Unassigning member to position: userID: ${ids.targetUser}, new userClassification: ${Role[targetUserClassification]}`, 'Companies Service')
        }
        if (!ids.reqUser || !ids.targetUser || !ids.companyID) {
            this.logger.warn(`Invalid attempt to assign member to a new position, forbidden id. reqUser: ${ids.reqUser}, targetUser: ${ids.targetUser}, companyID: ${ids.companyID}, `, 'Companies Service')
            throw new ForbiddenException('User forbidden. Please logout, then login again.')
        }

        const company = await this.repository.findById(ids.companyID, ['supervisors', 'agents', 'assistants']);

        if (targetUserClassification < 5 || targetUserClassification > 6) {
            this.logger.warn(`Invalid attempt to assign member to a new position. The new classification is not valid in the context. ${Role[targetUserClassification]}`, 'Companies Service')
            throw new ForbiddenException('Only assistants and agents can be unassigned to position.')
        }

        const userToUnassign = await this.usersService.findOne(ids.targetUser);

        if (!userToUnassign) {
            this.logger.warn(`User not found. userID: ${ids.targetUser}`, 'Companies Service')
            throw new NotFoundException('Target user not found.')
        }

        switch (targetUserClassification) {
            case 5:
                if (!company.agents.some(s => s.userID === ids.targetUser)) {
                    return;
                }
                company.agents = company.agents.filter(f => f.userID !== ids.targetUser)
                await this.repository.save(company)
                break;

            case 6:
                if (!company.assistants.some(s => s.userID === ids.targetUser)) {
                    return;
                }
                company.assistants = company.assistants.filter(f => f.userID !== ids.targetUser)
                await this.repository.save(company)
                break;
        }

        this.logger.log(`User unassigned successfully: ${ids.targetUser}`, 'Companies Service')
    }

    async validateSupervisorToDeleteUser(user: User, company: Company): Promise<void> {
        if (this.logger.debug) {
            this.logger.debug(`Function called: validateSupervisorToDeleteUser`, 'Companies Service')
        }

        this.validator.validateSupervisorToDeleteUser(user, company)
    }

    async validateSupervisorToChangeQueueOrder(user: User, company: Company): Promise<void> {
        if (this.logger.debug) {
            this.logger.debug(`Function called: validateSupervisorToChangeQueueOrder`, 'Companies Service')
        }

        this.validator.validateSupervisorToChangeQueueOrder(user, company)
    }

    async validateAgentToCreateRealEstate(user: User, company: Company): Promise<void> {
        if (this.logger.debug) {
            this.logger.debug(`Function called: validateAgentToCreateRealEstate`, 'Companies Service')
        }

        this.validator.validateAgentToCreateRealEstate(user, company)
    }

    async validateAgentToDeleteRealEstate(user: User, company: Company): Promise<void> {
        if (this.logger.debug) {
            this.logger.debug(`Function called: validateAgentToDeleteRealEstate`, 'Companies Service')
        }

        this.validator.validateAgentToDeleteRealEstate(user, company)
    }

    async validateAssistantToCreateRealEstate(user: User, company: Company): Promise<void> {
        if (this.logger.debug) {
            this.logger.debug(`Function called: validateAssistantToCreateRealEstate`, 'Companies Service')
        }

        this.validator.validateAssistantToCreateRealEstate(user, company)
    }

    async validateAssistantToDeleteRealEstate(user: User, company: Company): Promise<void> {
        if (this.logger.debug) {
            this.logger.debug(`Function called: validateAssistantToDeleteRealEstate`, 'Companies Service')
        }

        this.validator.validateAssistantToDeleteRealEstate(user, company)
    }

}
