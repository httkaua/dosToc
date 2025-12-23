import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CompaniesService } from 'src/companies/companies.service';
import { UsersService } from 'src/users/users.service';
import { PropertyOwnerRepositoryService } from './services/propertyowners-repository.service';
import { PropertyOwnerValidatorService } from './services/propertyowners-validator.service';
import { CreatePropertyOwnerDto } from './dto/create-property-owner.dto';
import { User } from 'src/users/entities/user.entity';
import { PropertyOwner } from './entities/property-owner.entity';
import { PropertyOwnersTransformerService } from './services/propertyowners-tranformer.service';
import { UpdatePropertyOwnerDto } from './dto/update-property-owner.dto';
import type { LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Injectable()
export class PropertyownersService {
    constructor(
        @Inject(WINSTON_MODULE_NEST_PROVIDER)
        private readonly logger: LoggerService,

        private readonly repository: PropertyOwnerRepositoryService,
        private readonly validator: PropertyOwnerValidatorService,
        private readonly transformer: PropertyOwnersTransformerService,
        private readonly usersService: UsersService,
        private readonly companiesService: CompaniesService,
    ) {}

    async create(dto: CreatePropertyOwnerDto, reqUser: User): Promise<PropertyOwner> {
        if (this.logger.debug) {
            this.logger.debug(`Creating property owner: ${dto.email}`, 'Property Owners Service')
        }
        const user = await this.usersService.findOne(reqUser.userID)

        if (!user.userCompany) {
            throw new ConflictException('User must belong to a company to create real estates.');
        }

        await this.validator.validateUniquePhoneInCompany(dto, reqUser.userCompany)

        const propertyOwner = await this.repository.create({
            ...dto,
            searchableName: this.transformer.generateSearchableName(dto.name),
            propertyOwnerCompany: user.userCompany
        })

        this.logger.log(`Property owner created successfully: propertyOwnerID: ${propertyOwner.propertyOwnerID}`, 'Property Owners Service')
        return propertyOwner;
    }

    async findAll(relations: string[]): Promise<PropertyOwner[]> {
        if (this.logger.debug) {
            this.logger.debug(`Function called: findAll`, 'Property Owners Service');
        }
        return await this.repository.findAll(relations);
    }

    async findAllOfMyCompany(userID: number, relations: string[]): Promise<PropertyOwner[]> {
        if (this.logger.debug) {
            this.logger.debug(`Function called: findAllOfMyCompany`, 'Property Owners Service');
        }
        const user = await this.usersService.findOne(userID)
        const companyID = user.userCompany.companyID

        if (!companyID) {
            this.logger.warn(`Company not found. companyID: ${user.userCompany.companyID}`, 'Property Owners Service')
            throw new NotFoundException('Company not found.')
        }

        return await this.repository.findAllCompanyPropertyOwners(companyID, relations);
    }

    async findOne(id: number, reqUser: User): Promise<PropertyOwner> {
        if (this.logger.debug) {
            this.logger.debug(`Function called: findOne`, 'Property Owners Service');
        }
        const propertyowner = await this.repository.findById(id, ['propertyOwnerCompany', 'realEstatesOwning'])
        const user = await this.usersService.findOne(reqUser.userID)

        if (!propertyowner) {
            this.logger.warn(`Property owner not found: ${id}`, 'Property Owners Service')
            throw new NotFoundException(`Property owner with ID ${id} not found`);
        }

        await this.usersService.validateCompanyMembership(user, propertyowner.propertyOwnerCompany)
        return propertyowner;
    }

    async update(ids: Record<string, any>, updatePropertyOwnerDto: UpdatePropertyOwnerDto): Promise<PropertyOwner> {
        if (this.logger.debug) {
            this.logger.debug(`Updating property owner: ${ids.propertyOwnerID}`, 'Property Owners Service')
        }
        const propertyownerToUpdate = await this.repository.findById(ids.propertyOwnerID, ['propertyOwnerCompany', 'realEstatesOwning']);
        const reqUser = await this.usersService.findOne(ids.reqUser);

        if (!reqUser) {
            this.logger.warn(`Req user not found. userID: ${ids.reqUser}`, 'Property Owners Service')
            throw new NotFoundException('User not found');
        }

        if (!propertyownerToUpdate) {
            this.logger.warn(`Property owner not found. propertyOwnerID: ${ids.propertyOwnerID}`, 'Property Owners Service')
            throw new NotFoundException(`Property owner with ID ${ids.propertyOwnerID} not found`);
        }

        await this.usersService.validateCompanyMembership(reqUser, propertyownerToUpdate.propertyOwnerCompany)
        await this.companiesService.validateAgentToCreateRealEstate(reqUser, propertyownerToUpdate.propertyOwnerCompany)
        await this.companiesService.validateAssistantToCreateRealEstate(reqUser, propertyownerToUpdate.propertyOwnerCompany)

        Object.assign(propertyownerToUpdate, updatePropertyOwnerDto)
        const savedPropertyOwner = await this.repository.save(propertyownerToUpdate)

        this.logger.log(`Property owner updated successfully: ${savedPropertyOwner.propertyOwnerID}`, 'Property Owners Service')
        return savedPropertyOwner;
    }

    async remove(id: number, reqUser: User): Promise<void> {
        if (this.logger.debug) {
            this.logger.debug(`Removing property owner: ${id}`, 'Property Owners Service')
        }
        const propertyOwner = await this.repository.findById(id, ['propertyOwnerCompany', 'realEstatesOwning']);
        const user = await this.usersService.findOne(reqUser.userID)

        if (!propertyOwner) {
            this.logger.warn(`Property owner not found: ${id}`, 'Property Owners Service')
            throw new NotFoundException(`Property owner ${id} not found`)
        }

        if (propertyOwner.realEstatesOwning.length > 0) {
            this.logger.warn(`Invalid attempt to remove property owner with real estates. realEstatesOwning: ${propertyOwner.realEstatesOwning}`, 'Property Owners Service')
            throw new ConflictException(`This property owner have at least one real estate associated. Please check the informations to ensure that's right.`)
        }

        await this.usersService.validateCompanyMembership(user, propertyOwner.propertyOwnerCompany)
        await this.companiesService.validateAgentToDeleteRealEstate(user, propertyOwner.propertyOwnerCompany)
        await this.companiesService.validateAssistantToDeleteRealEstate(user, propertyOwner.propertyOwnerCompany)
        
        await this.repository.remove(propertyOwner)
        this.logger.log(`Property owner removed successfully: ${propertyOwner.propertyOwnerID}`, 'Property Owners Service');
    }
}
