import { ConflictException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../entities/user.entity";
import { CreateUserDto } from "../dto/create-user.dto";
import { Company } from "src/companies/entities/company.entity";
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserTransformerService {
  generateSearchableName(username: string): string {
    return username
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async prepareUserData(createUserDto: CreateUserDto): Promise<Partial<User>> {
    const hashedPassword = await this.hashPassword(createUserDto.password);
    const searchableName = this.generateSearchableName(createUserDto.username);

    const { userCompany, ...userData } = createUserDto;

    return {
      ...userData,
      password: hashedPassword,
      searchableName,
    };
  }
}