import { Transform, Type } from 'class-transformer';
import { IsEmail, IsString, IsNotEmpty, MinLength, MaxLength, IsOptional, IsNumber, IsArray, IsObject, ValidateNested, IsBoolean, IsIn, IsPositive, Max, ArrayMaxSize, ArrayUnique } from 'class-validator';

export class CreatePropertyOwnerDto {

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name: string

    @IsString()
    @IsNotEmpty()
    @MinLength(10)
    @MaxLength(18)
    phoneNumber: string;

    @IsString()
    @IsOptional()
    @MaxLength(80)
    email: string

    @IsString()
    @IsNotEmpty()
    @IsIn([
      'PERSON PROPERTY OWNER',
      'CONSTRUCTION COMPANY',
      'COMPANY PROPERTY OWNER',
    ])
    propertyOwnerType: string;

    @IsString()
    @IsOptional()
    @IsIn([
      'META ADS',
      'FACEBOOK ORGANIC',
      'INSTAGRAM ORGANIC',
      'WEBSITE "CHAVES NA MÃO"',
      'WEBSITE "IMÓVELWEB"',
      'OTHER WEBSITES',
      'GOOGLE',
      'REFERRAL',
      'WALK-IN',
      'COLD CALL',
      'EVENT OR TRADE SHOW',
      'UNKNOWN FROM INTERNET',
      'UNKNOWN',
      'OTHER'
    ])
    sourceOfPropertyOwner: string;

}
