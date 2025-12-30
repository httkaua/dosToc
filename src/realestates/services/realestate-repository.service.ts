import { ForbiddenException, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RealEstate } from '../entities/real-estate.entity';
import { Company } from 'src/companies/entities/company.entity';
import type { LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";

@Injectable()
export class RealestateRepositoryService {
    constructor(
        @Inject(WINSTON_MODULE_NEST_PROVIDER)
        private readonly logger: LoggerService,

        @InjectRepository(RealEstate)
        private readonly realestateRepository: Repository<RealEstate>,
    ) {}

    async findById(id: number, relations: string[]): Promise<RealEstate | null> {
        const start = Date.now()
        const realestate = await this.realestateRepository.findOne({
            where: { realEstateID: id },
            relations,
        })

        if (this.logger.debug) {
            this.logger.debug(`RealEstateRepository.findById executed, realEstateID: ${realestate?.realEstateID}, relations: ${relations}, durationMs: ${Date.now() - start}`, 'Real Estate Repository Service')
        }
        
        return realestate
    }

    async findAll(relations: string[]): Promise<RealEstate[]> {
        const start = Date.now()
        const realestates = await this.realestateRepository.find({
            relations,
            order: { createdAt: 'DESC' }
        })

        if (this.logger.debug) {
            this.logger.debug(`RealEstateRepository.findAll executed, resultCount: ${realestates.length}, relations: ${relations}, durationMs: ${Date.now() - start}`, 'Real Estate Repository Service')
        }

        return realestates
    }

    async save(realestate: RealEstate): Promise<RealEstate> {
        const start = Date.now()
        const savedRealEstate = await this.realestateRepository.save(realestate)
        if (this.logger.debug) {
            this.logger.debug(`RealEstateRepository.save executed, durationMs: ${Date.now() - start}`, 'Real Estate Repository Service')
        }
        return savedRealEstate
    }

    async create(realestateData: Partial<RealEstate>): Promise<RealEstate> {
        const start = Date.now()
        const realestate = this.realestateRepository.create(realestateData)
        this.save(realestate)
        if (this.logger.debug) {
            this.logger.debug(`RealEstateRepository.create executed, durationMs: ${Date.now() - start}`, 'Real Estate Repository Service')
        }

        return realestate
    }

    async remove(realestate: RealEstate): Promise<void> {
        const start = Date.now()
        await this.realestateRepository.remove(realestate)
        if (this.logger.debug) {
            this.logger.debug(`RealEstateRepository.remove executed, durationMs: ${Date.now() - start}`, 'Real Estate Repository Service')
        }
    }

    async findAllCompanyRealEstates(id: number, relations: string[]): Promise<RealEstate[]> {
        const start = Date.now()
        const realestates = await this.realestateRepository.find({
            where: { realEstateCompany: { companyID: id } },
            relations,
            order: { createdAt: 'DESC' }
        })

        if (!realestates || realestates.length === 0) {
            this.logger.warn(`No realestates found. companyID: ${id}`, 'Real Estate Repository Service')
            throw new NotFoundException(`No realestates found for the company`)
        }

        if (this.logger.debug) {
            this.logger.debug(`RealEstateRepository.findAllCompanyRealEstates executed, resultCount: ${realestates.length}, durationMs: ${Date.now() - start}`, 'Real Estate Repository Service')
        }

        return realestates
    }

    async findLastEasyIDNumberWithSameTypeAndCompany(propertyType: string, company: Company): Promise<number> {
        const start = Date.now()
        const easyIdPrefixes = {
            "HOUSE": "CASA",
            "LAND": "TER",
            "APARTMENT": "APE",
            "TOWNHOUSE": "SOBR",
            "SITE": "SIT",
            "WAREHOUSE": "GAL",
            "STUDIO/ COMMERCIAL ROOM": "COM"
        }

        const prefix = easyIdPrefixes[propertyType]
        
        if (!prefix) {
            this.logger.warn(`Invalid property type: ${propertyType}`, 'Real Estate Repository Service')
            throw new InternalServerErrorException(`Invalid property type: ${propertyType}`)
        }

        const lastRealEstateWithSameType = await this.realestateRepository.findOne({
            where: {
                propertyType,
                realEstateCompany: company
            },
            order: {
                easyID: 'DESC'
            }
        })

        if (!lastRealEstateWithSameType) {
            this.logger.log(`EasyID generator returns 0 because no real estate found with same type and company`, 'Real Estate Repository Service')
            return 0
        }

        const lastEasyIDnumber = parseInt(lastRealEstateWithSameType.easyID.replace(prefix, ''), 10)
        this.logger.log(`EasyID generator returns ${lastEasyIDnumber}`, 'Real Estate Repository Service')
        
        return lastEasyIDnumber
    }
}