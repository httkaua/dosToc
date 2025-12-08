import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Request } from '@nestjs/common';
import { PropertyownersService } from './propertyowners.service';
import { ResponsePropertyOwnerDto } from './dto/response-property-owner.dto';
import { CreatePropertyOwnerDto } from './dto/create-property-owner.dto';
import { UpdatePropertyOwnerDto } from './dto/update-property-owner.dto';

@Controller('property-owners')
export class PropertyownersController {
    constructor(
        private readonly propertyownersService: PropertyownersService,
    ) {}

    //* ----- PROPERTY OWNER CREATION ENDPOINTS ----- *//
    @Post('create')
    @HttpCode(HttpStatus.CREATED)
    async create(
    @Body() createPropertyOwnerDto: CreatePropertyOwnerDto,
    @Request() req,
    ): Promise<ResponsePropertyOwnerDto> {
        console.log(req.user)
    return await this.propertyownersService.create(createPropertyOwnerDto, req.user);
    }

    //* ----- PROPERTY OWNER QUERY ENDPOINTS ----- *//
    @Get()
    @HttpCode(HttpStatus.OK)
    async findAll(): Promise<ResponsePropertyOwnerDto[]> {
    return await this.propertyownersService.findAll(['propertyOwnerCompany', 'realEstatesOwning']);
    }

    @Get('in-my-company')
    @HttpCode(HttpStatus.OK)
    async findAllOfMyCompany(
    @Request() req
    ): Promise<ResponsePropertyOwnerDto[]> {
    return await this.propertyownersService.findAllOfMyCompany(req.user.userID, ['propertyOwnerCompany', 'realEstatesOwning']);
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    ): Promise<ResponsePropertyOwnerDto> {
    return await this.propertyownersService.findOne(id, req.user);
    }

    //* ----- PROPERTY OWNER UPDATE ENDPOINTS ----- *//
    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePropertyOwnerDto: UpdatePropertyOwnerDto,
    @Request() req,
    ): Promise<ResponsePropertyOwnerDto> {
    const ids = {
        reqUser: req.user.userID,
        propertyOwnerID: id,
    }
    return await this.propertyownersService.update(ids, updatePropertyOwnerDto);
    }

    //* ----- PROPERTY OWNER DELETION ENDPOINT ----- *//
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    ): Promise<void> {
    return await this.propertyownersService.remove(id, req.user);
    }
}
