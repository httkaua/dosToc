import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Company } from "../entities/company.entity";
import { Repository } from "typeorm";
import { CreateCompanyDto } from "../dto/create-company.dto";


@Injectable()
export class CompanyRepositoryService {
    constructor(
        @InjectRepository(Company)
        private readonly companyRepository: Repository<Company>,
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

  async create(companyData: Partial<Company>): Promise<Company> {
    const company = this.companyRepository.create(companyData);
    return this.save(company);
  }

  async remove(company: Company): Promise<void> {
    await this.companyRepository.remove(company);
  }
}