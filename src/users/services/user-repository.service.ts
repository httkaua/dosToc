import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../entities/user.entity";
import { ResponseUserDto } from "../dto/response-user.dto";

@Injectable()
export class UserRepositoryService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findById(id: number, relations: string[] = []): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { userID: id },
      relations,
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }
    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { username }
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      select: ['userID', 'email', 'password', 'enabled'],
    });
  }

  async findWithPassword(username: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { username },
      select: ['userID', 'username', 'password']
    });
  }

  async findAll(relations: string[] = []): Promise<User[]> {
    return this.userRepository.find({
      relations,
      order: { createdAt: 'DESC' }
    });
  }

  async save(user: User): Promise<User> {
    return this.userRepository.save(user);
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create(userData);
    return this.save(user);
  }

  async remove(user: User): Promise<void> {
    await this.userRepository.remove(user);
  }

async findAllCompanyMembers(id: number): Promise<ResponseUserDto[]> {
  const users = await this.userRepository.find({
    where: { userCompany: { companyID: id } },
    relations: ['manager', 'underManagement'],
    order: { createdAt: 'DESC' }
  });

  if (!users || users.length === 0) {
    throw new NotFoundException(`No users found for company with ID ${id}.`);
  }

  return users.map(user => ({
    ...user,
    manager: user.manager?.userID,
    underManagement: user.underManagement?.map(member => member.userID) || [],
  }));
}
}