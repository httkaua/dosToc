import { ConflictException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { CreateCompanyDto } from "../dto/create-company.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Company } from "../entities/company.entity";
import { Repository } from "typeorm";
import { UpdateCompanyDto } from "../dto/update-company.dto";
import { User } from "src/users/entities/user.entity";
import { NotFoundError } from "rxjs";


@Injectable()
export class CompanyValidatorService {
    constructor(
        @InjectRepository(Company)
        private readonly companyRepository: Repository<Company>,
    ) {}

    async validateUniqueCompany(createCompanyDto: CreateCompanyDto): Promise<void> {
        const existingCompany = await this.companyRepository.findOne({
            where: [
                { name: createCompanyDto.name },
                { nationalDocument: createCompanyDto.nationalDocument },
                { phoneNumber: createCompanyDto.phoneNumber },
                { email: createCompanyDto.email }
            ]
        });

        if (existingCompany) {
            throw new ConflictException('Company with this name, document, phoneNumber or email already exists');
        }
    }

    async validateCompanyExists(companyID: number): Promise<void> {
        const company = await this.companyRepository.findOne({
            where: { companyID }
        });

        if (!company) {
            throw new ConflictException('Company does not exist');
        }
    }

    validateSignPlanNotChanged(updateCompanyDto: UpdateCompanyDto): void {
        if (updateCompanyDto.signPlan) {
            throw new ConflictException('Changing signPlan through this route is not allowed');
        }
    }

    validateMembersNotChanged(updateCompanyDto: UpdateCompanyDto): void {
        if (updateCompanyDto.assistants || updateCompanyDto.agents || updateCompanyDto.assistants) {
            throw new ConflictException('Changing members through this route is not allowed');
        }
    }

    validateSupervisorToDeleteUser(user: User, company: Company): void {
        if (user.userClassification !== 4) {
            return
        }

        if (!company.supervisorPermissions.deleteUser) {
            throw new UnauthorizedException(`Supervisors can't disable, enable or delete users. Please contact your manager.`)
        }
    }

    validateSupervisorToChangeQueueOrder(user: User, company: Company): void {
        if (user.userClassification !== 4) {
            return
        }

        if (!company.supervisorPermissions.deleteUser) {
            throw new UnauthorizedException(`Supervisors can't change the queue order. Please contact your manager.`)
        }
    }

    validateAgentToCreateRealEstate(user: User, company: Company): void {
        if (user.userClassification !== 5) {
            return
        }

        if (!company.agentPermissions.createRealEstate) {
            throw new UnauthorizedException(`Agents can't register real estates. Please contact your manager.`)
        }
    }

    validateAgentToDeleteRealEstate(user: User, company: Company): void {
        if (user.userClassification !== 5) {
            return
        }

        if (!company.agentPermissions.deleteRealEstate) {
            throw new UnauthorizedException(`Agents can't disable, enable or delete real estates. Please contact your manager.`)
        }
    }

    validateAssistantToCreateRealEstate(user: User, company: Company): void {
        if (user.userClassification !== 6) {
            return
        }

        if (!company.agentPermissions.createRealEstate) {
            throw new UnauthorizedException(`Assistants can't register real estates. Please contact your manager.`)
        }
    }

    validateAssistantToDeleteRealEstate(user: User, company: Company): void {
        if (user.userClassification !== 6) {
            return
        }

        if (!company.agentPermissions.deleteRealEstate) {
            throw new UnauthorizedException(`Assistants can't disable, enable or delete real estates. Please contact your manager.`)
        }
    }
}