import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../entities/user.entity";
import { CreateUserDto } from "../dto/create-user.dto";
import { Company } from "src/companies/entities/company.entity";
import { UpdateUserDto } from "../dto/update-user.dto";

//* ----- BUSINESS ROLES VALIDATIONS SERVICE ----- *//
@Injectable()
export class UserValidatorService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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
      throw new ConflictException('User with this email, document, or phone already exists');
    }
  }

  validateCompanyMembership(user: User, company: Company): void {
    if (!user.userCompany) {
      throw new ConflictException(
        `You do not belong to any company, so you can't create another user right now.`
      );
    }

    if (user.userCompany.companyID !== company.companyID) {
      throw new ConflictException(
        `You cannot alter or read anything for a company you do not belong to.`
      );
    }
  }

  validateSameCompany(reqUser: User, targetUser: Partial<User>): void {

    if (reqUser.userCompany.companyID !== targetUser.userCompany?.companyID) {
      throw new ConflictException(`You are not in the same company as the target user.`);
    }
  }

  validateGreaterHierarchy(reqUser: User, targetUser: CreateUserDto): void {
    if (!reqUser.userClassification || !targetUser.userClassification) {
      throw new BadRequestException(
        `One of the users are probably disabled. Please contact your manager or support.`
      );
    }

    if (reqUser.userClassification >= targetUser.userClassification) {
      throw new ConflictException(
        `You cannot do any operation with an user with an equal or higher classification than yours.`
      );
    }
  }

  validateGreaterOrSameHierarchy(reqUser: User, targetUser: User): void {
    if (!reqUser.userClassification || !targetUser.userClassification) {
      throw new BadRequestException(
        `One of the users are probably disabled. Please contact your manager or support.`
      );
    }

    if (reqUser.userClassification > targetUser.userClassification) {
      throw new ConflictException(
        `You cannot do any operation with an user with an equal or higher classification than yours.`
      );
    }
  }

  generalManagerValidator(reqUser: User, targetUser: User): void {
    this.validateSameCompany(reqUser, targetUser);
    this.validateGreaterHierarchy(reqUser, targetUser);
  }

  validateDemote(reqUser: User, newClassification: number): void {
    if (reqUser.userClassification >= newClassification) {
      throw new ConflictException(`You can't demote to a classification equal or higher than the current.`);
    }
  }

  validateAccessToAllowedUsers(allowedUsers: User[] , reqUser: User): void {
    if (!allowedUsers.some(user => user.userID === reqUser.userID)) {
      throw new UnauthorizedException('Access denied, you are not part of the team.');
    }
  }
  
}