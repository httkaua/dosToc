import { ConflictException, Injectable } from "@nestjs/common";
import { CreateCompanyDto } from "../dto/create-company.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Company } from "../entities/company.entity";
import { Repository } from "typeorm";
import { UpdateCompanyDto } from "../dto/update-company.dto";


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

}