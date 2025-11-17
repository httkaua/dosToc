import { Exclude } from 'class-transformer';

export class ResponseUserDto {
  userID: number;
  companyID: { companyID: number };
  username: string;
  searchableName: string;
  nationalDocument: string;
  phoneNumber: string;
  email: string;
  profilePhoto: string;
  userClassification: number;
  isDevUser: boolean;
  managers: number[];
  underManagement: number[];
  createdAt: Date;
  updatedAt: Date;
  enabled: boolean;

  @Exclude()
  password: string;

  constructor(partial: Partial<ResponseUserDto>) {
    Object.assign(this, partial);
  }
}