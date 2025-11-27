import { Exclude } from 'class-transformer';
import { User } from '../entities/user.entity';

export class ResponseUserDto {
  userID: number;
  userCompany: {
    companyID?: number,
    name?: string,
  };
  username: string;
  searchableName: string;
  nationalDocument?: string;
  phoneNumber: string;
  email: string;
  profilePhoto?: string;
  userClassification?: number;
  isDevUser?: boolean;
  manager?: number;
  underManagement?: number[];
  createdAt?: Date;
  updatedAt?: Date;
  enabled?: boolean;

  @Exclude()
  password: string;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);

    if (partial.userCompany) {
      this.userCompany = {
        companyID: partial.userCompany.companyID,
        name: partial.userCompany.name,
      };
    }

    if (partial.manager) {
      this.manager = partial.manager.userID;
    } else {
      this.manager = undefined;
    }

    if (partial.underManagement && Array.isArray(partial.underManagement)) {
      this.underManagement = partial.underManagement.map(u => u.userID);
    }
  }
}