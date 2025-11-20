import { Exclude } from 'class-transformer';
import { User } from '../entities/user.entity';

export class ResponseUserDto {
  userID: number;
  userCompany: { companyID: number };
  username: string;
  searchableName: string;
  nationalDocument?: string;
  phoneNumber: string;
  email: string;
  profilePhoto?: string;
  userClassification?: number;
  isDevUser?: boolean;
  managers?: number[];
  underManagement?: number[];
  createdAt?: Date;
  updatedAt?: Date;
  enabled?: boolean;

  @Exclude()
  password: string;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}