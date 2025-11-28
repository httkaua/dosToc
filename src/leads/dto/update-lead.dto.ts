import { PartialType } from '@nestjs/mapped-types';
import { IsEmail, IsString, IsNotEmpty, MinLength, MaxLength, IsOptional, IsNumber, IsArray, Max, IsIn, ArrayMaxSize, ArrayUnique, IsPositive, Matches } from 'class-validator';
import { CreateLeadDto } from './create-lead.dto';

export class UpdateLeadDto extends PartialType(CreateLeadDto) {}