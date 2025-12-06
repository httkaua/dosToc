import { Exclude } from 'class-transformer';
import { Company } from 'src/companies/entities/company.entity';
import { User } from 'src/users/entities/user.entity';

export class ResponseRealestateDto {
  realEstateID?: number;
  easyID?: string;
  propertyType?: string;
  condominiumBlock?: string;
  condominiumInternalNumber?: string;
  condominiumFloor?: number;
  rentalOrSale?: string;
  saleValue?: number;
  rentalValue?: number;
  assessedValue?: number;
  financingMaxValue?: number;
  exchange?: boolean;
  currency?: string;
  financeable?: boolean;
  includesTax?: boolean;
  taxFrequency?: string;
  taxValue?: number;
  propertySituation?: string;
  commercialSituation?: string;
  description?: string;
  bedrooms?: number;
  livingRooms?: number;
  bathrooms?: number;
  parkingSpaces?: number;
  zipCode?: string;
  street?: string;
  streetNumber?: string;
  complement?: string;
  neighborhood?: string;
  cityRegion?: string;
  city?: string;
  state?: string;
  country?: string;
  landArea?: number;
  builtUpArea?: number;
  face?: string;
  tags?: string[];
  media?: string[];
  published?: boolean;
  creatorUser?: User;
  realEstateCompany?: Company;
  enabled?: boolean;

  constructor(partial: Partial<ResponseRealestateDto>) {
    Object.assign(this, partial);
  }
}