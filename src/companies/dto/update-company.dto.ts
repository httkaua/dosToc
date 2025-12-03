import { IsEmail, IsString, IsNotEmpty, MinLength, MaxLength, IsOptional, IsNumber, IsArray, IsBoolean, IsPositive, IsInt, IsIn, IsJSON, IsObject, ValidateNested } from 'class-validator';
import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateCompanyDto } from './create-company.dto';


export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {

    @IsArray()
    @IsOptional()
    supervisors?: number[]

    @IsArray()
    @IsOptional()
    agents?: number[]

    @IsArray()
    @IsOptional()
    assistants?: number[]

    @IsArray()
    @IsOptional()
    realEstatesEntity?: number[]

    @IsString()
    @IsOptional()
    @IsIn([
    'FREE',
    'SINGLE',
    'BUSINESS'
    ])
    signPlan?: string

    @IsBoolean()
    @IsOptional()
    deadlineToRespondOption?: boolean;

    @IsInt()
    @IsOptional()
    @IsPositive()
    deadlineDaysToRespond?: number;

    @IsInt()
    @IsOptional()
    @IsPositive()
    maxLeadsPerAgent?: number;

    @IsString()
    @IsOptional()
    defaultCurrency?: string;

}