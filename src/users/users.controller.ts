import {
  Controller,
  Request,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  ClassSerializerInterceptor,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResponseUserDto } from './dto/response-user.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UserValidatorService } from './services/user-validator.service';

@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly userValidatorService: UserValidatorService
  ) {}

  //* ----- TEAM ENDPOINTS ----- *//
  @UseGuards(JwtAuthGuard)
  @Get('team')
  @HttpCode(HttpStatus.OK)
  async getMyTeam(@Request() req): Promise<ResponseUserDto[]> {    
      const managerID = Number(req.user.userID);
      
      const teamMembers = await this.usersService.findAllTeamMembers(managerID);
      return teamMembers
  }

  @UseGuards(JwtAuthGuard)
  @Get('team/all-company-members')
  async findAllCompanyMembers(
    @Request() req
  ): Promise<ResponseUserDto[]> {
    console.log(req.user.userID)
    const user = await this.usersService.findOne(req.user.userID);
    const users = await this.usersService.findAllCompanyMembers(user.userCompany.companyID);
    return users
  }

  @UseGuards(JwtAuthGuard)
  @Post('team/add-to-team')
  @HttpCode(HttpStatus.OK)
  async addToTeam(
    @Query('managerId', ParseIntPipe) managerId: number,
    @Query('employeeId', ParseIntPipe) employeeId: number,
    @Request() req,
  ): Promise<ResponseUserDto> {

    const employee = await this.usersService.addEmployeeToTeam(managerId, employeeId);
    return new ResponseUserDto(employee);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('team/remove-from-the-team')
  @HttpCode(HttpStatus.OK)
  async removeFromTeam(
    @Query('managerId', ParseIntPipe) managerId: number,
    @Query('employeeId', ParseIntPipe) employeeId: number,
    @Request() req
  ): Promise<ResponseUserDto> {
    const employee = await this.usersService.removeEmployeeFromTeam(managerId, employeeId);
    return new ResponseUserDto(employee);
  }

  //* ----- USER ENDPOINTS ----- *//
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto): Promise<ResponseUserDto> {
    const user = await this.usersService.create(createUserDto);
    return new ResponseUserDto(user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('create-by-manager')
  @HttpCode(HttpStatus.CREATED)
  async createByManager(
    @Body() createUserDto: CreateUserDto,
    @Request() req
  ): Promise<ResponseUserDto> {
    const reqUser = req.user;
    const user = await this.usersService.createByManager(createUserDto, reqUser);
    return new ResponseUserDto(user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('create/development')
  @HttpCode(HttpStatus.CREATED)
  async createDevUser(
    @Body() createUserDto: CreateUserDto,
    @Request() req,
    @Query() query: Record<string, any>
  ): Promise<ResponseUserDto> {
    const user = await this.usersService.createDevUser(createUserDto, req.user, query);
    return new ResponseUserDto(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(): Promise<ResponseUserDto[]> {
    const users = await this.usersService.findAll();
    return users.map(user => new ResponseUserDto(user));
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<ResponseUserDto> {
    const reqUser = await this.usersService.findOne(req.user.userID);
    const targetUser = await this.usersService.findOne(id);

    if (reqUser.userID == targetUser.userID) {
      return new ResponseUserDto(targetUser)
    }

    this.userValidatorService.generalManagerValidator(reqUser, targetUser)
    return new ResponseUserDto(targetUser);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req
  ): Promise<ResponseUserDto> {
    const reqUser = await this.usersService.findOne(req.user.userID);
    const targetUser = await this.usersService.findOne(id);
    const ids = {
      reqUser: req.user.userID,
      userToUpdate: id
    };

    if (reqUser.userID == targetUser.userID) {
      const user = await this.usersService.update(ids, updateUserDto);
      return new ResponseUserDto(user);
    }

    this.userValidatorService.generalManagerValidator(reqUser, targetUser)

    const user = await this.usersService.update(ids, updateUserDto);
    return new ResponseUserDto(user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<void> {
    const reqUser = await this.usersService.findOne(req.user.userID);
    const targetUser = await this.usersService.findOne(id);

    if (reqUser.userID == targetUser.userID) {
      const user = await this.usersService.findOne(id);
      await this.usersService.remove(user.userID);
    }

    this.userValidatorService.generalManagerValidator(reqUser, targetUser)

    const user = await this.usersService.findOne(id);
    await this.usersService.remove(user.userID);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/disable')
  async disable(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<ResponseUserDto> {
    const reqUser = await this.usersService.findOne(req.user.userID);
    const targetUser = await this.usersService.findOne(id);

    if (reqUser.userID == targetUser.userID) {
      const user = await this.usersService.softDelete(id);
      return new ResponseUserDto(user);
    }

    this.userValidatorService.generalManagerValidator(reqUser, targetUser)

    const user = await this.usersService.softDelete(id);
    return new ResponseUserDto(user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/enable')
  async enable(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ): Promise<ResponseUserDto> {
    const reqUser = await this.usersService.findOne(req.user.userID);
    const targetUser = await this.usersService.findOne(id);

    if (reqUser.userID == targetUser.userID) {
      const user = await this.usersService.restore(id);
      return new ResponseUserDto(user);
    }

    this.userValidatorService.generalManagerValidator(reqUser, targetUser)

    const user = await this.usersService.restore(id);
    return new ResponseUserDto(user);
  }

}