import { BadRequestException, ConflictException, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { RealestateRepositoryService } from './services/realestate-repository.service';
import { RealestateValidatorService } from './services/realestate-validator.service';
import { User } from 'src/users/entities/user.entity';
import { RealEstate } from './entities/real-estate.entity';
import { CreateRealestateDto } from './dto/create-realestate.dto';
import { Company } from 'src/companies/entities/company.entity';
import { UpdateRealestateDto } from './dto/update-realestate.dto';
import { CompaniesService } from 'src/companies/companies.service';
import { RealestateIdentifierService } from './services/realestate.identifier.service';
import { PropertyownersService } from 'src/propertyowners/propertyowners.service';
import type { LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Injectable()
export class RealestatesService {
    constructor(
        @Inject(WINSTON_MODULE_NEST_PROVIDER)
        private readonly logger: LoggerService,
        
        private readonly realEstateRepositoryService: RealestateRepositoryService,
        private readonly validator: RealestateValidatorService,
        private readonly identifier: RealestateIdentifierService,
        private readonly usersService: UsersService,
        private readonly companiesService: CompaniesService,
        private readonly propertyownersService: PropertyownersService
    ) {}

    async create(createRealestateDto: CreateRealestateDto, reqUser: User): Promise<RealEstate> {
        if (this.logger.debug) {
            this.logger.debug(`Creating real estate: ${createRealestateDto.street}, ${createRealestateDto.streetNumber}`, 'Real Estates Service')
        }

        if (!createRealestateDto.propertyOwner) {
            this.logger.warn(`Invalid attempt to create real estate without a property owner. userID: ${reqUser.userID}`, 'Real Estates Service')
            throw new BadRequestException(`Property owner must be assigned.`)
        }

        const user = await this.usersService.findOne(reqUser.userID)
        const propertyOwner = await this.propertyownersService.findOne(createRealestateDto.propertyOwner, user)

        if (!user.userCompany) {
            this.logger.warn(`Invalid attempt to create real estate with an user without a company. userID: ${reqUser.userID}`, 'Real Estates Service')
            throw new ConflictException('User must belong to a company to create real estates.');
        }

        await this.validator.validateUniqueAddressInCompany(createRealestateDto, reqUser.userCompany)
        await this.companiesService.validateAgentToCreateRealEstate(user, user.userCompany)
        await this.companiesService.validateAssistantToCreateRealEstate(user, user.userCompany)
        
        const easyID =  await this.easyIDgenerator(createRealestateDto, reqUser.userCompany)

        const realestate = await this.realEstateRepositoryService.create({
            ...createRealestateDto,
            creatorUser: user,
            easyID,
            realEstateCompany: user.userCompany,
            realEstatesOwningOf: propertyOwner
        })

        this.logger.log(`Real estate created successfully: realestateID: ${realestate.realEstateID}`, 'Real Estates Service')

        return realestate;
    }

    async findAll(relations: string[]): Promise<RealEstate[]> {
        if (this.logger.debug) {
            this.logger.debug(`Function called: findAll`, 'Real Estates Service');
        }
        return await this.realEstateRepositoryService.findAll(relations);
    }

    async findAllOfMyCompany(userID: number, relations: string[]): Promise<RealEstate[]> {
        if (this.logger.debug) {
            this.logger.debug(`Function called: findAllOfMyCompany`, 'Real Estates Service');
        }

        const user = await this.usersService.findOne(userID)
        const companyID = user.userCompany.companyID

        if (!companyID) {
            this.logger.warn(`User company not found. userCompany: ${user.userCompany}`, 'Real Estates Service')
            throw new NotFoundException('Company not found.')
        }

        return await this.realEstateRepositoryService.findAllCompanyRealEstates(companyID, relations);
    }

    async findOne(id: number, reqUser: User): Promise<RealEstate> {
        if (this.logger.debug) {
            this.logger.debug(`Function called: findOne`, 'Real Estates Service')
        }

        const realestate = await this.realEstateRepositoryService.findById(id, ['creatorUser', 'realEstateCompany']);
        const user = await this.usersService.findOne(reqUser.userID)

        if (!realestate) {
            this.logger.warn(`Real estate not found: ${id}`, 'Real Estates Service')
            throw new NotFoundException(`Real estate not found`)
        }

        await this.usersService.validateCompanyMembership(user, realestate.realEstateCompany)
        return realestate;
    }

    async update(ids: Record<string, any>, updateRealestateDto: UpdateRealestateDto): Promise<RealEstate> {
        if (this.logger.debug) {
            this.logger.debug(`Updating real estate: ${ids.realestateID}`, 'Real Estates Service')
        }

        const realestateToUpdate = await this.realEstateRepositoryService.findById(ids.realestateID, ['creatorUser', 'realEstateCompany']);
        const reqUser = await this.usersService.findOne(ids.reqUser);

        if (!reqUser) {
            this.logger.warn(`User not found: ${ids.reqUser}`, 'Real Estates Service')
            throw new NotFoundException('User not found');
        }

        if (!realestateToUpdate) {
            this.logger.warn(`Real estate not found: ${ids.realestateID}`, 'Real Estates Service')
            throw new NotFoundException(`Real estate ${ids.realestateID} not found`);
        }

        await this.usersService.validateCompanyMembership(reqUser, realestateToUpdate.realEstateCompany)
        await this.companiesService.validateAgentToCreateRealEstate(reqUser, realestateToUpdate.realEstateCompany)
        await this.companiesService.validateAssistantToCreateRealEstate(reqUser, realestateToUpdate.realEstateCompany)

        Object.assign(realestateToUpdate, updateRealestateDto)
        this.logger.log(`Real estate updated successfully: ${realestateToUpdate.realEstateID}`, 'Real Estates Service')
        return this.realEstateRepositoryService.save(realestateToUpdate)
    }

    async disable(id: number, reqUser: User): Promise<RealEstate> {
        if (this.logger.debug) {
            this.logger.debug(`Disabling real estate: ${id}`, 'Real Estates Service')
        }

        const realestate = await this.realEstateRepositoryService.findById(id, ['creatorUser', 'realEstateCompany'])
        const user = await this.usersService.findOne(reqUser.userID)

        if (!realestate) {
            this.logger.warn(`Real estate not found: ${id}`, 'Real Estates Service')
            throw new NotFoundException(`Real estate not found`)
        }

        await this.usersService.validateCompanyMembership(user, realestate.realEstateCompany)
        await this.companiesService.validateAgentToDeleteRealEstate(user, realestate.realEstateCompany)
        await this.companiesService.validateAssistantToDeleteRealEstate(user, realestate.realEstateCompany)

        if (realestate.enabled == false) {
            this.logger.log(`Real estate already disabled: ${id}`, 'Real Estates Service')
            return realestate
        }

        realestate.enabled = false
        this.logger.log(`Real estate disabled successfully: ${realestate.realEstateID}`, 'Real Estates Service')
        return this.realEstateRepositoryService.save(realestate)
    }

    async enable(id: number, reqUser: User): Promise<RealEstate> {
        if (this.logger.debug) {
            this.logger.debug(`Enabling real estate: ${id}`, 'Real Estates Service')
        }

        const realestate = await this.realEstateRepositoryService.findById(id, ['creatorUser', 'realEstateCompany'])
        const user = await this.usersService.findOne(reqUser.userID)

        if (!realestate) {
            this.logger.warn(`Real estate not found: ${id}`, 'Real Estates Service')
            throw new NotFoundException(`Real estate ${id} not found`)
        }

        await this.usersService.validateCompanyMembership(user, realestate.realEstateCompany)
        await this.companiesService.validateAgentToDeleteRealEstate(user, realestate.realEstateCompany)
        await this.companiesService.validateAssistantToDeleteRealEstate(user, realestate.realEstateCompany)

        if (realestate.enabled == true) {
            this.logger.log(`Real estate already enabled: ${id}`, 'Real Estates Service')
            return realestate
        }

        realestate.enabled = true
        this.logger.log(`Real estate enabled successfully: ${realestate.realEstateID}`, 'Real Estates Service')
        return this.realEstateRepositoryService.save(realestate)
    }

    async remove(id: number, reqUser: User): Promise<void> {
        if (this.logger.debug) {
            this.logger.debug(`Removing real estate: ${id}`, 'Real Estates Service')
        }

        const realestate = await this.realEstateRepositoryService.findById(id, ['creatorUser', 'realEstateCompany'])
        const user = await this.usersService.findOne(reqUser.userID)

        if (!realestate) {
            this.logger.warn(`Real estate not found: ${id}`, 'Real Estates Service')
            throw new NotFoundException(`Real estate not found`)
        }

        await this.usersService.validateCompanyMembership(user, realestate.realEstateCompany)
        await this.companiesService.validateAgentToDeleteRealEstate(user, realestate.realEstateCompany)
        await this.companiesService.validateAssistantToDeleteRealEstate(user, realestate.realEstateCompany)
        
        await this.realEstateRepositoryService.remove(realestate)
        this.logger.log(`Real estate removed successfully: ${realestate.realEstateID}`, 'Real Estates Service')
    }

    async easyIDgenerator(createRealestateDto: CreateRealestateDto, company: Company): Promise<string> {
        if (this.logger.debug) {
            this.logger.debug(`Function called: easyIDgenerator`, 'Real Estates Service')
        }
        return await this.identifier.easyIDgenerator(createRealestateDto, company)
    }
}
