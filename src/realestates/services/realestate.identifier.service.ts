import { Inject, Injectable, InternalServerErrorException } from "@nestjs/common";
import { RealestateRepositoryService } from "./realestate-repository.service";
import { CreateRealestateDto } from "../dto/create-realestate.dto";
import { Company } from "src/companies/entities/company.entity";
import type { LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";

@Injectable()
export class RealestateIdentifierService {
    constructor(
        private readonly realestateRepositoryService: RealestateRepositoryService,

        @Inject(WINSTON_MODULE_NEST_PROVIDER)
        private readonly logger: LoggerService,
    ) {}

    async easyIDgenerator(createRealestateDto: CreateRealestateDto, company: Company): Promise<string> {
        const easyIdPrefixes = {
            "HOUSE": "CASA",
            "LAND": "TER",
            "APARTMENT": "APE",
            "TOWNHOUSE": "SOBR",
            "SITE": "SIT",
            "WAREHOUSE": "GAL",
            "STUDIO/ COMMERCIAL ROOM": "COM"
        }

        const prefix = easyIdPrefixes[createRealestateDto.propertyType]
        
        if (!prefix) {
            this.logger.warn(`Invalid property type provided for easyID generation: ${createRealestateDto.propertyType}`, 'Real Estate Identifier Service')
            throw new InternalServerErrorException(`Invalid property type: ${createRealestateDto.propertyType}`)
        }

        const lastRealEstateNumber = await this
        .realestateRepositoryService
        .findLastEasyIDNumberWithSameTypeAndCompany(createRealestateDto.propertyType, company)

        const newEasyID = `${prefix}${lastRealEstateNumber + 1}`
        if (this.logger.debug) {
            this.logger.debug(`Generated new easyID: ${newEasyID} for propertyType: ${createRealestateDto.propertyType}`, 'Real Estate Identifier Service')
        }

        return newEasyID
    }
}