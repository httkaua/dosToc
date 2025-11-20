import { IsEmail, IsString, IsNotEmpty, MinLength, MaxLength, IsOptional, IsNumber, IsArray } from 'class-validator';
import { User } from 'src/users/entities/user.entity';

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

}
