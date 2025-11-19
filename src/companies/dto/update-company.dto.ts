import { IsEmail, IsString, IsNotEmpty, MinLength, MaxLength, IsOptional, IsNumber, IsArray, IsBoolean, IsPositive, IsInt } from 'class-validator';
import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateCompanyDto } from './create-company.dto';
import { User } from 'src/users/entities/user.entity';
import { RealEstate } from 'src/realestates/entities/real-estate.entity';
import type { Permissions as supervisorPermissionsInterface } from '../entities/supervisorPermissions.interface';
import type { Permissions as agentPermissionsInterface } from '../entities/agentPermissions.interface';
import type { Permissions as assistantPermissionsInterface } from '../entities/assistantPermissions.interface';
import type { Settings as notificationSettingsInterface } from '../entities/notificationSettings.interface';


export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {

    @IsArray()
    @IsOptional()
    supervisors?: User[]

    @IsArray()
    @IsOptional()
    agents?: User[]

    @IsArray()
    @IsOptional()
    assistants?: User[]

    @IsArray()
    @IsOptional()
    realEstatesEntity?: RealEstate[]

    @IsString()
    @IsOptional()
    signPlan?: string

    @IsString()
    @IsOptional()
    supervisorPermissions?: supervisorPermissionsInterface;

    @IsString()
    @IsOptional()
    agentPermissions?: agentPermissionsInterface;

    @IsString()
    @IsOptional()
    assistantPermissions?: assistantPermissionsInterface;

    @IsString()
    @IsOptional()
    notificationSettings?: notificationSettingsInterface;

    @IsBoolean()
    @IsOptional()
    deadlineToRespondOption?: boolean;

    @IsInt()
    @IsPositive()
    deadlineDaysToRespond?: number;

    @IsInt()
    @IsPositive()
    maxLeadsPerAgent?: number;

    @IsString()
    @IsOptional()
    defaultCurrency?: string;

}