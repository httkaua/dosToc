import { BadRequestException, ConflictException, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../entities/user.entity";
import { CreateUserDto } from "../dto/create-user.dto";
import { Company } from "src/companies/entities/company.entity";
import { UpdateUserDto } from "../dto/update-user.dto";
import type { LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";

//* ----- BUSINESS ROLES VALIDATIONS SERVICE ----- *//
@Injectable()
export class UserValidatorService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  async validateUniqueUser(userDto: CreateUserDto | UpdateUserDto, excludeUserId?: number): Promise<void> {
    const existingUser = await this.userRepository.findOne({
      where: [
        { email: userDto.email },
        { nationalDocument: userDto.nationalDocument },
        { phoneNumber: userDto.phoneNumber },
      ]
    });

    if (existingUser && existingUser.userID !== excludeUserId) {
      this.logger.warn(`Operation closed by validation: User with this email, document, or phone already exists.`, {
        userID: existingUser.userID,
      });
      throw new ConflictException('User with this email, document, or phone already exists');
    }
  }

  validateCompanyMembership(user: User, company: Company): void {
    if (!user.userCompany) {
      this.logger.warn(`Operation closed by validation: User doesn't belong to any company.`, {
        userID: user.userID,
      });
      throw new ConflictException(`You do not belong to any company.`);
    }

    if (user.userCompany.companyID !== company.companyID) {
      this.logger.warn(`Operation closed by validation: User doesn't belong to the referring company.`, {
        userID: user.userID,
        userCompany: user.userCompany,
        companyID: company.companyID
      });
      throw new ConflictException(`You cannot alter or read anything for a company you do not belong to.`);
    }
  }

  validateSameCompany(reqUser: User, targetUser: Partial<User>): void {
    if (reqUser.userCompany.companyID !== targetUser.userCompany?.companyID) {
      this.logger.warn(`Operation closed by validation: User doesn't belong to the same company as the target user.`, {
        reqUserCompanyID: reqUser.userCompany.companyID,
        targetUserCompanyID: targetUser.userCompany?.companyID
      });
      throw new ConflictException(`You are not in the same company as the target user.`);
    }
  }

  validateGreaterHierarchy(reqUser: User, targetUser: CreateUserDto): void {
    if (!reqUser.userClassification || !targetUser.userClassification) {
      this.logger.warn(`Operation closed by validation: Users classification not set.`, {
        reqUserClassification: reqUser.userClassification,
        targetUserClassification: targetUser.userClassification
      });
      throw new BadRequestException(`One of the users are probably disabled. Please contact your manager or support.`);
    }

    if (reqUser.userClassification >= targetUser.userClassification) {
      this.logger.warn(`Operation closed by validation: User classification (hierarchy) is lower or equal than the target user classification.`, {
        reqUserClassification: reqUser.userClassification,
        targetUserClassification: targetUser.userClassification
      });
      throw new ConflictException(`You cannot do any operation with an user with an equal or higher classification than yours.`);
    }
  }

  validateGreaterOrSameHierarchy(reqUser: User, targetUser: User): void {
    if (!reqUser.userClassification || !targetUser.userClassification) {
      this.logger.warn(`Operation closed by validation: Users classification not set.`, {
        reqUserClassification: reqUser.userClassification,
        targetUserClassification: targetUser.userClassification
      });
      throw new BadRequestException(`One of the users are probably disabled. Please contact your manager or support.`);
    }

    if (reqUser.userClassification > targetUser.userClassification) {
      this.logger.warn(`Operation closed by validation: User classification (hierarchy) is lower than the target user classification.`, {
        reqUserClassification: reqUser.userClassification,
        targetUserClassification: targetUser.userClassification
      });
      throw new ConflictException(`You cannot do any operation with an user with an equal or higher classification than yours.`);
    }
  }

  generalManagerValidator(reqUser: User, targetUser: User): void {
    this.validateSameCompany(reqUser, targetUser);
    this.validateGreaterHierarchy(reqUser, targetUser);
  }

  validateDemote(reqUser: User, newClassification: number): void {
    if (reqUser.userClassification >= newClassification) {
      this.logger.warn(`Operation closed by validation: User new classification (hierarchy) is equal or higher than the current.`, {
        oldClassification: reqUser.userClassification,
        newClassification
      });
      throw new ConflictException(`You can't demote to a classification equal or higher than the current.`);
    }
  }

  validateAccessToAllowedUsers(allowedUsers: User[] , reqUser: User): void {
    if (!allowedUsers.some(user => user.userID === reqUser.userID)) {
      this.logger.warn(`Operation closed by validation: User are not part of the same team as the target user.`, {
        allowedUsers: allowedUsers.map(user => user.userID),
        userID: reqUser.userID
      });
      throw new UnauthorizedException('Access denied, you are not part of the team.');
    }
  }
  
}