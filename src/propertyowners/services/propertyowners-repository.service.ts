import { ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Company } from 'src/companies/entities/company.entity';
import { PropertyOwner } from '../entities/property-owner.entity';

@Injectable()
export class PropertyOwnerRepositoryService {
    constructor(

        @InjectRepository(PropertyOwner)
        private readonly propertyOwnerRepository: Repository<PropertyOwner>,
    ) {}

    async findById(id: number, relations: string[]): Promise<PropertyOwner | null> {
        const propertyowner = await this.propertyOwnerRepository.findOne({
            where: { propertyOwnerID: id },
            relations,
        });
        
        return propertyowner;
    }

    async findAll(relations: string[]): Promise<PropertyOwner[]> {
        if (!relations) {
            throw new ForbiddenException('PropertyOwners relations forbidden.')
        }
        const propertyowners = await this.propertyOwnerRepository.find({
        relations,
        order: { createdAt: 'DESC' }
        });

        return propertyowners
    }

    async save(propertyowner: PropertyOwner): Promise<PropertyOwner> {
        return this.propertyOwnerRepository.save(propertyowner);
    }

    async create(propertyownerData: Partial<PropertyOwner>): Promise<PropertyOwner> {
        const propertyowner = this.propertyOwnerRepository.create(propertyownerData);
        return this.save(propertyowner);
    }

    async remove(propertyowner: PropertyOwner): Promise<void> {
        await this.propertyOwnerRepository.remove(propertyowner);
    }

    async findAllCompanyPropertyOwners(id: number, relations: string[]): Promise<PropertyOwner[]> {
    const propertyowners = await this.propertyOwnerRepository.find({
        where: { propertyOwnerCompany: { companyID: id } },
        relations,
        order: { createdAt: 'DESC' }
    });

    if (!propertyowners || propertyowners.length === 0) {
        throw new NotFoundException(`No propertyowners found for company with ID ${id}.`);
    }

    return propertyowners
    }

}