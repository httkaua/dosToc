import { IsEmail, IsString, IsNotEmpty, MinLength, MaxLength, IsOptional, IsNumber, IsArray } from 'class-validator';

export class CreateUserDto {
    @IsNumber()
    companyID: { companyID: number };

    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(150)
    name: string;

    @IsString()
    @MaxLength(50)
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
    @MinLength(6)
    @MaxLength(255)
    password: string;

    @IsString()
    @IsOptional()
    profilePhoto?: string;

    @IsNumber()
    @IsNotEmpty()
    userClassification: number;

    @IsArray()
    @IsOptional()
    managers?: number[];

    @IsArray()
    @IsOptional()
    underManagement?: number[];
}