import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards, Request, Get, Query, Patch, Param, ParseIntPipe, Delete, Inject } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ResponseLeadDto } from './dto/response-lead.dto';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { LeadsService } from './leads.service';
import { RolesGuard } from 'src/rbac/rbac.guard';
import { Roles } from 'src/rbac/role.decorator';
import { Role } from 'src/rbac/role.enum';
import type { LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";

@Controller('leads')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeadsController {
    constructor(
      private readonly leadsService: LeadsService,

      @Inject(WINSTON_MODULE_NEST_PROVIDER)
      private readonly logger: LoggerService,
    ) {}

  //* ----- LEAD CREATION ENDPOINTS ----- *//
  @Post('create')
  @Roles(
      Role.ADM_DEV,
      Role.DEV,
      Role.COMPANY_OWNER,
      Role.SUPERVISOR,
      Role.AGENT
  )
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createLeadDto: CreateLeadDto,
    @Request() req,
  ): Promise<ResponseLeadDto> {
    this.logger.log('POST /leads/create')
    return await this.leadsService.create(createLeadDto, req.user);
  }

  //* ----- LEAD QUERY ENDPOINTS ----- *//
  @Get()
  @Roles(
      Role.ADM_DEV,
      Role.DEV
  )
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<ResponseLeadDto[]> {
    this.logger.log('GET /leads')
    return await this.leadsService.findAll(['attendingUser', 'leadCompany', 'realEstatesInterested']);
  }

  @Get('in-my-company')
  @Roles(
      Role.ADM_DEV,
      Role.DEV,
      Role.COMPANY_OWNER
  )
  @HttpCode(HttpStatus.OK)
  async findAllOfMyCompany(
    @Request() req
  ): Promise<ResponseLeadDto[]> {
    this.logger.log('GET /leads/in-my-company')
    return await this.leadsService.findAllOfMyCompany(req.user.userID, ['attendingUser', 'leadCompany', 'realEstatesInterested']);
  }

  @Get('my-leads')
  @Roles(
      Role.ADM_DEV,
      Role.DEV,
      Role.COMPANY_OWNER,
      Role.SUPERVISOR,
      Role.AGENT
  )
  @HttpCode(HttpStatus.OK)
  async findAllOfUser(
    @Request() req
  ): Promise<ResponseLeadDto[]> {
    this.logger.log('GET /leads/my-leads')
    return await this.leadsService.findAllOfUser(req.user.userID, ['attendingUser', 'leadCompany', 'realEstatesInterested']);
  }

  @Get(':id')
  @Roles(
      Role.ADM_DEV,
      Role.DEV,
      Role.COMPANY_OWNER,
      Role.SUPERVISOR,
      Role.AGENT
  )
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<ResponseLeadDto> {
    this.logger.log('GET /leads/:id')
    return await this.leadsService.findOne(id, req.user);
  }

  //* ----- LEAD UPDATE ENDPOINTS ----- *//
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
    @Body() updateLeadDto: UpdateLeadDto,
    @Request() req,
  ): Promise<ResponseLeadDto> {
    this.logger.log('PATCH /leads/:id')
    const ids = {
      reqUser: req.user.userID,
      leadID: id,
    }
    return await this.leadsService.update(ids, updateLeadDto);
  }

  @Patch(':id/disable')
  @Roles(
      Role.ADM_DEV,
      Role.DEV,
      Role.COMPANY_OWNER,
      Role.SUPERVISOR
  )
  @HttpCode(HttpStatus.OK)
  async disable(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<ResponseLeadDto> {
    this.logger.log('PATCH /leads/:id/disable')
    return await this.leadsService.disable(id, req.user);
  }

  @Patch(':id/enable')
  @Roles(
      Role.ADM_DEV,
      Role.DEV,
      Role.COMPANY_OWNER,
      Role.SUPERVISOR
  )
  @HttpCode(HttpStatus.OK)
  async enable(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<ResponseLeadDto> {
    this.logger.log('PATCH /leads/:id/enable')
    return await this.leadsService.enable(id, req.user);
  }

  @Patch(':id/do-not-call-anymore')
  @Roles(
      Role.ADM_DEV,
      Role.DEV,
      Role.COMPANY_OWNER,
      Role.SUPERVISOR
  )
  @HttpCode(HttpStatus.OK)
  async doNotCallTrue(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<ResponseLeadDto> {
    this.logger.log('PATCH /leads/:id/do-not-call-anymore')
    return await this.leadsService.doNotCallTrue(id, req.user);
  }

  @Patch(':id/do-not-call-anymore-false')
  @Roles(
      Role.ADM_DEV,
      Role.DEV,
      Role.COMPANY_OWNER
  )
  @HttpCode(HttpStatus.OK)
  async doNotCallFalse(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<ResponseLeadDto> {
    this.logger.log('PATCH /leads/:id/do-not-call-anymore-false')
    return await this.leadsService.doNotCallFalse(id, req.user);
  }

  //* ----- LEAD DELETION ENDPOINT ----- *//
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
    this.logger.log('DELETE /leads/:id')
    return await this.leadsService.remove(id, req.user);
  }

  //* ----- LEAD DISTRIBUTION ENDPOINTS ----- *//
  //TODO
  /*
  @Patch('single-manual-distribution/:id')
  @HttpCode(HttpStatus.OK)
  async singleManualDistribution(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLeadDto: UpdateLeadDto,
    @Request() req,
  ): Promise<ResponseLeadDto> {

  }
  */

  //TODO
  /*
  @Patch('multiple-manual-distribution')
  @HttpCode(HttpStatus.OK)
  async multipleManualDistribution(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLeadDto: UpdateLeadDto,
    @Request() req,
  ): Promise<ResponseLeadDto> {

  }
  */
}
