import { IsEmail, IsString, IsNotEmpty, MinLength, MaxLength, IsOptional, IsNumber, IsArray, IsBoolean, IsPositive, IsInt, IsIn, IsJSON, IsObject, ValidateNested } from 'class-validator';
import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateRealestateDto } from './create-realestate.dto';


export class UpdateRealestateDto extends PartialType(CreateRealestateDto) {}