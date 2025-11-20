import { ConflictException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException, Query, UnauthorizedException } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Company } from './entities/company.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class CompaniesService {
    constructor(
        @InjectRepository(Company)
        private readonly companyRepository: Repository<Company>,

        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}


    async create(reqUser: Partial<User>, createCompanyDto: CreateCompanyDto): Promise<Company> {
        const existingCompany = await this.companyRepository.findOne({
            where: [
                { name: createCompanyDto.name },
                { nationalDocument: createCompanyDto.nationalDocument },
                { phoneNumber: createCompanyDto.phoneNumber },
                { email: createCompanyDto.email }
            ]
        })

        if (existingCompany) {
            throw new ConflictException('Company with this name, document, phoneNumber or email already exists')
        }

        if (!reqUser || !reqUser.userID) {
            throw new NotFoundException('User not found. Please logout, then login again.')
        }

        const user = await this.userRepository.findOne({
            where: { userID: reqUser.userID }
        });

        if (!user) {
            throw new NotFoundException('User not found. Please logout, then login again. 2000X')
        }

        if (user.userCompany) {
            throw new ConflictException('You already have a company. If you are sure creating this, delete the current company so.')
        }

        const newCompany = this.companyRepository.create({
            ...createCompanyDto,
            owner: user
        })

        const savedCompany = await this.companyRepository.save(newCompany);

        user.userCompany = savedCompany;
        await this.userRepository.save(user);

        return savedCompany
    }

    async findAll(): Promise<Company[]> {
        return await this.companyRepository.find({
            order: { createdAt: 'DESC' },
            relations: ['owner', 'assistants', 'agents']
        })
    }

    async findOne(id: number): Promise<Company> {
        const company = await this.companyRepository.findOne({
            where: { companyID: id },
            relations: ['owner', 'assistants', 'agents']
        })

        if (!company) {
            throw new ConflictException(`Company with id ${id} not found`)
        }

        return company
    }

    async update(ids: Record<string, any>, updateCompanyDto: UpdateCompanyDto): Promise<Company> {
        const company = await this.findOne(ids.companyID);

        if (updateCompanyDto.name || updateCompanyDto.email || updateCompanyDto.nationalDocument || updateCompanyDto.phoneNumber) {
            const conflictCompany = await this.companyRepository.findOne({
                where: [
                    updateCompanyDto.name ? { name: updateCompanyDto.name } : {},
                    updateCompanyDto.email ? { email: updateCompanyDto.email } : {},
                    updateCompanyDto.nationalDocument ? { nationalDocument: updateCompanyDto.nationalDocument } : {},
                    updateCompanyDto.phoneNumber ? { phoneNumber: updateCompanyDto.phoneNumber } : {},
                ]
            });

        if (conflictCompany && conflictCompany.companyID !== ids.companyID) {
            throw new ConflictException('User with this name, email, document, or phone already exists');
            }
        }

        if (updateCompanyDto.signPlan && company.signPlan !== updateCompanyDto.signPlan) {
            throw new ConflictException(`You can't update your plan here. Please go to 'companies/sign-plan'.`)
        }

        Object.assign(company, updateCompanyDto);
        return await this.companyRepository.save(company);
    }

    async remove(ids: Record<string, any>): Promise<void> {
        console.log(ids)
        const user = await this.userRepository.findOne({
            where: { userID: 1 }
        })
        
        if (!user) {
            throw new NotFoundException(`User not found.`)
        }

        const company = await this.findOne(ids.companyID)
        await this.companyRepository.remove(company)

    }

    async softDelete(id: number): Promise<Company> {
        const company = await this.findOne(id)
        company.enabled = false
        return await this.companyRepository.save(company)
    }

    async restore(id: number): Promise<Company> {
        const company = await this.findOne(id)
        company.enabled = true
        return await this.companyRepository.save(company)
    }

    async signPlan(id: number, updateCompanyDto: UpdateCompanyDto): Promise<Company> {
        const company = await this.findOne(id)

        if (!updateCompanyDto.signPlan) {
            throw new ForbiddenException('Update plan must have one of the options.')
        }

        company.signPlan = updateCompanyDto.signPlan
        return this.companyRepository.save(company)
    }

}
