import { Company } from 'src/companies/entities/company.entity';
import { RealEstate } from 'src/realestates/entities/real-estate.entity';
import { User } from 'src/users/entities/user.entity';

export class ResponseTaskDto {
  taskID?: number;
  creatorUser?: User | number;
  responsibleUser?: User | number;
  company?: Company | number;
  taskType: string;
  observations?: string;
  deadline: Date;
  notifyByEmail?: boolean;
  status: string;

  constructor(partial: Partial<ResponseTaskDto>) {
    Object.assign(this, partial);
  }
}