import { ConflictException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException, Query, UnauthorizedException } from '@nestjs/common';
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

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepositoryService: UserRepositoryService,
    private readonly validator: UserValidatorService,
    private readonly transformer: UserTransformerService,
    private readonly teamManagement: TeamManagementService,
  ) {}

  //* ----- TEAM SERVICES ----- *//
  async findAllTeamMembers(id: number): Promise<ResponseUserDto[]> {
    return this.teamManagement.findAllTeamMembers(id);
  }

  async addEmployeeToTeam(managerId: number, employeeId: number): Promise<User> {
    const manager = await this.findOne(managerId);
    const employee = await this.findOne(employeeId);
    return this.teamManagement.addEmployeeToManager(manager, employee);
  }

  async removeEmployeeFromTeam(managerId: number, employeeId: number): Promise<User> {
    const manager = await this.findOne(managerId);
    const employee = await this.findOne(employeeId);
    return this.teamManagement.removeEmployeeFromManager(manager, employee);
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    await this.validator.validateUniqueUser(createUserDto);

    if (createUserDto.userCompany) {
      throw new ConflictException(
        'This route allows creating only totally new users. To create a user that belongs to a company, use another route.'
      );
    }

    const userData = await this.transformer.prepareUserData(createUserDto);

    return this.userRepositoryService.create({
      ...userData,
      isDevUser: false,
    });
  }

  async createByManager(createUserDto: CreateUserDto, req: Partial<User>): Promise<User> {
    await this.validator.validateUniqueUser(createUserDto);

    if (!req?.userID) {
      throw new NotFoundException('User not found. Please logout, then login again.');
    }

    const reqUser = await this.userRepositoryService.findById(req.userID, ['userCompany']);
    
    if (!reqUser) {
      throw new NotFoundException('User not found. Please logout, then login again.');
    }

    if (createUserDto.userClassification <= reqUser.userClassification) {
      throw new ConflictException('You can only create users with a lower classification than yours.');
    }

    const company = await this.validator.validateCompanyMembership(reqUser);

    const userData = await this.transformer.prepareUserData(createUserDto);

    const targetUser = await this.userRepositoryService.create({
      ...userData,
      isDevUser: false,
      enabled: true,
      userCompany: company
    })

    await this.teamManagement.addEmployeeToManager(reqUser, targetUser);

    return targetUser;
  }

  async createDevUser(createUserDto: CreateUserDto, req: Partial<User>, query: Record<string, any>): Promise<User> {
    if (!query.devKey || !process.env.DEV_USER_ENV_KEY) {
      throw new InternalServerErrorException('Missing keys');
    }

    if (query.devKey !== process.env.DEV_USER_ENV_KEY) {
      throw new ForbiddenException('Forbidden');
    }

    if (!req?.userID) {
      throw new NotFoundException('User not found. Please logout, then login again.');
    }

    const reqUser = await this.userRepositoryService.findById(req.userID, ['userCompany']);

    await this.validator.validateUniqueUser(createUserDto);

    const company = await this.validator.validateCompanyMembership(reqUser);

    const userData = await this.transformer.prepareUserData(createUserDto);

    const targetUser = await this.userRepositoryService.create({
      ...userData,
      userCompany: company,
      isDevUser: true,
      userClassification: 2
    });

    return targetUser
  }

  async findAll(): Promise<User[]> {
    return this.userRepositoryService.findAll(['userCompany']);
  }

  async findOne(id: number): Promise<User> {

    const user = await this.userRepositoryService.findById(id, ['userCompany']);
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findOneByUsername(username: string): Promise<User | null> {
    return this.userRepositoryService.findByUsername(username);
  }

  async findUserWithPassword(username: string): Promise<User | null> {
    return this.userRepositoryService.findWithPassword(username);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepositoryService.findByEmail(email);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    user.userClassification = 7;
    await this.userRepositoryService.remove(user);
  }

  async restore(id: number): Promise<User> {
    const user = await this.findOne(id);
    user.enabled = true;
    user.userClassification = 6;
    return this.userRepositoryService.save(user);
  }

  async update(ids: Record<string, any>, updateUserDto: UpdateUserDto): Promise<User> {
    const userToUpdate = await this.userRepositoryService.findById(ids.userToUpdate, ['userCompany']);
    const reqUser = await this.userRepositoryService.findById(ids.reqUser, ['userCompany']);

    if (!userToUpdate || !reqUser) {
      throw new NotFoundException('User not found');
    }

    await this.validator.validateUniqueUser(updateUserDto, ids.userToUpdate);
    this.validator.validateSameCompany(reqUser, userToUpdate);

    if (updateUserDto.username) {
      updateUserDto['searchableName'] = this.transformer.generateSearchableName(
        updateUserDto.username
      );
    }

    Object.assign(userToUpdate, updateUserDto);
    return this.userRepositoryService.save(userToUpdate);
  }

  async softDelete(id: number): Promise<User> {
    const user = await this.userRepositoryService.findById(id);
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    user.enabled = false;
    user.userClassification = 7;
    return this.userRepositoryService.save(user);
  }

  async findAllCompanyMembers(id: number): Promise<ResponseUserDto[]> {
    const user = await this.findOne(id);
    this.validator.validateCompanyMembership(user);

    const companyMembers = await this.userRepositoryService.findAllCompanyMembers(id);
    return companyMembers;
  }

}