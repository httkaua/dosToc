import { Transform, Type } from 'class-transformer';
import { IsEmail, IsString, IsNotEmpty, MinLength, MaxLength, IsOptional, IsNumber, IsArray, IsObject, ValidateNested, IsBoolean, IsIn, IsPositive, Max, ArrayMaxSize, ArrayUnique } from 'class-validator';
import { CreatePropertyOwnerDto } from 'src/propertyowners/dto/create-property-owner.dto';

export class CreateRealestateDto {

    @IsString()
    @IsNotEmpty()
    @IsIn([
      'HOUSE',
      'LAND',
      'APARTMENT',
      'TOWNHOUSE',
      'SITE',
      'WAREHOUSE',
      'STUDIO/ COMMERCIAL ROOM'
    ])
    propertyType: string;

    @IsString()
    @MaxLength(20)
    @IsOptional()
    condominiumBlock: string;

    @IsString()
    @MaxLength(20)
    @IsOptional()
    condominiumInternalNumber: string;

    @IsNumber({ maxDecimalPlaces: 0 })
    @IsOptional()
    @Max(200)
    @IsPositive()
    @Transform(({ value }) => {
        if (typeof value === 'string') {
        return parseFloat(value);
        }
        return value;
    })
    condominiumFloor: number;

    @IsString()
    @IsNotEmpty()
    @IsIn([
      'SALE',
      'RENTAL',
      'RENTAL AND SALE'
    ])
    rentalOrSale: string;

    @IsNumber({ maxDecimalPlaces: 2 })
    @IsOptional()
    @Max(100000000)
    @IsPositive()
    @Transform(({ value }) => {
        if (typeof value === 'string') {
        return parseFloat(value);
        }
        return value;
    })
    saleValue: number;

    @IsNumber({ maxDecimalPlaces: 2 })
    @IsOptional()
    @Max(100000000)
    @IsPositive()
    @Transform(({ value }) => {
        if (typeof value === 'string') {
        return parseFloat(value);
        }
        return value;
    })
    rentalValue: number;

    @IsNumber({ maxDecimalPlaces: 2 })
    @IsOptional()
    @Max(100000000)
    @IsPositive()
    @Transform(({ value }) => {
        if (typeof value === 'string') {
        return parseFloat(value);
        }
        return value;
    })
    assessedValue: number;

    @IsNumber({ maxDecimalPlaces: 2 })
    @IsOptional()
    @Max(100000000)
    @IsPositive()
    @Transform(({ value }) => {
        if (typeof value === 'string') {
        return parseFloat(value);
        }
        return value;
    })
    financingMaxValue: number;

    @IsBoolean()
    @IsOptional()
    exchange: boolean;

    @IsString()
    @IsOptional()
    @IsIn([
      'BRL',
      'USD',
      'EUR',
      'ARS',
      'PYG'
    ])
    currency: string;

    @IsBoolean()
    @IsOptional()
    financeable: boolean;

    @IsBoolean()
    @IsOptional()
    includesTax: boolean;

    @IsString()
    @IsOptional()
    @IsIn([
      'MONTHLY',
      'ANNUAL',
    ])
    taxFrequency: string;

    @IsNumber({ maxDecimalPlaces: 2 })
    @IsOptional()
    @Max(100000000)
    @IsPositive()
    @Transform(({ value }) => {
        if (typeof value === 'string') {
        return parseFloat(value);
        }
        return value;
    })
    taxValue: number;

    @IsString()
    @IsNotEmpty()
    @IsIn([
      'NEW',
      'USED',
      'IN THE CONSTRUCTION',
      'REFORMED',
      'IN REFORM'
    ])
    propertySituation: string;

    @IsString()
    @IsOptional()
    @IsIn([
      'ACTIVE',
      'INACTIVE',
      'SOLD',
      'SUSPENDED',
      'RENTED',
      'EXCHANGED',
      'UNDER OFFER',
      'IN NEGOTIATION'
    ])
    commercialSituation: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
    description: string

    @IsNumber({ maxDecimalPlaces: 0 })
    @IsOptional()
    @Max(100)
    @IsPositive()
    @Transform(({ value }) => {
        if (typeof value === 'string') {
        return parseFloat(value);
        }
        return value;
    })
    bedrooms: number;

    @IsNumber({ maxDecimalPlaces: 0 })
    @IsOptional()
    @Max(100)
    @IsPositive()
    @Transform(({ value }) => {
        if (typeof value === 'string') {
        return parseFloat(value);
        }
        return value;
    })
    livingRooms: number;

    @IsNumber({ maxDecimalPlaces: 0 })
    @IsOptional()
    @Max(100)
    @IsPositive()
    @Transform(({ value }) => {
        if (typeof value === 'string') {
        return parseFloat(value);
        }
        return value;
    })
    bathrooms: number;

    @IsNumber({ maxDecimalPlaces: 0 })
    @IsOptional()
    @Max(100)
    @IsPositive()
    @Transform(({ value }) => {
        if (typeof value === 'string') {
        return parseFloat(value);
        }
        return value;
    })
    parkingSpaces: number;

    @IsString()
    @IsNotEmpty()
    @MaxLength(20)
    zipCode: string

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    street: string

    @IsString()
    @IsNotEmpty()
    @MaxLength(6)
    streetNumber: string

    @IsString()
    @IsOptional()
    @MaxLength(50)
    complement: string

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    neighborhood: string

    @IsString()
    @IsOptional()
    @IsIn([
      'CENTRAL',
      'NORTH',
      'NORTHEAST',
      'EAST',
      'SOUTHEAST',
      'SOUTH',
      'SOUTHWEST',
      'WEST',
      'NORTHWEST',
      'UNKNOWN'
    ])
    cityRegion: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    city: string

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    state: string

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    country: string

    @IsNumber({ maxDecimalPlaces: 2 })
    @IsOptional()
    @Max(100000000)
    @IsPositive()
    @Transform(({ value }) => {
        if (typeof value === 'string') {
        return parseFloat(value);
        }
        return value;
    })
    landArea: number;

    @IsNumber({ maxDecimalPlaces: 2 })
    @IsOptional()
    @Max(100000000)
    @IsPositive()
    @Transform(({ value }) => {
        if (typeof value === 'string') {
        return parseFloat(value);
        }
        return value;
    })
    builtUpArea: number;

    @IsString()
    @IsOptional()
    @IsIn([
      'NORTH',
      'NORTHEAST',
      'EAST',
      'SOUTHEAST',
      'SOUTH',
      'SOUTHWEST',
      'WEST',
      'NORTHWEST',
      'UNKNOWN'
    ])
    face: string;

    @IsArray()
    @IsOptional()
    @MaxLength(20, { each: true })
    @ArrayMaxSize(10)
    @ArrayUnique()
    tags: string[];

    @IsBoolean()
    @IsOptional()
    published: boolean;

    @IsNumber({ maxDecimalPlaces: 0 })
    @IsNotEmpty()
    @Max(100)
    @IsPositive()
    @Transform(({ value }) => {
        if (typeof value === 'string') {
        return parseFloat(value);
        }
        return value;
    })
    propertyOwner: number;

}
