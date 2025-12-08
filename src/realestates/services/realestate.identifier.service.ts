import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { RealestateRepositoryService } from "./realestate-repository.service";
import { CreateRealestateDto } from "../dto/create-realestate.dto";
import { Company } from "src/companies/entities/company.entity";

@Injectable()
export class RealestateIdentifierService {
    constructor(
        private readonly realestateRepositoryService: RealestateRepositoryService
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

        const prefix = easyIdPrefixes[createRealestateDto.propertyType];
        
        if (!prefix) {
            throw new InternalServerErrorException(`Invalid property type: ${createRealestateDto.propertyType}`);
        }

        const lastRealEstateNumber = await this
            .realestateRepositoryService
            .findLastRealEstateWithSameTypeEasyID(createRealestateDto.propertyType, company);

        const newEasyID = `${prefix}${lastRealEstateNumber + 1}`;

        return newEasyID;
    }
}