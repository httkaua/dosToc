import { ConflictException, ForbiddenException, Injectable, InternalServerErrorException, Query, UnauthorizedException } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';

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
            searchableName,
            managers: createUserDto.managers || [],
            underManagement: createUserDto.underManagement || [],
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
            managers: createUserDto.managers || [],
            underManagement: createUserDto.underManagement || [],
        });

        return await this.userRepository.save(user);
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
        return await this.userRepository.save(user);
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

    /* ----- CREATING -----
    async findAllManagers(user: User): Promise<User[]> {
        return await this.userRepository.find({
            where: { managers: [] },
            order: { createdAt: 'DESC' }
        });
    }
    */

    /* ----- CREATING -----
    async findAllUnderManagement(user: User): Promise<User[]> {
        return await this.userRepository.find({
            where: { managers: [] },
            order: { createdAt: 'DESC' }
        });
    }
    */



    
}
