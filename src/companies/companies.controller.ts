import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ResponseCompanyDto } from './dto/response-company.dto';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Controller('companies')
export class CompaniesController {
    constructor(private readonly companiesService: CompaniesService) {}

    @Post('create')
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() createCompanyDto: CreateCompanyDto): Promise<ResponseCompanyDto> {
        const company = await this.companiesService.create(createCompanyDto);
        return new ResponseCompanyDto(company);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    async findAll(): Promise<ResponseCompanyDto[]> {
        const companies = await this.companiesService.findAll();
        return companies.map(company => new ResponseCompanyDto(company));
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<ResponseCompanyDto> {
        const company = await this.companiesService.findOne(id);
        return new ResponseCompanyDto(company);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateCompanyDto: UpdateCompanyDto, 
    ): Promise<ResponseCompanyDto> {
        const company = await this.update(id, updateCompanyDto);
        return new ResponseCompanyDto(company);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        await this.companiesService.remove(id)
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/disable')
    async disable(@Param('id', ParseIntPipe) id: number): Promise<ResponseCompanyDto> {
        const company = await this.companiesService.softDelete(id)
        return new ResponseCompanyDto(company)
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/enable')
    async enable(@Param('id', ParseIntPipe) id: number): Promise<ResponseCompanyDto> {
        const company = await this.companiesService.restore(id)
        return new ResponseCompanyDto(company)
    }

    @UseGuards(JwtAuthGuard)
    @Get('plans-options')
    async viewPlans(): Promise<string> {
        return `FREE, SINGLE, BUSINESS`
    }

    @UseGuards(JwtAuthGuard)
    @Post('sign-plan')
    async signPlan(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateCompanyDto: UpdateCompanyDto
    ): Promise<ResponseCompanyDto> {
        const company = await this.companiesService.signPlan(id, updateCompanyDto)
        return new ResponseCompanyDto(company)
    }
}