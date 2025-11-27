import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Company } from "../entities/company.entity";
import { Repository } from "typeorm";
import { CreateCompanyDto } from "../dto/create-company.dto";
import { CompanyValidatorService } from "./company-validator.service";
import { User } from "src/users/entities/user.entity";


@Injectable()
export class CompanyRepositoryService {
    constructor(
        @InjectRepository(Company)
        private readonly companyRepository: Repository<Company>,
        private readonly validator: CompanyValidatorService,
    ) {}

  async findById(id: number, relations: string[]): Promise<Company> {
    const company = await this.companyRepository.findOne({
      where: { companyID: id },
      relations,
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found.`);
    }

    return company;
  }

  async findByName(name: string): Promise<Company | null> {
    return this.companyRepository.findOne({
      where: { name }
    });
  }

  async findByEmail(email: string): Promise<Company | null> {
    return this.companyRepository.findOne({
      where: { email },
      select: ['companyID', 'email', 'enabled'],
    });
  }

  async findAll(relations: string[] = []): Promise<Company[]> {
    return this.companyRepository.find({
      relations,
      order: { createdAt: 'DESC' }
    });
  }

  async save(company: Company): Promise<Company> {
    return this.companyRepository.save(company);
  }

  async create(companyData: CreateCompanyDto, owner: User): Promise<Company> {
    if (!companyData) {
      throw new NotFoundException('No company data provided for creation.');
    }

    await this.validator.validateUniqueCompany(companyData);

    const companyToCreate = {
      ...companyData,
      owner: owner
    }

    const company = this.companyRepository.create(companyToCreate);
    return this.save(company);
  }

  async remove(company: Company): Promise<void> {
    await this.companyRepository.remove(company);
  }
}