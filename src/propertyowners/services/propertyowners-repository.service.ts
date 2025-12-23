import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PropertyOwner } from '../entities/property-owner.entity';
import type { LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";

@Injectable()
export class PropertyOwnerRepositoryService {
    constructor(
        @InjectRepository(PropertyOwner)
        private readonly propertyOwnerRepository: Repository<PropertyOwner>,

        @Inject(WINSTON_MODULE_NEST_PROVIDER)
        private readonly logger: LoggerService,
    ) {}

    async findById(id: number, relations: string[]): Promise<PropertyOwner | null> {
        const start = Date.now()
        const propertyowner = await this.propertyOwnerRepository.findOne({
            where: { propertyOwnerID: id },
            relations,
        })

        if (this.logger.debug) {
            this.logger.debug(`PropertyOwnerRepositoryService.findById executed, propertyOwnerID: ${propertyowner?.propertyOwnerID}, relations: ${relations}, durationMs: ${Date.now() - start}`, 'Property Owner Repository')
        }
        return propertyowner;
    }

    async findAll(relations: string[]): Promise<PropertyOwner[]> {
        const start = Date.now()
        if (!relations) {
            throw new ForbiddenException('PropertyOwners relations forbidden.')
        }
        const propertyowners = await this.propertyOwnerRepository.find({
        relations,
        order: { createdAt: 'DESC' }
        })

        if (this.logger.debug) {
            this.logger.debug(`PropertyOwnerRepositoryService.findAll executed, resultCount: ${propertyowners.length}, relations: ${relations}, durationMs: ${Date.now() - start}`, 'Property Owner Repository')
        }
        return propertyowners
    }

    async save(propertyowner: PropertyOwner): Promise<PropertyOwner> {
        const start = Date.now()
        const savedPropertyOwner = await this.propertyOwnerRepository.save(propertyowner);
        if (this.logger.debug) {
            this.logger.debug(`PropertyOwnerRepositoryService.save executed, propertyOwnerID: ${savedPropertyOwner?.propertyOwnerID}, durationMs: ${Date.now() - start}`, 'Property Owner Repository')
        }
        return savedPropertyOwner;
    }

    async create(propertyownerData: Partial<PropertyOwner>): Promise<PropertyOwner> {
        const start = Date.now()
        const propertyowner = this.propertyOwnerRepository.create(propertyownerData);
        this.save(propertyowner);

        if (this.logger.debug) {
            this.logger.debug(`PropertyOwnerRepositoryService.create executed, durationMs: ${Date.now() - start}`, 'Property Owner Repository');
        }
        return propertyowner;
    }

    async remove(propertyowner: PropertyOwner): Promise<void> {
        const start = Date.now()
        await this.propertyOwnerRepository.remove(propertyowner)
        if (this.logger.debug) {
            this.logger.debug(`PropertyOwnerRepositoryService.remove executed, durationMs: ${Date.now() - start}`, 'Property Owner Repository');
        }
    }

    async findAllCompanyPropertyOwners(id: number, relations: string[]): Promise<PropertyOwner[]> {
        const start = Date.now()
        const propertyowners = await this.propertyOwnerRepository.find({
            where: { propertyOwnerCompany: { companyID: id } },
            relations,
            order: { createdAt: 'DESC' }
        });

        if (!propertyowners || propertyowners.length === 0) {
            this.logger.warn(`No propertyowners found. companyID: ${id}`, 'Property Owner Repository')
            throw new NotFoundException(`No propertyowners found for company with ID ${id}.`);
        }

        if (this.logger.debug) {
            this.logger.debug(`PropertyOwnerRepositoryService.findAllCompanyPropertyOwners executed, resultCount: ${propertyowners.length}, durationMs: ${Date.now() - start}`, 'Property Owner Repository');
        }

        return propertyowners
    }

}