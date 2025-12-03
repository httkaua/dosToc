import { ConflictException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException, Query, UnauthorizedException } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Company } from './entities/company.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { User } from 'src/users/entities/user.entity';
import { CompanyValidatorService } from './services/company-validator.service';
import { CompanyRepositoryService } from './services/company-repository.service';
import { ResponseCompanyDto } from './dto/response-company.dto';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class CompaniesService {
    constructor(
        private readonly validator: CompanyValidatorService,
        private readonly companyRepositoryService: CompanyRepositoryService,

        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

    async create(reqUser: Partial<User>, createCompanyDto: CreateCompanyDto): Promise<Company> {

        if (!reqUser || !reqUser.userID) {
            throw new ForbiddenException('User forbidden. Please logout, then login again.')
        }

        await this.validator.validateUniqueCompany(createCompanyDto);

        const user = await this.userRepository.findOne({
            where: { userID: reqUser.userID },
            relations: ['userCompany', 'underManagement']
        });

        if (!user) {
            throw new NotFoundException('User not found. Please logout, then login again.')
        }

        if (user.userCompany || user.underManagement.length > 0) {
            throw new ConflictException('You already have a company or subordinates. If you are sure creating this, at first redistribute your employees.')
        }

        const newCompany = this.companyRepositoryService.create(createCompanyDto, user)

        const savedCompany = await this.companyRepositoryService.save(await newCompany);

        user.userCompany = savedCompany;
        await this.userRepository.save(user);

        return savedCompany
    }

    async findAll(): Promise<ResponseCompanyDto[]> {
        return await this.companyRepositoryService.findAll(['supervisors', 'assistants', 'agents'])
    }

    async findOne(id: number): Promise<Company> {
        const company = await this.companyRepositoryService.findById(id, ['supervisors', 'agents', 'assistants']);

        if (!company) {
            throw new NotFoundException(`Company with ID ${id} not found.`)
        }

        return company
    }

    async update(ids: Record<string, any>, updateCompanyDto: UpdateCompanyDto): Promise<Company> {
        const company = await this.companyRepositoryService.findById(ids.companyID, ['supervisors', 'agents', 'assistants']);

        if (updateCompanyDto.name || updateCompanyDto.email || updateCompanyDto.nationalDocument || updateCompanyDto.phoneNumber) {
            await this.validator.validateUniqueCompany({...updateCompanyDto} as CreateCompanyDto);
        }

        this.validator.validateSignPlanNotChanged(updateCompanyDto);
        this.validator.validateMembersNotChanged(updateCompanyDto);

        Object.assign(company, updateCompanyDto);
        return await this.companyRepositoryService.save(company);
    }

    async signPlan(id: number, newPlan: string): Promise<Company> {
        const company = await this.findOne(id)

        if (newPlan !== 'FREE' && newPlan !== 'SINGLE' && newPlan !== 'BUSINESS') {
            throw new ForbiddenException('Update plan must have one of the options.')
        }

        company.signPlan = newPlan
        return this.companyRepositoryService.save(company)
    }

    async assignMemberToPosition(ids: Record<string, any>, targetUserClassification: number): Promise<void> {
        if (!ids.reqUser || !ids.targetUser || !ids.companyID) {
            throw new ForbiddenException('User forbidden. Please logout, then login again.')
        }

        const company = await this.companyRepositoryService.findById(ids.companyID, ['supervisors', 'agents', 'assistants']);

        if (targetUserClassification < 4 || targetUserClassification > 6) {
            throw new ForbiddenException('Only supervisors, assistants and agents can be assigned to position.')
        }

        const userToAssign = await this.userRepository.findOne({
            where: { userID: ids.targetUser }
        });

        if (!userToAssign) {
            throw new NotFoundException('Target user not found.')
        }

        switch (targetUserClassification) {
            case 4:
                if (company.supervisors.some(s => s.userID === ids.targetUser)) {
                    return;
                }
                company.supervisors = [...company.supervisors, userToAssign];
                await this.companyRepositoryService.save(company);
                break;

            case 5:
                if (company.agents.some(s => s.userID === ids.targetUser)) {
                    return;
                }
                company.agents = [...company.agents, userToAssign];
                await this.companyRepositoryService.save(company);
                break;

            case 6:
                if (company.assistants.some(s => s.userID === ids.targetUser)) {
                    return;
                }
                company.assistants = [...company.assistants, userToAssign];
                await this.companyRepositoryService.save(company);
                break;
        }
    }

    async unassignMemberToPosition(ids: Record<string, any>, targetUserClassification: number): Promise<void> {
        if (!ids.reqUser || !ids.targetUser || !ids.companyID) {
            throw new ForbiddenException('User forbidden. Please logout, then login again.')
        }

        const company = await this.companyRepositoryService.findById(ids.companyID, ['supervisors', 'agents', 'assistants']);

        if (targetUserClassification < 5 || targetUserClassification > 6) {
            throw new ForbiddenException('Only assistants and agents can be unassigned to position.')
        }

        const userToUnassign = await this.userRepository.findOne({
            where: { userID: ids.targetUser }
        });

        if (!userToUnassign) {
            throw new NotFoundException('Target user not found.')
        }

        switch (targetUserClassification) {
            case 5:
                if (!company.agents.some(s => s.userID === ids.targetUser)) {
                    return;
                }
                company.agents = company.agents.filter(f => f.userID !== ids.targetUser);
                await this.companyRepositoryService.save(company);
                break;

            case 6:
                if (!company.assistants.some(s => s.userID === ids.targetUser)) {
                    return;
                }
                company.assistants = company.assistants.filter(f => f.userID !== ids.targetUser);
                await this.companyRepositoryService.save(company);
                break;
        }
    }

    async validateSupervisorToDeleteUser(user: User, company: Company): Promise<void> {
        this.validator.validateSupervisorToDeleteUser(user, company)
    }

    async validateSupervisorToChangeQueueOrder(user: User, company: Company): Promise<void> {
        this.validator.validateSupervisorToChangeQueueOrder(user, company)
    }

    async validateAgentToCreateRealEstate(user: User, company: Company): Promise<void> {
        this.validator.validateAgentToCreateRealEstate(user, company)
    }

    async validateAgentToDeleteRealEstate(user: User, company: Company): Promise<void> {
        this.validator.validateAgentToDeleteRealEstate(user, company)
    }

    async validateAssistantToCreateRealEstate(user: User, company: Company): Promise<void> {
        this.validator.validateAssistantToCreateRealEstate(user, company)
    }

    async validateAssistantToDeleteRealEstate(user: User, company: Company): Promise<void> {
        this.validator.validateAssistantToDeleteRealEstate(user, company)
    }

}
