import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { RealestateRepositoryService } from './services/realestate-repository.service';
import { RealestateValidatorService } from './services/realestate-validator.service';
import { User } from 'src/users/entities/user.entity';
import { RealEstate } from './entities/real-estate.entity';
import { CreateRealestateDto } from './dto/create-realestate.dto';
import { Company } from 'src/companies/entities/company.entity';
import { UpdateRealestateDto } from './dto/update-realestate.dto';
import { CompaniesService } from 'src/companies/companies.service';

@Injectable()
export class RealestatesService {
    constructor(
        private readonly realEstateRepositoryService: RealestateRepositoryService,
        private readonly validator: RealestateValidatorService,
        private readonly usersService: UsersService,
        private readonly companiesService: CompaniesService
    ) {}

    async create(createRealestateDto: CreateRealestateDto, reqUser: User): Promise<RealEstate> {
        const user = await this.usersService.findOne(reqUser.userID)

        if (!user.userCompany) {
            throw new ConflictException('User must belong to a company to create real estates.');
        }

        await this.validator.validateUniqueAddressInCompany(createRealestateDto, reqUser.userCompany);
        await this.companiesService.validateAgentToCreateRealEstate(user, user.userCompany)
        await this.companiesService.validateAssistantToCreateRealEstate(user, user.userCompany)
        
        const easyID =  await this.easyIDgenerator(createRealestateDto, reqUser.userCompany)


        return await this.realEstateRepositoryService.create({
            ...createRealestateDto,
            creatorUser: user,
            easyID,
            realEstateCompany: user.userCompany
        });
    }

    async findAll(relations: string[]): Promise<RealEstate[]> {
        return await this.realEstateRepositoryService.findAll(relations);
    }

    async findAllOfMyCompany(userID: number, relations: string[]): Promise<RealEstate[]> {
        const user = await this.usersService.findOne(userID)
        const companyID = user.userCompany.companyID

        if (!companyID) {
            throw new NotFoundException('Company not found.')
        }

        return await this.realEstateRepositoryService.findAllCompanyRealEstates(companyID, relations);
    }

    async findOne(id: number, reqUser: User): Promise<RealEstate> {
        const realestate = await this.realEstateRepositoryService.findById(id, ['creatorUser', 'realEstateCompany']);

        if (!realestate) {
            throw new NotFoundException(`Real estate ${id} not found`)
        }

        return realestate;
    }

    async update(ids: Record<string, any>, updateRealestateDto: UpdateRealestateDto): Promise<RealEstate> {
        const realestateToUpdate = await this.realEstateRepositoryService.findById(ids.realestateID, ['creatorUser', 'realEstateCompany']);
        const reqUser = await this.usersService.findOne(ids.reqUser);

        if (!reqUser) {
            throw new NotFoundException('User not found');
        }

        if (!realestateToUpdate) {
            throw new NotFoundException(`Real estate ${ids.realestateID} not found`);
        }

        Object.assign(realestateToUpdate, updateRealestateDto);
        return this.realEstateRepositoryService.save(realestateToUpdate);
    }

    async disable(id: number, reqUser: User): Promise<RealEstate> {
        const realestate = await this.realEstateRepositoryService.findById(id, ['creatorUser', 'realEstateCompany']);

        if (!realestate) {
            throw new NotFoundException(`Real estate ${id} not found`)
        }

        if (realestate.enabled == false) {
            return realestate;
        }

        realestate.enabled = false;
        return this.realEstateRepositoryService.save(realestate);
    }

    async enable(id: number, reqUser: User): Promise<RealEstate> {
        const realestate = await this.realEstateRepositoryService.findById(id, ['creatorUser', 'realEstateCompany']);

        if (!realestate) {
            throw new NotFoundException(`Real estate ${id} not found`)
        }

        if (realestate.enabled == true) {
            return realestate;
        }

        realestate.enabled = true;
        return this.realEstateRepositoryService.save(realestate);
    }

    async remove(id: number, reqUser: User): Promise<void> {
        const realestate = await this.realEstateRepositoryService.findById(id, []);

        if (!realestate) {
            throw new NotFoundException(`Real estate ${id} not found`)
        }
        
        await this.realEstateRepositoryService.remove(realestate);
    }

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
            .realEstateRepositoryService
            .findLastRealEstateWithSameTypeEasyID(createRealestateDto.propertyType, company);

        const newEasyID = `${prefix}${lastRealEstateNumber + 1}`;

        return newEasyID;
    }
}
