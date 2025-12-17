import { Inject, Injectable } from "@nestjs/common";
import { User } from "../entities/user.entity";
import { CreateUserDto } from "../dto/create-user.dto";
import * as bcrypt from 'bcrypt';
import type { LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";

@Injectable()
export class UserTransformerService {

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}
  
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
    const start = Date.now()
    const hashedPassword = await this.hashPassword(createUserDto.password);
    const searchableName = this.generateSearchableName(createUserDto.username);

    const { userCompany, ...userData } = createUserDto;

    const transformedUser =  {
      ...userData,
      password: hashedPassword,
      searchableName,
    };

    if (this.logger.debug) {
      this.logger.debug('UserTransformer.prepareUserData executed', {
        durationMs: Date.now() - start,
      });
    }

    return transformedUser
  }
}