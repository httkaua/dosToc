import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CompaniesService } from 'src/companies/companies.service';
import { UsersService } from 'src/users/users.service';
import { PropertyOwnerRepositoryService } from './services/propertyowners-repository.service';
import { PropertyOwnerValidatorService } from './services/propertyowners-validator.service';
import { CreatePropertyOwnerDto } from './dto/create-property-owner.dto';
import { User } from 'src/users/entities/user.entity';
import { PropertyOwner } from './entities/property-owner.entity';
import { PropertyOwnersTransformerService } from './services/propertyowners-tranformer.service';
import { RealestatesService } from 'src/realestates/realestates.service';
import { RealEstate } from 'src/realestates/entities/real-estate.entity';
import { UpdatePropertyOwnerDto } from './dto/update-property-owner.dto';

@Injectable()
export class PropertyownersService {
    constructor(
        private readonly repository: PropertyOwnerRepositoryService,
        private readonly validator: PropertyOwnerValidatorService,
        private readonly transformer: PropertyOwnersTransformerService,
        private readonly usersService: UsersService,
        private readonly companiesService: CompaniesService
    ) {}

    async create(dto: CreatePropertyOwnerDto, reqUser: User): Promise<PropertyOwner> {
        console.log(reqUser)
    const user = await this.usersService.findOne(reqUser.userID);

    if (!user.userCompany) {
        throw new ConflictException('User must belong to a company to create real estates.');
    }

    await this.validator.validateUniquePhoneInCompany(dto, reqUser.userCompany);

    return this.repository.create({
        ...dto,
        searchableName: this.transformer.generateSearchableName(dto.name)
    });
    }

    async findAll(relations: string[]): Promise<PropertyOwner[]> {
        return await this.repository.findAll(relations);
    }

    async findAllOfMyCompany(userID: number, relations: string[]): Promise<PropertyOwner[]> {
        const user = await this.usersService.findOne(userID)
        const companyID = user.userCompany.companyID

        if (!companyID) {
            throw new NotFoundException('Company not found.')
        }

        return await this.repository.findAllCompanyPropertyOwners(companyID, relations);
    }

    async findOne(id: number, reqUser: User): Promise<PropertyOwner> {
        const propertyowner = await this.repository.findById(id, ['company', 'realEstatesOwning']);
        const user = await this.usersService.findOne(reqUser.userID)

        if (!propertyowner) {
            throw new NotFoundException(`Property owner with ID ${id} not found`)
        }

        await this.usersService.validateCompanyMembership(user, propertyowner.propertyOwnerCompany)

        return propertyowner;
    }

    async update(ids: Record<string, any>, updatePropertyOwnerDto: UpdatePropertyOwnerDto): Promise<PropertyOwner> {
        const propertyownerToUpdate = await this.repository.findById(ids.propertyOwnerID, ['propertyOwnerCompany', 'realEstatesOwning']);
        const reqUser = await this.usersService.findOne(ids.reqUser);

        if (!reqUser) {
            throw new NotFoundException('User not found');
        }

        if (!propertyownerToUpdate) {
            throw new NotFoundException(`Property owner with ID ${ids.propertyOwnerID} not found`);
        }

        await this.usersService.validateCompanyMembership(reqUser, propertyownerToUpdate.propertyOwnerCompany)
        await this.companiesService.validateAgentToCreateRealEstate(reqUser, propertyownerToUpdate.propertyOwnerCompany)
        await this.companiesService.validateAssistantToCreateRealEstate(reqUser, propertyownerToUpdate.propertyOwnerCompany)

        Object.assign(propertyownerToUpdate, updatePropertyOwnerDto);
        return this.repository.save(propertyownerToUpdate);
    }

    async remove(id: number, reqUser: User): Promise<void> {
        const propertyOwner = await this.repository.findById(id, ['creatorUser', 'realEstateCompany']);
        const user = await this.usersService.findOne(reqUser.userID)

        if (!propertyOwner) {
            throw new NotFoundException(`Real estate ${id} not found`)
        }

        if (propertyOwner.realEstatesOwning) {
            throw new ConflictException(
                `This property owner have at least one real estate associated. Please check the informations to ensure that's right.`
            )
        }

        await this.usersService.validateCompanyMembership(user, propertyOwner.propertyOwnerCompany)
        await this.companiesService.validateAgentToDeleteRealEstate(user, propertyOwner.propertyOwnerCompany)
        await this.companiesService.validateAssistantToDeleteRealEstate(user, propertyOwner.propertyOwnerCompany)
        
        await this.repository.remove(propertyOwner);
    }
}
