import { IsEmail, IsString, IsNotEmpty, MinLength, MaxLength, IsOptional, IsNumber, IsArray } from 'class-validator';
import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';


export class UpdateUserDto extends PartialType(
    OmitType(CreateUserDto, ['password'] as const)
) {}