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

@Injectable()
export class CompaniesService {
    constructor(
        @InjectRepository(Company)
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

        const newCompany = this.companyRepositoryService.create({
            ...createCompanyDto,
            owner: user
        })

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

    async signPlan(id: number, updateCompanyDto: UpdateCompanyDto): Promise<Company> {
        const company = await this.findOne(id)

        if (!updateCompanyDto.signPlan) {
            throw new ForbiddenException('Update plan must have one of the options.')
        }

        company.signPlan = updateCompanyDto.signPlan
        return this.companyRepositoryService.save(company)
    }

}
