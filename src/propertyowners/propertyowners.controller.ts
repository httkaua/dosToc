import { Body, ClassSerializerInterceptor, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, ParseIntPipe, Patch, Post, Request, UseGuards, UseInterceptors } from '@nestjs/common';
import { PropertyownersService } from './propertyowners.service';
import { ResponsePropertyOwnerDto } from './dto/response-property-owner.dto';
import { CreatePropertyOwnerDto } from './dto/create-property-owner.dto';
import { UpdatePropertyOwnerDto } from './dto/update-property-owner.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/rbac/rbac.guard';
import { Roles } from 'src/rbac/role.decorator';
import { Role } from 'src/rbac/role.enum';
import type { LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";

@Controller('property-owners')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class PropertyownersController {
    constructor(
        private readonly propertyownersService: PropertyownersService,

      @Inject(WINSTON_MODULE_NEST_PROVIDER)
      private readonly logger: LoggerService,
    ) {}

    //* ----- PROPERTY OWNER CREATION ENDPOINTS ----- *//
    @Post('create')
    @Roles(
        Role.ADM_DEV,
        Role.DEV,
        Role.COMPANY_OWNER,
        Role.SUPERVISOR,
        Role.AGENT,
        Role.ASSISTANT
    )
    @HttpCode(HttpStatus.CREATED)
    async create(
    @Body() createPropertyOwnerDto: CreatePropertyOwnerDto,
    @Request() req,
    ): Promise<ResponsePropertyOwnerDto> {
        this.logger.log('POST /property-owners/create')
        return await this.propertyownersService.create(createPropertyOwnerDto, req.user);
    }

    //* ----- PROPERTY OWNER QUERY ENDPOINTS ----- *//
    @Get()
    @Roles(
        Role.ADM_DEV,
        Role.DEV
    )
    @HttpCode(HttpStatus.OK)
    async findAll(): Promise<ResponsePropertyOwnerDto[]> {
        this.logger.log('GET /property-owners')
        return await this.propertyownersService.findAll(['propertyOwnerCompany', 'realEstatesOwning']);
    }

    @Get('in-my-company')
    @Roles(
        Role.ADM_DEV,
        Role.DEV,
        Role.COMPANY_OWNER,
        Role.SUPERVISOR,
        Role.AGENT,
        Role.ASSISTANT
    )
    @HttpCode(HttpStatus.OK)
    async findAllOfMyCompany(
    @Request() req
    ): Promise<ResponsePropertyOwnerDto[]> {
        this.logger.log('GET /property-owners/in-my-company')
        return await this.propertyownersService.findAllOfMyCompany(req.user.userID, ['propertyOwnerCompany', 'realEstatesOwning']);
    }

    @Get(':id')
    @Roles(
        Role.ADM_DEV,
        Role.DEV,
        Role.COMPANY_OWNER,
        Role.SUPERVISOR,
        Role.AGENT,
        Role.ASSISTANT
    )
    @HttpCode(HttpStatus.OK)
    async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    ): Promise<ResponsePropertyOwnerDto> {
        this.logger.log('GET /property-owners/:id')
        return await this.propertyownersService.findOne(id, req.user);
    }

    //* ----- PROPERTY OWNER UPDATE ENDPOINTS ----- *//
    @Patch(':id')
    @Roles(
        Role.ADM_DEV,
        Role.DEV,
        Role.COMPANY_OWNER,
        Role.SUPERVISOR,
        Role.AGENT,
        Role.ASSISTANT
    )
    @HttpCode(HttpStatus.OK)
    async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePropertyOwnerDto: UpdatePropertyOwnerDto,
    @Request() req,
    ): Promise<ResponsePropertyOwnerDto> {
        this.logger.log('PATCH /property-owners/:id')
        const ids = {
            reqUser: req.user.userID,
            propertyOwnerID: id,
        }
        return await this.propertyownersService.update(ids, updatePropertyOwnerDto);
    }

    //* ----- PROPERTY OWNER DELETION ENDPOINT ----- *//
    @Delete(':id')
    @Roles(
        Role.ADM_DEV,
        Role.DEV
    )
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    ): Promise<void> {
        this.logger.log('DELETE /property-owners/:id')
        return await this.propertyownersService.remove(id, req.user);
    }
}
