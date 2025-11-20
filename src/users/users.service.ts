import { ConflictException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException, Query, UnauthorizedException } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResponseUserDto } from './dto/response-user.dto';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

    async create(createUserDto: CreateUserDto): Promise<User> {
        
        const existingUser = await this.userRepository.findOne({
            where: [
                { email: createUserDto.email },
                { nationalDocument: createUserDto.nationalDocument },
                { phoneNumber: createUserDto.phoneNumber },
            ]
        });

        if (existingUser) {
            throw new ConflictException('User with this email, document, or phone already exists');
        }

        if (createUserDto.userCompany) {
            throw new ConflictException('This routes allows to create only tottaly new users. To create an user that belongs to a company, use another route.')
        }

        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

        const searchableName = createUserDto.username
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');

        const user = this.userRepository.create({
            ...createUserDto,
            password: hashedPassword,
            isDevUser: false,
            enabled: true,
            searchableName
        });

        return await this.userRepository.save(user);
    }

    async createDevUser(createUserDto: CreateUserDto, query: Record<string, any>): Promise<User> {

        if (!query.devKey || !process.env.DEV_USER_ENV_KEY) {
            throw new InternalServerErrorException('Missing keys');
        }

        if (query.devKey !== process.env.DEV_USER_ENV_KEY) {
            throw new ForbiddenException('Forbidden');
        }
        
        const existingUser = await this.userRepository.findOne({
            where: [
                { email: createUserDto.email },
                { nationalDocument: createUserDto.nationalDocument },
                { phoneNumber: createUserDto.phoneNumber },
            ]
        });

        if (existingUser) {
            throw new ConflictException('User with this email, document, or phone already exists');
        }

        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

        const searchableName = createUserDto.username
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');

        const user = this.userRepository.create({
            ...createUserDto,
            password: hashedPassword,
            isDevUser: true,
            userClassification: 2,
            enabled: true,
            searchableName,
        });

        return await this.userRepository.save(user);
    }

    async createByManager(createUserDto: CreateUserDto, req: Partial<User>): Promise<User> {
        
        const existingUser = await this.userRepository.findOne({
            where: [
                { email: createUserDto.email },
                { nationalDocument: createUserDto.nationalDocument },
                { phoneNumber: createUserDto.phoneNumber },
            ]
        });

        if (existingUser) {
            throw new ConflictException('User with this email, document, or phone already exists');
        }

        console.log(req)
        if (!req || !req.userID) {
            throw new NotFoundException('User not found. Please logout, then login again.')
        }

        const reqUser = await this.userRepository.findOne({
            where: { userID: req.userID }
        });

        if (!reqUser) {
            throw new NotFoundException('User not found. Please logout, then login again. 2000X')
        }

        if (!reqUser.userCompany) {
            throw new ConflictException(`You do not belong to any company, so you can't create another user right now. Please, create a company or request to your manager to insert you into your current company.`)
        }

        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

        const searchableName = createUserDto.username
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');

        const user = this.userRepository.create({
            ...createUserDto,
            password: hashedPassword,
            isDevUser: false,
            enabled: true,
            searchableName,
        });

        await this.userRepository.save(user);

        await this.insertOnTheTeam(reqUser, user)

        return user
    }

    async findAll(): Promise<User[]> {
        return await this.userRepository.find({
            relations: ['userCompany'],
            order: { createdAt: 'DESC' }
        });
    }

    async findOne(id: number): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { userID: id },
            relations: ['userCompany'],
        });

        if (!user) {
            throw new ConflictException(`User with ID ${id} not found`);
        }

        return user
    }

    async findOneByUsername(username: string): Promise<User | null> {
        const user = await this.userRepository.findOne({
            where: { username }
        })
        return user
  }

    async findUserWithPassword(username: string): Promise<User | null> {
        const user = await this.userRepository.findOne({
            where: { username },
            select: ['userID', 'username', 'password']
        })
        return user
  }

    async findByEmail(email: string): Promise<User | null> {
        return await this.userRepository.findOne({
            where: { email },
            select: ['userID', 'email', 'password', 'enabled'],
        });
    }

    async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
        const user = await this.findOne(id);

        if (updateUserDto.email || updateUserDto.nationalDocument || updateUserDto.phoneNumber) {
            const conflictUser = await this.userRepository.findOne({
                where: [
                    updateUserDto.email ? { email: updateUserDto.email } : {},
                    updateUserDto.nationalDocument ? { nationalDocument: updateUserDto.nationalDocument } : {},
                    updateUserDto.phoneNumber ? { phoneNumber: updateUserDto.phoneNumber } : {},
                ]
            });

        if (conflictUser && conflictUser.userID !== id) {
            throw new ConflictException('User with this email, document, or phone already exists');
            }
        }

        if (updateUserDto.username) {
            updateUserDto['searchableName'] = updateUserDto.username
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '');
        }

        Object.assign(user, updateUserDto);
        await this.userRepository.save(user);
        return user
    }

    async remove(id: number): Promise<void> {
        const user = await this.findOne(id);
        await this.userRepository.remove(user);
    }

    async softDelete(id: number): Promise<User> {
        const user = await this.findOne(id);
        user.enabled = false;
        await this.userRepository.save(user);
        return user;
    }

    async restore(id: number): Promise<User> {
        const user = await this.findOne(id);
        user.enabled = true;
        await this.userRepository.save(user);
        return user;
    }

    async insertOnTheTeam(manager: User, employee: User): Promise<User> {
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
            relations: ['managers']
        });

        if (!fullManager || !fullEmployee) {
            throw new NotFoundException('Manager or employee not found.');
        }

        const employeeAlreadyHas = fullEmployee.managers.some(m => m.userID === fullManager.userID);
        if (employeeAlreadyHas) {
            return fullEmployee;
        }

        fullEmployee.managers = [...fullEmployee.managers, fullManager];

        fullManager.underManagement = [...fullManager.underManagement, fullEmployee];

        await this.userRepository.save(fullManager);
        return await this.userRepository.save(fullEmployee);
    }

    async removeFromTheTeam(manager: User, employee: User): Promise<User> {
        if (!manager || !employee) {
            throw new NotFoundException('Manager or employee not found.');
        }

        const fullManager = await this.userRepository.findOne({
            where: { userID: manager.userID },
            relations: ['underManagement']
        });

        const fullEmployee = await this.userRepository.findOne({
            where: { userID: employee.userID },
            relations: ['managers']
        });

        if (!fullManager || !fullEmployee) {
            throw new NotFoundException('Manager or employee not found.');
        }

        fullEmployee.managers = fullEmployee.managers.filter(
            (m) => m.userID !== fullManager.userID
        );

        fullManager.underManagement = fullManager.underManagement.filter(
            (e) => e.userID !== fullEmployee.userID
        );

        await this.userRepository.save(fullManager);
        return await this.userRepository.save(fullEmployee);
    }

}
