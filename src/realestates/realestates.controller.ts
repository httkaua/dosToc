import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards, Request, Get, Query, Patch, Param, ParseIntPipe, Delete } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RealestatesService } from './realestates.service';
import { CreateRealestateDto } from './dto/create-realestate.dto';
import { ResponseRealestateDto } from './dto/response-realestate.dto';
import { UpdateRealestateDto } from './dto/update-realestate.dto';
import { RolesGuard } from 'src/rbac/rbac.guard';
import { Roles } from 'src/rbac/role.decorator';
import { Role } from 'src/rbac/role.enum';

@Controller('real-estates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RealestatesController {
    constructor(
      private readonly realestatesService: RealestatesService,
    ) {}

  //* ----- REAL ESTATE CREATION ENDPOINTS ----- *//
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
    @Body() createRealestateDto: CreateRealestateDto,
    @Request() req,
  ): Promise<ResponseRealestateDto> {
    return await this.realestatesService.create(createRealestateDto, req.user);
  }

  //* ----- REAL ESTATE QUERY ENDPOINTS ----- *//
  @Get()
  @Roles(
      Role.ADM_DEV,
      Role.DEV
  )
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<ResponseRealestateDto[]> {
    return await this.realestatesService.findAll(['creatorUser', 'realEstateCompany']);
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
  ): Promise<ResponseRealestateDto[]> {
    return await this.realestatesService.findAllOfMyCompany(req.user.userID, ['creatorUser', 'realEstateCompany']);
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
  ): Promise<ResponseRealestateDto> {
    return await this.realestatesService.findOne(id, req.user);
  }

  //* ----- REAL ESTATE UPDATE ENDPOINTS ----- *//
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
    @Body() updateRealestateDto: UpdateRealestateDto,
    @Request() req,
  ): Promise<ResponseRealestateDto> {
    const ids = {
      reqUser: req.user.userID,
      realestateID: id,
    }
    return await this.realestatesService.update(ids, updateRealestateDto);
  }

  @Patch(':id/disable')
  @Roles(
      Role.ADM_DEV,
      Role.DEV,
      Role.COMPANY_OWNER,
      Role.SUPERVISOR,
      Role.ASSISTANT
  )
  @HttpCode(HttpStatus.OK)
  async disable(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<ResponseRealestateDto> {
    return await this.realestatesService.disable(id, req.user);
  }

  @Patch(':id/enable')
  @Roles(
      Role.ADM_DEV,
      Role.DEV,
      Role.COMPANY_OWNER,
      Role.SUPERVISOR,
      Role.ASSISTANT
  )
  @HttpCode(HttpStatus.OK)
  async enable(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<ResponseRealestateDto> {
    return await this.realestatesService.enable(id, req.user);
  }

  //* ----- REAL ESTATE DELETION ENDPOINT ----- *//
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
    return await this.realestatesService.remove(id, req.user);
  }
}
