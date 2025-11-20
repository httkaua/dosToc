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
  HttpException,
  ForbiddenException,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResponseUserDto } from './dto/response-user.dto';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { User } from './entities/user.entity';

@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

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
        const reqUser = req.user
        const user = await this.usersService.createByManager(createUserDto, reqUser);
        return new ResponseUserDto(user);
    }

    @UseGuards(JwtAuthGuard)
    @Post('create/development')
    @HttpCode(HttpStatus.CREATED)
    async createDevUser(
        @Body() createUserDto: CreateUserDto,
        @Query() query: Record<string, any>
    ): Promise<ResponseUserDto> {
        const user = await this.usersService.createDevUser(createUserDto, query);
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
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<ResponseUserDto> {
        const user = await this.usersService.findOne(id);
        return new ResponseUserDto(user);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateUserDto: UpdateUserDto, 
    ): Promise<ResponseUserDto> {
        const user = await this.usersService.update(id, updateUserDto);
        return new ResponseUserDto(user);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        await this.usersService.remove(id)
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/disable')
    async disable(@Param('id', ParseIntPipe) id: number): Promise<ResponseUserDto> {
        const user = await this.usersService.softDelete(id)
        return new ResponseUserDto(user)
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/enable')
    async enable(@Param('id', ParseIntPipe) id: number): Promise<ResponseUserDto> {
        const user = await this.usersService.restore(id)
        return new ResponseUserDto(user)
    }
    
}
