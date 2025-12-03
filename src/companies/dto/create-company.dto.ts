import { Type } from 'class-transformer';
import { IsEmail, IsString, IsNotEmpty, MinLength, MaxLength, IsOptional, IsNumber, IsArray, IsObject, ValidateNested, IsBoolean } from 'class-validator';

class SupervisorPermissionsDto {
    @IsBoolean()
    deleteUser: boolean;

    @IsBoolean()
    changeQueueOrder: boolean;
}

class AgentPermissionsDto {
    @IsBoolean()
    createRealEstate: boolean;

    @IsBoolean()
    deleteRealEstate: boolean;
}

class AssistantPermissionsDto {
    @IsBoolean()
    createRealEstate: boolean;

    @IsBoolean()
    deleteRealEstate: boolean;
}

class NotificationSettingsDto {
    @IsBoolean()
    UserInactivity5days: boolean;

    @IsBoolean()
    NoRespondLeads: boolean;

    @IsBoolean()
    DailySummary: boolean;

    @IsBoolean()
    UserTasksDue: boolean;

    @IsBoolean()
    LeadsCriticalUpdates: boolean;

    @IsBoolean()
    RealEtateValueUpdates: boolean;
}

export class CreateCompanyDto {

    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(150)
    name: string;

    @IsString()
    @MaxLength(50)
    @IsNotEmpty()
    nationalDocument: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(10)
    @MaxLength(16)
    phoneNumber: string;

    @IsEmail()
    @IsNotEmpty()
    @MaxLength(80)
    email: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(20)
    zipCode: string

    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(100)
    street: string

    @IsString()
    @IsOptional()
    @MaxLength(6)
    streetNumber: string

    @IsString()
    @IsOptional()
    @MaxLength(50)
    complement: string

    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(100)
    neighborhood: string

    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(100)
    city: string

    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(100)
    state: string

    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(100)
    country: string

    @IsObject()
    @Type(() => SupervisorPermissionsDto)
    @ValidateNested()
    supervisorPermissions?: SupervisorPermissionsDto;

    @IsObject()
    @Type(() => AgentPermissionsDto)
    @ValidateNested()
    agentPermissions?: AgentPermissionsDto;

    @IsObject()
    @Type(() => AssistantPermissionsDto)
    @ValidateNested()
    assistantPermissions?: AssistantPermissionsDto;

    @IsObject()
    @Type(() => NotificationSettingsDto)
    @ValidateNested()
    notificationSettings?: NotificationSettingsDto;

}
