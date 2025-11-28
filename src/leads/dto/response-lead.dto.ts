import { Exclude } from 'class-transformer';
import { Lead } from '../entities/lead.entity';
import { RealEstate } from 'src/realestates/entities/real-estate.entity';
import { User } from 'src/users/entities/user.entity';
import { Company } from 'src/companies/entities/company.entity';

export class ResponseLeadDto {
  leadID: number;
  name: string;
  searchableName: string;
  nationalDocument?: string;
  phoneNumber: string;
  tags: string[];
  realEstatesInterested: RealEstate[];
  propertyTypesInterested: string[];
  citiesInterested: string[];
  familyIncome: number;
  inputValue: number;
  realEstateMaxValue: number;
  realEstateMaxMonthlyFee: number;
  sourceOfIncome: string;
  status: string;
  sourceOfLead: string;
  observations: string;
  attendingUser: User;
  leadCompany: Company;
  doNotContact: boolean;


  constructor(partial: Partial<Lead>) {
    Object.assign(this, partial);
  }
}