import { Exclude } from 'class-transformer';
import { RealEstate } from 'src/realestates/entities/real-estate.entity';
import { User } from 'src/users/entities/user.entity';
import type { Permissions as supervisorPermissionsInterface } from '../entities/supervisorPermissions.interface';
import type { Permissions as agentPermissionsInterface } from '../entities/agentPermissions.interface';
import type { Permissions as assistantPermissionsInterface } from '../entities/assistantPermissions.interface';
import type { Settings as notificationSettingsInterface } from '../entities/notificationSettings.interface';

export class ResponseCompanyDto {
  companyID: number;
  name: string;
  nationalDocument: string;
  phoneNumber: string;
  email: string;
  supervisors: User[];
  agents: User[];
  assistants: User[];
  realEstatesEntity: RealEstate[];
  zipCode: string;
  street: string;
  streetNumber: string;
  neighborhood: string;
  city: string;
  state: string;
  country: string;
  signPlan: string;
  supervisorPermissions: supervisorPermissionsInterface;
  agentPermissions: agentPermissionsInterface;
  assistantPermissions: assistantPermissionsInterface;
  notificationSettings: notificationSettingsInterface;
  deadlineToRespondOption: boolean;
  deadlineDaysToRespond: number;
  maxLeadsPerAgent: number;
  defaultCurrency: string;

  @Exclude()
  owner: User;

  constructor(partial: Partial<ResponseCompanyDto>) {
    Object.assign(this, partial);
  }
}