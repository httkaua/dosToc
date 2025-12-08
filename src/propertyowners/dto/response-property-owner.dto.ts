import { Exclude } from 'class-transformer';
import { Company } from 'src/companies/entities/company.entity';
import { RealEstate } from 'src/realestates/entities/real-estate.entity';
import { User } from 'src/users/entities/user.entity';

export class ResponsePropertyOwnerDto {
  propertyOwnerID?: number;
  name?: string;
  searchableName?: string;
  phoneNumber?: string;
  email?: string;
  propertyOwnerType?: string;
  sourceOfPropertyOwner?: string;
  company?: Company | number;
  realEstatesOwning?: RealEstate[] | number[];

  constructor(partial: Partial<ResponsePropertyOwnerDto>) {
    Object.assign(this, partial);
  }
}