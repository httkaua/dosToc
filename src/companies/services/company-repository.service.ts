import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Company } from "../entities/company.entity";
import { Repository } from "typeorm";
import { CreateCompanyDto } from "../dto/create-company.dto";
import { CompanyValidatorService } from "./company-validator.service";
import { User } from "src/users/entities/user.entity";
import type { LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";

@Injectable()
export class CompanyRepositoryService {
    constructor(
        @InjectRepository(Company)
        private readonly companyRepository: Repository<Company>,
        private readonly validator: CompanyValidatorService,

        @Inject(WINSTON_MODULE_NEST_PROVIDER)
        private readonly logger: LoggerService,
    ) {}

  async findById(id: number, relations: string[]): Promise<Company> {
    const start = Date.now()
    const company = await this.companyRepository.findOne({
      where: { companyID: id },
      relations,
    })

    if (!company) {
      this.logger.warn(`Company not found: ${id}`, 'Companies Repository Service')
      throw new NotFoundException(`Company with ID ${id} not found.`)
    }

    if (this.logger.debug) {
      this.logger.debug(`CompaniesRepository.findById executed, companyID: ${company?.companyID}, relations: ${relations}, durationMs: ${Date.now() - start}`, 'Companies Repository Service')
    }

    return company;
  }

  async findByName(name: string): Promise<Company | null> {
    const start = Date.now()
    const company = await this.companyRepository.findOne({
      where: { name }
    })

    if (this.logger.debug) {
      this.logger.debug(`CompaniesRepository.findByName executed, companyID: ${company?.companyID}, durationMs: ${Date.now() - start}`, 'Companies Repository Service')
    }

    return company
  }

  async findByEmail(email: string): Promise<Company | null> {
    const start = Date.now()
    const company = await this.companyRepository.findOne({
      where: { email },
      select: ['companyID', 'email', 'enabled'],
    })

    if (this.logger.debug) {
      this.logger.debug(`CompaniesRepository.findByEmail executed, companyID: ${company?.companyID}, durationMs: ${Date.now() - start}`, 'Companies Repository Service')
    }

    return company
  }

  async findAll(relations: string[] = []): Promise<Company[]> {
    const start = Date.now()
    const companies = await this.companyRepository.find({
      relations,
      order: { createdAt: 'DESC' }
    })

    if (this.logger.debug) {
      this.logger.debug(`CompaniesRepository.findAll executed, resultCount: ${companies.length}, relations: ${relations}, durationMs: ${Date.now() - start}`,
      'Companies Repository Service');
    }

    return companies
  }

  async save(company: Company): Promise<Company> {
    const start = Date.now()
    const savedCompany = this.companyRepository.save(company)

    if (this.logger.debug) {
      this.logger.debug(`CompaniesRepository.save executed, durationMs: ${Date.now() - start}`, 'Companies Repository Service')
    }

    return savedCompany
  }

  async create(companyData: CreateCompanyDto, owner: User): Promise<Company> {
    const start = Date.now()

    await this.validator.validateUniqueCompany(companyData)

    const companyToCreate = {
      ...companyData,
      owner: owner
    }

    const company = this.companyRepository.create(companyToCreate)
    this.save(company)

    if (this.logger.debug) {
      this.logger.debug(`CompaniesRepository.create executed, durationMs: ${Date.now() - start}`, 'Companies Repository Service');
    }
    
    return company
  }

  async remove(company: Company): Promise<void> {
    const start = Date.now()
    await this.companyRepository.remove(company)

    if (this.logger.debug) {
      this.logger.debug(`CompaniesRepository.remove executed, durationMs: ${Date.now() - start}`, 'Companies Repository Service');
    }
  }
}