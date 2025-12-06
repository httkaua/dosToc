import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards, Request, Get, Query, Patch, Param, ParseIntPipe, Delete } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RealestatesService } from './realestates.service';
import { CreateRealestateDto } from './dto/create-realestate.dto';
import { ResponseRealestateDto } from './dto/response-realestate.dto';
import { UpdateRealestateDto } from './dto/update-realestate.dto';

@Controller('real-estates')
@UseGuards(JwtAuthGuard)
export class RealestatesController {
    constructor(
      private readonly realestatesService: RealestatesService,
    ) {}

  //* ----- REAL ESTATE CREATION ENDPOINTS ----- *//
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createLeadDto: CreateRealestateDto,
    @Request() req,
  ): Promise<ResponseRealestateDto> {
    return await this.realestatesService.create(createLeadDto, req.user);
  }

  //* ----- REAL ESTATE QUERY ENDPOINTS ----- *//
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<ResponseRealestateDto[]> {
    return await this.realestatesService.findAll(['creatorUser', 'realEstateCompany']);
  }

  @Get('in-my-company')
  @HttpCode(HttpStatus.OK)
  async findAllOfMyCompany(
    @Request() req
  ): Promise<ResponseRealestateDto[]> {
    return await this.realestatesService.findAllOfMyCompany(req.user.userID, ['creatorUser', 'realEstateCompany']);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<ResponseRealestateDto> {
    return await this.realestatesService.findOne(id, req.user);
  }

  //* ----- REAL ESTATE UPDATE ENDPOINTS ----- *//
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLeadDto: UpdateRealestateDto,
    @Request() req,
  ): Promise<ResponseRealestateDto> {
    const ids = {
      reqUser: req.user.userID,
      leadID: id,
    }
    return await this.realestatesService.update(ids, updateLeadDto);
  }

  @Patch(':id/disable')
  @HttpCode(HttpStatus.OK)
  async disable(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<ResponseRealestateDto> {
    return await this.realestatesService.disable(id, req.user);
  }

  @Patch(':id/enable')
  @HttpCode(HttpStatus.OK)
  async enable(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<ResponseRealestateDto> {
    return await this.realestatesService.enable(id, req.user);
  }

  //* ----- REAL ESTATE DELETION ENDPOINT ----- *//
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<void> {
    return await this.realestatesService.remove(id, req.user);
  }
}
