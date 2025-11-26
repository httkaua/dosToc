import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "../entities/user.entity";
import { Repository } from "typeorm";
import { ResponseUserDto } from "../dto/response-user.dto";

@Injectable()
export class TeamManagementService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAllTeamMembers(managerId: number): Promise<ResponseUserDto[]> {
    const manager = await this.userRepository.findOne({
      where: { userID: managerId },
      relations: ['manager', 'underManagement']
    });

    if (!manager) {
      throw new NotFoundException('Manager not found.');
    }

  return manager.underManagement.map(user => ({
    ...user,
    manager: user.manager?.userID,
    underManagement: user.underManagement?.map(member => member.userID) || [],
  }));

  }

  async addEmployeeToManager(manager: User, employee: User): Promise<User> {
    if (!manager || !employee) {
      throw new NotFoundException('Manager or employee not found.');
    }

    if (manager.userID === employee.userID) {
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
      throw new NotFoundException('Manager or employee not found.');
    }

    
    if (fullEmployee.userID == fullManager.userID) {
      return fullEmployee;
    }

    fullEmployee.manager = fullManager;
    fullManager.underManagement = [...fullManager.underManagement, fullEmployee];

    await this.userRepository.save(fullManager);
    return await this.userRepository.save(fullEmployee);
  }

  async removeEmployeeFromManager(manager: User, employee: User): Promise<User> {
    if (!manager || !employee) {
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
      throw new NotFoundException('Manager or employee not found.');
    }

    fullEmployee.manager = null;

    fullManager.underManagement = fullManager.underManagement.filter(
      e => e.userID !== fullEmployee.userID
    );

    await this.userRepository.save(fullManager);
    return await this.userRepository.save(fullEmployee);
  }
}