import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "../entities/user.entity";
import { Repository } from "typeorm";
import { ResponseUserDto } from "../dto/response-user.dto";
import type { LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Injectable()
export class TeamManagementService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  async findAllTeamMembers(managerId: number): Promise<ResponseUserDto[]> {
    const userManager = await this.userRepository.findOne({
      where: { userID: managerId },
      relations: ['manager', 'underManagement']
    });

    if (!userManager) {
      this.logger.warn(`User manager not found`, 'Team Management Service');
      throw new NotFoundException('User manager not found.');
    }

    this.logger.log(`TeamManagementService.findAllTeamMembers executed, total members: ${userManager.underManagement.length}`, 'Team Management Service');


  return userManager.underManagement.map(user => ({
    ...user,
    manager: user.manager?.userID,
    underManagement: user.underManagement?.map(member => member.userID) || [],
  }));

  }

  async addEmployeeToManager(manager: User, employee: User): Promise<User> {
    if (!manager || !employee) {
      this.logger.warn(`Invalid attempt to add employee without set manager and employee,
        manager: ${manager.userID},
        employee: ${employee.userID}`, 'Team Management Service');
      throw new NotFoundException('Manager or employee not found.');
    }

    if (manager.userID === employee.userID) {
      this.logger.warn(`Invalid attempt to add employee to the user itself.`, 'Team Management Service');
      throw new ConflictException('A user cannot manage themselves.');
    }

    const fullManager = await this.userRepository.findOne({
      where: { userID: manager.userID },
      relations: ['underManagement']
    });

    const fullEmployee = await this.userRepository.findOne({
      where: { userID: employee.userID },
      relations: ['manager']
    });

    if (!fullManager || !fullEmployee) {
      this.logger.warn(`Invalid attempt to add employee to user because manager or employee was not found,
      manager: ${fullManager?.userID},
      employee: ${fullEmployee?.userID}`, 'Team Management Service');
      throw new NotFoundException('Manager or employee not found.');
    }

    if (fullEmployee.manager && fullEmployee.manager.userID === fullManager.userID) {
      this.logger.log('This employee is already managed by the specified manager', 'Team Management Service')
      return fullEmployee
    }

    fullEmployee.manager = fullManager;
    fullManager.underManagement = [...fullManager.underManagement, fullEmployee];

    await this.userRepository.save(fullManager);
    await this.userRepository.save(fullEmployee);

    this.logger.log(`TeamManagementService.addEmployeeToManager executed successfully`, 'Team Management Service');

    return fullEmployee
  }

  async removeEmployeeFromManager(manager: User, employee: User): Promise<User> {
    if (!manager || !employee) {
      this.logger.warn(`Invalid attempt to remove employee without set manager and employee,
      manager: ${manager.userID},
      employee: ${employee.userID}`, 'Team Management Service');
      throw new NotFoundException('Manager or employee not found.');
    }

    const fullManager = await this.userRepository.findOne({
      where: { userID: manager.userID },
      relations: ['underManagement']
    });

    const fullEmployee = await this.userRepository.findOne({
      where: { userID: employee.userID },
      relations: ['manager']
    });

    if (!fullManager || !fullEmployee) {
      this.logger.warn(`Invalid attempt to remove employee to user because manager or employee was not found,
      manager: ${fullManager?.userID},
      employee: ${fullEmployee?.userID}`, 'Team Management Service');
      throw new NotFoundException('Manager or employee not found.');
    }

    fullEmployee.manager = null;

    fullManager.underManagement = fullManager.underManagement.filter(
      e => e.userID !== fullEmployee.userID
    );

    await this.userRepository.save(fullManager);
    await this.userRepository.save(fullEmployee);

    this.logger.log(`TeamManagementService.removeEmployeeFromManager executed successfully`, 'Team Management Service');

    return fullEmployee
  }

  async redistributeEmployees(fromManager: User, toManager: User): Promise<void> {
    if (!fromManager || !toManager) {
      this.logger.warn(`Invalid attempt to redistribute employees without set old manager and new manager,
        fromManager: ${fromManager?.userID},
        toManager: ${toManager?.userID}`, 'Team Management Service');
      throw new NotFoundException('One or both managers not set.');
    }

    const fullFromManager = await this.userRepository.findOne({
      where: { userID: fromManager.userID },
      relations: ['underManagement']
    });

    const fullToManager = await this.userRepository.findOne({
      where: { userID: toManager.userID },
      relations: ['underManagement']
    });

    if (!fullFromManager || !fullToManager) {
      this.logger.warn(`Invalid attempt to remove employee to user because manager or employee was not found,
        fromManager: ${fullFromManager?.userID},
        toManager: ${fullToManager?.userID}`, 'Team Management Service');
      throw new NotFoundException('One or both managers not found.');
    }

    for (const employee of fullFromManager.underManagement) {
      employee.manager = fullToManager;
      await this.userRepository.save(employee);
    }

    fullToManager.underManagement = [
      ...fullToManager.underManagement,
      ...fullFromManager.underManagement
    ];
    fullFromManager.underManagement = [];

    await this.userRepository.save(fullToManager);
    await this.userRepository.save(fullFromManager);

    this.logger.log(`TeamManagementService.redistributeEmployees executed successfully`, 'Team Management Service');
  }
}