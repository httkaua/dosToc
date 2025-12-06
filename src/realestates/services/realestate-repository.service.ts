import { ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RealEstate } from '../entities/real-estate.entity';
import { Company } from 'src/companies/entities/company.entity';

@Injectable()
export class RealestateRepositoryService {
    constructor(

        @InjectRepository(RealEstate)
        private readonly realestateRepository: Repository<RealEstate>,
    ) {}

    async findById(id: number, relations: string[]): Promise<RealEstate | null> {
        const realestate = await this.realestateRepository.findOne({
            where: { realEstateID: id },
            relations,
        });
        
        return realestate;
    }

    async findAll(relations: string[]): Promise<RealEstate[]> {
        if (!relations) {
            throw new ForbiddenException('RealEstates relations forbidden.')
        }
        const realestates = await this.realestateRepository.find({
        relations,
        order: { createdAt: 'DESC' }
        });

        return realestates
    }

    async save(realestate: RealEstate): Promise<RealEstate> {
        return this.realestateRepository.save(realestate);
    }

    async create(realestateData: Partial<RealEstate>): Promise<RealEstate> {
        const realestate = this.realestateRepository.create(realestateData);
        return this.save(realestate);
    }

    async remove(realestate: RealEstate): Promise<void> {
        await this.realestateRepository.remove(realestate);
    }

    async findAllCompanyRealEstates(id: number, relations: string[]): Promise<RealEstate[]> {
    const realestates = await this.realestateRepository.find({
        where: { realEstateCompany: { companyID: id } },
        relations,
        order: { createdAt: 'DESC' }
    });

    if (!realestates || realestates.length === 0) {
        throw new NotFoundException(`No realestates found for company with ID ${id}.`);
    }

    return realestates
    }

    async findLastRealEstateWithSameTypeEasyID(propertyType: string, company: Company): Promise<number> {
        const easyIdPrefixes = {
            "HOUSE": "CASA",
            "LAND": "TER",
            "APARTMENT": "APE",
            "TOWNHOUSE": "SOBR",
            "SITE": "SIT",
            "WAREHOUSE": "GAL",
            "STUDIO/ COMMERCIAL ROOM": "COM"
        }

        const prefix = easyIdPrefixes[propertyType];
        
        if (!prefix) {
            throw new InternalServerErrorException(`Invalid property type: ${propertyType}`);
        }

        const lastRealEstateWithSameType = await this.realestateRepository.findOne({
            where: {
                propertyType,
                realEstateCompany: company
            },
            order: {
                easyID: 'DESC'
            }
        });

        if (!lastRealEstateWithSameType) {
            return 0;
        }

        const lastEasyIDnumber = lastRealEstateWithSameType.easyID.replace(prefix, '');
        
        return parseInt(lastEasyIDnumber, 10);
    }
}