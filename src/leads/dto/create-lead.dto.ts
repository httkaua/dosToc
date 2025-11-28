import { Transform } from 'class-transformer';
import { IsEmail, IsString, IsNotEmpty, MinLength, MaxLength, IsOptional, IsNumber, IsArray, Max, IsIn, ArrayMaxSize, ArrayUnique, IsPositive, Matches, IsNumberString } from 'class-validator';
import { RealEstate } from 'src/realestates/entities/real-estate.entity';

export class CreateLeadDto {

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(120)
  name: string;

  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(50)
  nationalDocument: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(18)
  phoneNumber: string;

  @IsString()
  @IsOptional()
  @MinLength(5)
  @MaxLength(80)
  email: string;

  @IsArray()
  @IsOptional()
  @MaxLength(20, { each: true })
  @ArrayMaxSize(10)
  @ArrayUnique()
  tags: string[];

  @IsArray()
  @IsOptional()
  @ArrayUnique()
  realEstatesInterested: RealEstate[];

  @IsArray()
  @IsOptional()
  @ArrayMaxSize(7)
  @ArrayUnique()
  @IsIn([
    'HOUSE',
    'LAND',
    'APARTMENT',
    'TOWNHOUSE',
    'SITE',
    'WAREHOUSE',
    'STUDIO/ COMMERCIAL ROOM'
    ], { each: true })
  propertyTypesInterested: string[];

  @IsArray()
  @IsOptional()
  @MaxLength(20, { each: true })
  @ArrayMaxSize(10)
  @ArrayUnique()
  citiesInterested: string[];

  @IsNumber( {maxDecimalPlaces: 2 })
  @IsOptional()
  @Max(1000000000)
  @IsPositive()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return parseFloat(value);
    }
    return value;
  })
  familyIncome: number;

  @IsNumber( {maxDecimalPlaces: 2 })
  @IsOptional()
  @Max(1000000000)
  @IsPositive()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return parseFloat(value);
    }
    return value;
  })
  inputValue: number;

  @IsNumber( {maxDecimalPlaces: 2 })
  @IsOptional()
  @Max(1000000000)
  @IsPositive()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return parseFloat(value);
    }
    return value;
  })
  realEstateMaxValue: number;

  @IsNumber( {maxDecimalPlaces: 2 })
  @IsOptional()
  @Max(1000000000)
  @IsPositive()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return parseFloat(value);
    }
    return value;
  })
  realEstateMaxMonthlyFee: number;

  @IsString()
  @IsOptional()
  @IsIn([
    'UNKNOWN',
    'EMPLOYMENT',
    'AUTONOMOUS',
    'FREELANCER',
    'CIVIL SERVANT',
    'BUSINESS OWNER',
    'RETIRED',
    'MIXED',
    'UNEMPLOYED',
    'OTHERS'
  ])
  sourceOfIncome: string;

  @IsString()
  @IsOptional()
  @IsIn([
    'NEW',
    'IN CONVERSATION',
    'INTERESTED',
    'SCHEDULED VISIT',
    'FINANCIAL CONSTRAINT',
    'FUTURE CONTACT',
    'IS A REAL ESTATE AGENT'
  ])
  status: string;

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
  sourceOfLead: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  observations: string;

}