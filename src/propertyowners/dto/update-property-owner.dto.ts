import { IsEmail, IsString, IsNotEmpty, MinLength, MaxLength, IsOptional, IsNumber, IsArray, IsBoolean, IsPositive, IsInt, IsIn, IsJSON, IsObject, ValidateNested } from 'class-validator';
import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreatePropertyOwnerDto } from './create-property-owner.dto';


export class UpdatePropertyOwnerDto extends PartialType(CreatePropertyOwnerDto) {}