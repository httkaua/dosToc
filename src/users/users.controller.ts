import {
  Controller,
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
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResponseUserDto } from './dto/response-user.dto';
import { ConfigService } from '@nestjs/config';

@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() createUserDto: CreateUserDto): Promise<ResponseUserDto> {
        const user = await this.usersService.create(createUserDto);
        return new ResponseUserDto(user);
    }

    @Post('development')
    @HttpCode(HttpStatus.CREATED)
    async createDevUser(@Body() createUserDto: CreateUserDto, @Query() query: Record<string, any>): Promise<ResponseUserDto> {
        const user = await this.usersService.createDevUser(createUserDto, query);
        return new ResponseUserDto(user);
    }

    @Get()
    async findAll(): Promise<ResponseUserDto[]> {
        const users = await this.usersService.findAll();
        return users.map(user => new ResponseUserDto(user));
    }

    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<ResponseUserDto> {
        const user = await this.usersService.findOne(id);
        return new ResponseUserDto(user);
    }

    @Patch(':id')
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateUserDto: UpdateUserDto, 
    ): Promise<ResponseUserDto> {
        const user = await this.update(id, updateUserDto);
        return new ResponseUserDto(user);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
        await this.usersService.remove(id)
    }

    @Patch(':id/disable')
    async disable(@Param('id', ParseIntPipe) id: number): Promise<ResponseUserDto> {
        const user = await this.usersService.softDelete(id)
        return new ResponseUserDto(user)
    }

    @Patch(':id/enable')
    async enable(@Param('id', ParseIntPipe) id: number): Promise<ResponseUserDto> {
        const user = await this.usersService.restore(id)
        return new ResponseUserDto(user)
    }
    
}
