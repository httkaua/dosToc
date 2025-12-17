import { Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../entities/user.entity";
import { ResponseUserDto } from "../dto/response-user.dto";
import type { LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";

@Injectable()
export class UserRepositoryService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  async findById(id: number, relations: string[]): Promise<User> {
    const start = Date.now()
    const user = await this.userRepository.findOne({
      where: { userID: id },
      relations,
    });

    if (!user) {
      this.logger.warn(`User not found`, {
        userID: id,
      });
      throw new NotFoundException(`User with ID ${id} not found.`);
    }

    if (this.logger.debug) {
      this.logger.debug('UserRepository.findById executed', {
        relations,
        durationMs: Date.now() - start,
      });
    }

    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    const start = Date.now()
    const user = this.userRepository.findOne({
      where: { username }
    });

    if (this.logger.debug) {
      this.logger.debug('UserRepository.findByUsername executed', {
        durationMs: Date.now() - start,
      });
    }

    return user
  }

  async findByEmail(email: string): Promise<User | null> {
    const start = Date.now()
    const user = this.userRepository.findOne({
      where: { email },
      select: ['userID', 'email', 'password', 'enabled'],
    });

    if (this.logger.debug) {
      this.logger.debug('UserRepository.findByEmail executed', {
        durationMs: Date.now() - start,
      });
    }

    return user
  }

  async findUserWithPasswordByEmail(email: string): Promise<User | null> {
    const start = Date.now()
    const user = this.userRepository.findOne({
      where: { email },
      select: ['userID', 'username', 'password']
    });

    if (this.logger.debug) {
      this.logger.debug('UserRepository.findByEmail executed', {
        durationMs: Date.now() - start,
      });
    }

    return user
  }

  async findAll(relations: string[] = []): Promise<User[]> {
    const start = Date.now();

    const users = await this.userRepository.find({
      relations,
      order: { createdAt: 'DESC' }
    });

    if (this.logger.debug) {
      this.logger.debug('UserRepository.findAll executed', {
        relations,
        resultCount: users.length,
        durationMs: Date.now() - start,
      });
    }

    return users;
  }

  async save(user: User): Promise<User> {
    const start = Date.now();
    const saveUser = this.userRepository.save(user);

    if (this.logger.debug) {
      this.logger.debug('UserRepository.save executed', {
        durationMs: Date.now() - start,
      });
    }

    return saveUser;
  }

  async create(userData: Partial<User>): Promise<User> {
    const start = Date.now();
    const user = this.userRepository.create(userData);
    const saveUser = this.save(user);

    if (this.logger.debug) {
      this.logger.debug('UserRepository.create executed', {
        durationMs: Date.now() - start,
      });
    }

    return saveUser;
  }

  async remove(user: User): Promise<void> {
    const start = Date.now();
    this.userRepository.remove(user);

    if (this.logger.debug) {
      this.logger.debug('UserRepository.create executed', {
        durationMs: Date.now() - start,
      });
    }
  }

  async findAllCompanyMembers(id: number): Promise<ResponseUserDto[]> {
    const start = Date.now()
    const users = await this.userRepository.find({
      where: { userCompany: { companyID: id } },
      relations: ['manager', 'underManagement'],
      order: { createdAt: 'DESC' }
    });

    if (!users || users.length === 0) {
      throw new NotFoundException(`No users found for company with ID ${id}.`);
    }

    const formattedUsers = users.map(user => ({
      ...user,
      manager: user.manager?.userID,
      underManagement: user.underManagement?.map(member => member.userID) || [],
    }));

    if (this.logger.debug) {
      this.logger.debug('UserRepository.findAllCompanyMembers executed', {
        resultCount: users.length,
        durationMs: Date.now() - start,
      });
    }

    return formattedUsers;
  }

  async findAllManagersOfUser(reqUser: User): Promise<User[]> {
    const start = Date.now()
    const managers = await this.userRepository.query(
      `
      WITH RECURSIVE manager_hierarchy AS (
        -- Base case: get direct manager
        SELECT u.*
        FROM "user" u
        WHERE u."userID" = (
          SELECT "managerID" 
          FROM "user" 
          WHERE "userID" = $1
        )
        
        UNION ALL
        
        -- Recursive case: get manager's manager
        SELECT u.*
        FROM "user" u
        INNER JOIN manager_hierarchy mh ON u."userID" = mh."managerID"
      )
      SELECT * FROM manager_hierarchy;
      `,
      [reqUser.userID]
    );

    if (this.logger.debug) {
      this.logger.debug('UserRepository.findAllManagersOfUser executed', {
        resultCount: managers.length,
        durationMs: Date.now() - start,
      });
    }

    return managers;
  }
}