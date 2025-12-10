import { Body, Request, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ResponseCompanyDto } from './dto/response-company.dto';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { UsersService } from 'src/users/users.service';
import { CompanyValidatorService } from './services/company-validator.service';
import { UserValidatorService } from 'src/users/services/user-validator.service';
import { RolesGuard } from 'src/rbac/rbac.guard';
import { Roles } from 'src/rbac/role.decorator';
import { Role } from 'src/rbac/role.enum';

@Controller('companies')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompaniesController {
    constructor(
        private readonly companiesService: CompaniesService,
        private readonly usersService: UsersService,
        private readonly validator: CompanyValidatorService,
        private readonly usersValidator: UserValidatorService,
    ) {}

    @Post('create')
    @Roles(
        Role.ADM_DEV,
        Role.DEV,
        Role.COMPANY_OWNER
    )
    @HttpCode(HttpStatus.CREATED)
    async create(
        @Body() createCompanyDto: CreateCompanyDto,
        @Request() req
    ): Promise<ResponseCompanyDto> {
        const reqUser = req.user
        const company = await this.companiesService.create(reqUser, createCompanyDto);
        return new ResponseCompanyDto(company);
    }

    @Get()
    @Roles(
        Role.ADM_DEV,
        Role.DEV
    )
    async findAll(): Promise<ResponseCompanyDto[]> {
        const companies = await this.companiesService.findAll();
        return companies.map(company => new ResponseCompanyDto(company));
    }

    @Get(':id')
    @Roles(
        Role.ADM_DEV,
        Role.DEV,
        Role.COMPANY_OWNER
    )
    async findOne(
        @Param('id', ParseIntPipe) id: number,
        @Request() req
    ): Promise<ResponseCompanyDto> {
        const user = await this.usersService.findOne(req.user.userID)
        const company = await this.companiesService.findOne(id);

        this.usersValidator.validateCompanyMembership(user, company);
        return new ResponseCompanyDto(company);
    }

    @Patch(':id')
    @Roles(
        Role.ADM_DEV,
        Role.DEV,
        Role.COMPANY_OWNER
    )
    async update(
        @Param('id', ParseIntPipe) companyID: number,
        @Body() updateCompanyDto: UpdateCompanyDto,
        @Request() req
    ): Promise<ResponseCompanyDto> {
        const ids = {
            companyID: companyID,
            userID: req.user.userID
        }

        const user = await this.usersService.findOne(req.user.userID)
        const company = await this.companiesService.findOne(companyID);
        
        this.usersValidator.validateCompanyMembership(user, company);

        const companyUpdate = await this.companiesService.update(ids, updateCompanyDto);
        return new ResponseCompanyDto(companyUpdate);
    }

    @Get('plans-options')
    @Roles(
        Role.ADM_DEV,
        Role.DEV,
        Role.COMPANY_OWNER
    )
    async viewPlans(): Promise<string> {
        return `FREE, SINGLE, BUSINESS`
    }

    @Post('sign-plan/:id')
    @Roles(
        Role.ADM_DEV,
        Role.DEV,
        Role.COMPANY_OWNER
    )
    async signPlan(
        @Param('id', ParseIntPipe) id: number,
        @Query('new-plan') newPlan: string,
        @Request() req
    ): Promise<ResponseCompanyDto> {

        const user = await this.usersService.findOne(req.user.userID)
        const company = await this.companiesService.findOne(id);
        
        this.usersValidator.validateCompanyMembership(user, company);

        const companyWithUpdatedPlan = await this.companiesService.signPlan(id, newPlan)
        return new ResponseCompanyDto(companyWithUpdatedPlan)
    }
}