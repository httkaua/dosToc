import { ConflictException, Inject, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { CreateCompanyDto } from "../dto/create-company.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Company } from "../entities/company.entity";
import { Repository } from "typeorm";
import { UpdateCompanyDto } from "../dto/update-company.dto";
import { User } from "src/users/entities/user.entity";
import type { LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";


@Injectable()
export class CompanyValidatorService {
    constructor(
        @InjectRepository(Company)
        private readonly companyRepository: Repository<Company>,

        @Inject(WINSTON_MODULE_NEST_PROVIDER)
        private readonly logger: LoggerService,
    ) {}

    async validateUniqueCompany(dto: CreateCompanyDto | UpdateCompanyDto): Promise<void> {
        const existingCompany = await this.companyRepository.findOne({
            where: [
                { name: dto.name },
                { nationalDocument: dto.nationalDocument },
                { phoneNumber: dto.phoneNumber },
                { email: dto.email }
            ]
        });

        if (existingCompany) {
            this.logger.warn(`Operation closed by validation: Company with this name, document, phoneNumber or email already exists.`, 'Company Validator')
            throw new ConflictException('Company with this name, document, phoneNumber or email already exists');
        }
    }

    async validateCompanyExists(companyID: number): Promise<void> {
        const company = await this.companyRepository.findOne({
            where: { companyID }
        });

        if (!company) {
            this.logger.warn(`Operation closed by validation: Company does not exist.`, 'Company Validator')
            throw new ConflictException('Company does not exist');
        }
    }

    validateSignPlanNotChanged(updateCompanyDto: UpdateCompanyDto): void {
        if (updateCompanyDto.signPlan) {
            this.logger.warn(`Operation closed by validation: Changing signPlan through this route is not allowed.`, 'Company Validator')
            throw new ConflictException('Changing signPlan through this route is not allowed');
        }
    }

    validateMembersNotChanged(updateCompanyDto: UpdateCompanyDto): void {
        if (updateCompanyDto.assistants || updateCompanyDto.agents || updateCompanyDto.assistants) {
            this.logger.warn(`Operation closed by validation: Changing members through this route is not allowed.`, 'Company Validator')
            throw new ConflictException('Changing members through this route is not allowed')
        }
    }

    validateSupervisorToDeleteUser(user: User, company: Company): void {
        if (user.userClassification !== 4) {
            return
        }

        if (!company.supervisorPermissions.deleteUser) {
            this.logger.warn(`Operation closed by validation: Supervisors can't disable, enable or delete users.`, 'Company Validator')
            throw new UnauthorizedException(`Supervisors can't disable, enable or delete users. Please contact your manager.`)
        }
    }

    validateSupervisorToChangeQueueOrder(user: User, company: Company): void {
        if (user.userClassification !== 4) {
            return
        }

        if (!company.supervisorPermissions.deleteUser) {
            this.logger.warn(`Operation closed by validation: Supervisors can't change the queue order.`, 'Company Validator')
            throw new UnauthorizedException(`Supervisors can't change the queue order. Please contact your manager.`)
        }
    }

    validateAgentToCreateRealEstate(user: User, company: Company): void {
        if (user.userClassification !== 5) {
            return
        }

        if (!company.agentPermissions.createRealEstate) {
            this.logger.warn(`Operation closed by validation: Agents can't register real estates.`, 'Company Validator')
            throw new UnauthorizedException(`Agents can't register real estates. Please contact your manager.`)
        }
    }

    validateAgentToDeleteRealEstate(user: User, company: Company): void {
        if (user.userClassification !== 5) {
            return
        }

        if (!company.agentPermissions.deleteRealEstate) {
            this.logger.warn(`Operation closed by validation: Agents can't disable, enable or delete real estates.`, 'Company Validator')
            throw new UnauthorizedException(`Agents can't disable, enable or delete real estates. Please contact your manager.`)
        }
    }

    validateAssistantToCreateRealEstate(user: User, company: Company): void {
        if (user.userClassification !== 6) {
            return
        }

        if (!company.agentPermissions.createRealEstate) {
            this.logger.warn(`Operation closed by validation: Assistants can't register real estates.`, 'Company Validator')
            throw new UnauthorizedException(`Assistants can't register real estates. Please contact your manager.`)
        }
    }

    validateAssistantToDeleteRealEstate(user: User, company: Company): void {
        if (user.userClassification !== 6) {
            return
        }

        if (!company.agentPermissions.deleteRealEstate) {
            this.logger.warn(`Operation closed by validation: Assistants can't disable, enable or delete real estates.`, 'Company Validator')
            throw new UnauthorizedException(`Assistants can't disable, enable or delete real estates. Please contact your manager.`)
        }
    }
}