import { ConflictException, ForbiddenException, Inject, Injectable, InternalServerErrorException, NotFoundException, Query, UnauthorizedException } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResponseUserDto } from './dto/response-user.dto';
import { Company } from 'src/companies/entities/company.entity';
import { UserRepositoryService } from './services/user-repository.service';
import { UserValidatorService } from './services/user-validator.service';
import { UserTransformerService } from './services/user-transformer.service';
import { TeamManagementService } from './services/team-management.service';
import { CompaniesService } from 'src/companies/companies.service';
import type { LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';


@Injectable()
export class UsersService {

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,

    private readonly userRepositoryService: UserRepositoryService,
    private readonly validator: UserValidatorService,
    private readonly transformer: UserTransformerService,
    private readonly teamManagement: TeamManagementService,
    private readonly companiesService: CompaniesService,
  ) {}

  //* ----- TEAM SERVICES ----- *//
  async findAllTeamMembers(id: number): Promise<ResponseUserDto[]> {
  if (this.logger.debug) {
    this.logger.debug('Function called: findAllTeamMembers');
  }
    return this.teamManagement.findAllTeamMembers(id);
  }

  async addEmployeeToTeam(managerId: number, employeeId: number): Promise<User> {
    if (this.logger.debug) {
      this.logger.debug(`Function called: addEmployeeToTeam`, 'Users Service');
    }
    const manager = await this.findOne(managerId);
    const employee = await this.findOne(employeeId);
    this.validator.validateSameCompany(manager, employee);
    this.validator.validateGreaterHierarchy(manager, employee);

    return this.teamManagement.addEmployeeToManager(manager, employee);
  }

  async removeEmployeeFromTeam(managerId: number, employeeId: number): Promise<User> {
    if (this.logger.debug) {
      this.logger.debug(`Function called: removeEmployeeFromTeam`, 'Users Service');
    }
    const manager = await this.findOne(managerId);
    const employee = await this.findOne(employeeId);

    this.validator.validateSameCompany(manager, employee);
    this.validator.validateGreaterHierarchy(manager, employee);

    return this.teamManagement.removeEmployeeFromManager(manager, employee);
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    if (this.logger.debug) {
      this.logger.debug(`Creating user: ${createUserDto.email}`, 'Users Service');
    }
    
    await this.validator.validateUniqueUser(createUserDto);

    if (createUserDto.userCompany) {
      this.logger.warn(`Invalid attempt to create user with company: ${createUserDto.userCompany.companyID}`, 'Users Service');
      throw new ConflictException(
        'This route allows creating only totally new users. To create a user that belongs to a company, use another route.'
      );
    }

    const userData = await this.transformer.prepareUserData(createUserDto);
    const user = await this.userRepositoryService.create({
      ...userData,
      isDevUser: false,
    });

    this.logger.log(`User created successfully: userID: ${user.userID}`, 'Users Service');

    return user

  }

  async createByManager(createUserDto: CreateUserDto, req: Partial<User>): Promise<User> {
    if (this.logger.debug) {
      this.logger.debug(`Creating user by manager: ${createUserDto.email}`, 'Users Service');
    }
    
    await this.validator.validateUniqueUser(createUserDto);

    if (!req?.userID) {
      this.logger.warn(`Invalid attempt to create user without manager userID set: ${req.userID}`, 'Users Service');
      throw new NotFoundException('UserID not set. Please logout, then login again.');
    }

    const reqUser = await this.userRepositoryService.findById(req.userID, ['userCompany']);
    
    if (!reqUser) {
      this.logger.warn(`Invalid attempt to create user without invalid manager userID: ${req.userID}`, 'Users Service');
      throw new NotFoundException('User not found. Please logout, then login again.');
    }

    if (createUserDto.userClassification <= reqUser.userClassification) {
      this.logger.warn(`Invalid attempt to create user with an user user with lower classification level,
        reqUserClassification: ${reqUser.userClassification},
        targetUserClassification: ${createUserDto.userClassification}`,
        'Users Service');
      throw new ConflictException('You can only create users with a lower classification than yours.');
    }

    const company = await this.companiesService.findOne(reqUser.userCompany.companyID);
    this.validator.validateCompanyMembership(reqUser, company)

    const userData = await this.transformer.prepareUserData(createUserDto);

    const targetUser = await this.userRepositoryService.create({
      ...userData,
      isDevUser: false,
      enabled: true,
      userCompany: company
    })

    await this.teamManagement.addEmployeeToManager(reqUser, targetUser);
    await this.companiesService.assignMemberToPosition(
      {
        companyID: company.companyID,
        reqUser: reqUser.userID,
        targetUser: targetUser.userID,
      }, targetUser.userClassification
    );

    this.logger.log(`User created successfully: ${targetUser.userID}`, 'Users Service');

    return targetUser;
  }

  async createDevUser(createUserDto: CreateUserDto, req: Partial<User>, query: Record<string, any>): Promise<User> {
    if (this.logger.debug) {
      this.logger.debug(`Creating dev user: ${createUserDto.email}`, 'Users Service');
    }
    
    if (!query.devKey || !process.env.DEV_USER_ENV_KEY) {
      this.logger.warn(`Invalid attempt to create user without valid setting keys`, 'Users Service');
      throw new InternalServerErrorException('Missing keys');
    }

    if (query.devKey !== process.env.DEV_USER_ENV_KEY) {
      this.logger.warn(`Invalid attempt to create user without valid setting keys`, 'Users Service');
      throw new ForbiddenException('Forbidden');
    }

    if (!req?.userID) {
      this.logger.warn(`Invalid attempt to create user without userID`, 'Users Service');
      throw new NotFoundException('User not found. Please logout, then login again.');
    }

    const reqUser = await this.userRepositoryService.findById(req.userID, ['userCompany']);

    await this.validator.validateUniqueUser(createUserDto);

    const company = await this.companiesService.findOne(reqUser.userCompany.companyID);
    this.validator.validateCompanyMembership(reqUser, company)

    const userData = await this.transformer.prepareUserData(createUserDto);

    const targetUser = await this.userRepositoryService.create({
      ...userData,
      userCompany: company,
      isDevUser: true,
      userClassification: 2
    });

    this.logger.log(`User created successfully: ${targetUser.userID}`, 'Users Service');

    return targetUser
  }

  async findAll(): Promise<ResponseUserDto[]> {
    if (this.logger.debug) {
      this.logger.debug(`Function called: findAll`, 'Users Service');
    }
    
    const users = await this.userRepositoryService.findAll([
      'userCompany',
      'manager',
      'underManagement'
    ]);

    if (!users || users.length === 0) {
      this.logger.warn('No users found');
      throw new NotFoundException('Users not found', 'Users Service');
    }

    this.logger.log('Users found', 'Users Service');

    return users.map(user => new ResponseUserDto(user));
  }

  async findOne(id: number): Promise<User> {
    if (this.logger.debug) {
      this.logger.debug(`Function called: findOne`, 'Users Service');
    }

    const user = await this.userRepositoryService.findById(id, ['userCompany']);
    
    if (!user) {
      this.logger.warn(`User not found: ${id}`);
      throw new NotFoundException(`User not found: ${id}`, 'Users Service');
    }

    this.logger.log(`User found: ${id}`, 'Users Service');

    return user;
  }

  async findOneByUsername(username: string): Promise<User | null> {
    if (this.logger.debug) {
      this.logger.debug(`Function called: findOneByUsername`, 'Users Service');
    }
    return this.userRepositoryService.findByUsername(username);
  }

  async findUserWithPasswordByEmail(email: string): Promise<User | null> {
    if (this.logger.debug) {
      this.logger.debug(`Function called: findUserWithPasswordByEmail`, 'Users Service');
    }
    const user = this.userRepositoryService.findUserWithPasswordByEmail(email);

    return user
  }

  async findByEmail(email: string): Promise<User | null> {
    if (this.logger.debug) {
      this.logger.debug(`Function called: findByEmail`, 'Users Service');
    }
    return this.userRepositoryService.findByEmail(email);
  }

  async remove(reqUser: number, targetUser: number): Promise<void> {
    if (this.logger.debug) {
      this.logger.debug(`Removing user: ${targetUser}`, 'Users Service');
    }
    const user = await this.userRepositoryService.findById(targetUser, ['manager', 'userCompany']);

    if (!user.manager) {
      this.logger.warn(`Invalid attempt to remove an user that haven't a manager`, 'Users Service');
      throw new ConflictException('Cannot delete a user without a manager.');
    }

    await this.companiesService.validateSupervisorToDeleteUser(user, user.userCompany)

    if (user.underManagement && user.underManagement.length > 0) {
      await this.teamManagement.redistributeEmployees(user, user.manager);
    }

    user.userClassification = 7;
    await this.userRepositoryService.remove(user);

    this.logger.log(`User removed successfully: ${user.userID}`, 'Users Service');
  }

  async restore(id: number): Promise<User> {
    if (this.logger.debug) {
      this.logger.debug(`Restoring user: ${id}`, 'Users Service');
    }
    const user = await this.findOne(id);

    if (user.enabled == true && user.userClassification <= 6) {
      this.logger.log(`User already active: manager: ${user.manager}, enabled: ${user.enabled}`, 'Users Service');
      return user
    }

    user.enabled = true;
    user.userClassification = 6;
    await this.userRepositoryService.save(user);

    this.logger.log(`User restored successfully: ${user.userID}`, 'Users Service');

    return user
  }

  async update(ids: Record<string, any>, updateUserDto: UpdateUserDto): Promise<User> {
    if (this.logger.debug) {
      this.logger.debug(`Updating user: ${ids.userToUpdate}`, 'Users Service');
    }
    const userToUpdate = await this.userRepositoryService.findById(ids.userToUpdate, ['userCompany']);
    const reqUser = await this.userRepositoryService.findById(ids.reqUser, ['userCompany']);

    if (!userToUpdate || !reqUser) {
      this.logger.warn(`Invalid attempt to update a not found user: ${ids.userToUpdate}`, 'Users Service');
      throw new NotFoundException(`User not found.`);
    }

    await this.validator.validateUniqueUser(updateUserDto, ids.userToUpdate);
    this.validator.validateSameCompany(reqUser, userToUpdate);
    this.validator.validateGreaterOrSameHierarchy(reqUser, userToUpdate);

    if (updateUserDto.username) {
      updateUserDto['searchableName'] = this.transformer.generateSearchableName(
        updateUserDto.username
      );
    }

    Object.assign(userToUpdate, updateUserDto);
    this.userRepositoryService.save(userToUpdate);

    this.logger.log(`User updated successfully: ${userToUpdate.userID}`, 'Users Service');

    return userToUpdate
  }

  async softDelete(id: number): Promise<User> {
    if (this.logger.debug) {
      this.logger.debug(`Soft deleting user: ${id}`, 'Users Service');
    }
    const user = await this.userRepositoryService.findById(id, ['manager']);

    if (!user.manager) {
      this.logger.warn(`Invalid attempt to soft delete an user without a manager`, 'Users Service');
      throw new ConflictException('Cannot delete a user without a manager.');
    }

    if (user.underManagement && user.underManagement.length > 0) {
      await this.teamManagement.redistributeEmployees(user, user.manager);
    }

    if (user.enabled == false && user.userClassification == 7) {
      return user
    }

    user.enabled = false;
    user.userClassification = 7;
    this.userRepositoryService.save(user);

    this.logger.log(`User soft deleted successfully: ${user.userID}`, 'Users Service');

    return user
  }

  async findAllCompanyMembers(userID: number, companyID: number): Promise<ResponseUserDto[]> {
    if (this.logger.debug) {
      this.logger.debug(`Function called: findAllCompanyMembers`, 'Users Service');
    }

    const user = await this.findOne(userID);
    const company = await this.companiesService.findOne(user.userCompany.companyID);
    this.validator.validateCompanyMembership(user, company)

    const companyMembers = await this.userRepositoryService.findAllCompanyMembers(companyID);

    this.logger.log(`Members of ${user.username}'s Company found`, 'Users Service');

    return companyMembers;
  }

  async findAllManagersOfUser(reqUser: User): Promise<User[]> {
    if (this.logger.debug) {
      this.logger.debug(`Function called: findAllManagersOfUser`, 'Users Service');
    }
    const users = await this.userRepositoryService.findAllManagersOfUser(reqUser);
    this.logger.log(`Managers of ${reqUser.username} found`, 'Users Service');

    return users
  }

  async validateDemote(user: User, newClassification: number): Promise<void> {
    if (this.logger.debug) {
      this.logger.debug(`Function called: validateDemote`, 'Users Service');
    }
    this.validator.validateDemote(user, newClassification);
  }

  async validateCompanyMembership(user: User, company: Company) {
    if (this.logger.debug) {
      this.logger.debug(`Function called: validateCompanyMembership`, 'Users Service');
    }
    this.validator.validateCompanyMembership(user, company)
  }

  //* Allowed users generally:
  //* The user who creates the object being affected,
  //* Your managers, managers of managers until the company owner.
  //* That is, the whole team
  async validateAccessToAllowedUsers(allowedUsers: User[] , reqUser: User): Promise<void> {
    if (this.logger.debug) {
      this.logger.debug(`Function called: validateAccessToAllowedUsers`, 'Users Service');
    }
    this.validator.validateAccessToAllowedUsers(allowedUsers, reqUser)
  }

}