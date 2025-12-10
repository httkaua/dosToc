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
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResponseUserDto } from './dto/response-user.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UserValidatorService } from './services/user-validator.service';
import { Roles } from 'src/rbac/role.decorator';
import { Role } from 'src/rbac/role.enum';
import { RolesGuard } from 'src/rbac/rbac.guard';

@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly userValidatorService: UserValidatorService,
  ) {}

  //* ----- USER CREATION ENDPOINTS ----- *//
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto): Promise<ResponseUserDto> {
    const user = await this.usersService.create(createUserDto);
    return new ResponseUserDto(user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('create-by-manager')
  @Roles(
    Role.ADM_DEV,
    Role.DEV,
    Role.COMPANY_OWNER,
    Role.SUPERVISOR
  )
  @HttpCode(HttpStatus.CREATED)
  async createByManager(
    @Body() createUserDto: CreateUserDto,
    @Request() req,
  ): Promise<ResponseUserDto> {
    const user = await this.usersService.createByManager(
      createUserDto,
      req.user,
    );
    return new ResponseUserDto(user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('create/development')
  @Roles(
    Role.ADM_DEV,
    Role.DEV
  )
  @HttpCode(HttpStatus.CREATED)
  async createDevUser(
    @Body() createUserDto: CreateUserDto,
    @Request() req,
    @Query() query: Record<string, any>,
  ): Promise<ResponseUserDto> {
    const user = await this.usersService.createDevUser(
      createUserDto,
      req.user,
      query,
    );
    return new ResponseUserDto(user);
  }

  //* ----- USER QUERY ENDPOINTS ----- *//
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  @Roles(
    Role.ADM_DEV,
    Role.DEV
  )
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<ResponseUserDto[]> {
    const users = await this.usersService.findAll();
    return users;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('in-my-company')
  @Roles(
    Role.ADM_DEV,
    Role.DEV,
    Role.COMPANY_OWNER,
  )
  @HttpCode(HttpStatus.OK)
  async findInMyCompany(
    @Request() req
  ): Promise<ResponseUserDto[]> {
    const user = await this.usersService.findOne(req.user.userID)

    const users = await this.usersService.findAllCompanyMembers(req.user.userID, user.userCompany.companyID);
    return users;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
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
  ): Promise<ResponseUserDto> {
    const reqUser = await this.usersService.findOne(req.user.userID);
    const targetUser = await this.usersService.findOne(id);

    if (reqUser.userID === targetUser.userID) {
      return new ResponseUserDto(targetUser);
    }

    this.userValidatorService.generalManagerValidator(reqUser, targetUser);
    return new ResponseUserDto(targetUser);
  }

  //* ----- USER UPDATE ENDPOINTS ----- *//
  @UseGuards(JwtAuthGuard, RolesGuard)
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
    @Body() updateUserDto: UpdateUserDto,
    @Request() req,
  ): Promise<ResponseUserDto> {
    const reqUser = await this.usersService.findOne(req.user.userID);
    const targetUser = await this.usersService.findOne(id);

    if (reqUser.userID !== targetUser.userID) {
      this.userValidatorService.generalManagerValidator(reqUser, targetUser);
    }

    const ids = {
      reqUser: req.user.userID,
      userToUpdate: id,
    };

    const user = await this.usersService.update(ids, updateUserDto);
    return new ResponseUserDto(user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
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
  ): Promise<ResponseUserDto> {
    const reqUser = await this.usersService.findOne(req.user.userID);
    const targetUser = await this.usersService.findOne(id);

    if (reqUser.userID !== targetUser.userID) {
      this.userValidatorService.generalManagerValidator(reqUser, targetUser);
    }

    const user = await this.usersService.softDelete(id);
    return new ResponseUserDto(user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
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
  ): Promise<ResponseUserDto> {
    const reqUser = await this.usersService.findOne(req.user.userID);
    const targetUser = await this.usersService.findOne(id);

    if (reqUser.userID !== targetUser.userID) {
      this.userValidatorService.generalManagerValidator(reqUser, targetUser);
    }

    const user = await this.usersService.restore(id);
    return new ResponseUserDto(user);
  }

  //* ----- USER DELETION ENDPOINT ----- *//
  @UseGuards(JwtAuthGuard, RolesGuard)
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
    const reqUser = await this.usersService.findOne(req.user.userID);
    const targetUser = await this.usersService.findOne(id);

    if (reqUser.userID !== targetUser.userID) {
      this.userValidatorService.generalManagerValidator(reqUser, targetUser);
    }

    await this.usersService.remove(req.user.userID, targetUser.userID);
  }
}