import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { TaskRepositoryService } from './services/tasks-repository.service';
import { TaskValidatorService } from './services/tasks-validator.service';
import { UsersService } from 'src/users/users.service';
import { CompaniesService } from 'src/companies/companies.service';
import { User } from 'src/users/entities/user.entity';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { Lead } from 'src/leads/entities/lead.entity';
import { LeadsService } from 'src/leads/leads.service';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
    constructor(
        private readonly repository: TaskRepositoryService,
        private readonly validator: TaskValidatorService,
        private readonly usersService: UsersService,
        private readonly leadsService: LeadsService
    ) {}

    async create(dto: CreateTaskDto, reqUser: User): Promise<Task> {
        const user = await this.usersService.findOne(reqUser.userID);
        const deadline = this.deadlineCalculator(dto.deadlineInDays)
        const responsibleUser = await this.usersService.findOne(reqUser.userID)
        const managers = await this.usersService.findAllManagersOfUser(responsibleUser);
        const allowedUsers = [...managers, responsibleUser];
        let targetLead: Lead | undefined = undefined

        if (!user.userCompany) {
            throw new ConflictException('User must belong to a company to create tasks.');
        }

        await this.validator.validateUniqueTaskInCompany(dto, reqUser.userCompany);    
        await this.usersService.validateAccessToAllowedUsers(allowedUsers, user);

        if (dto.targetLead) {
            targetLead = await this.leadsService.findOne(dto.targetLead, user)
        }

        return this.repository.create({
            ...dto,
            creatorUser: user,
            responsibleUser,
            targetLead,
            taskCompany: user.userCompany,
            deadline
        });
    }

    async findAll(relations: string[]): Promise<Task[]> {
        return await this.repository.findAll(relations);
    }

    async findAllOfMyCompany(userID: number, relations: string[]): Promise<Task[]> {
        const user = await this.usersService.findOne(userID)
        const companyID = user.userCompany.companyID

        if (!companyID) {
            throw new NotFoundException('Company not found.')
        }

        return await this.repository.findAllCompanyTasks(companyID, relations);
    }

    async findAllOfUser(userID: number, relations: string[]): Promise<Task[]> {
        const user = await this.usersService.findOne(userID)
        const companyID = user.userCompany.companyID

        if (!companyID) {
            throw new NotFoundException('Company not found.')
        }

        return await this.repository.findAllCompanyTasks(companyID, relations);
    }

    async findOne(id: number, reqUser: User): Promise<Task> {
        const task = await this.repository.findById(id, ['creatorUser', 'responsibleUser', 'targetLead', 'taskCompany']);
        const user = await this.usersService.findOne(reqUser.userID)

        if (!task) {
            throw new NotFoundException(`Task with ID ${id} not found`)
        }

        const managers = await this.usersService.findAllManagersOfUser(task.responsibleUser);
        const allowedUsers = [...managers, task.responsibleUser];

        await this.usersService.validateAccessToAllowedUsers(allowedUsers, reqUser);
        await this.usersService.validateCompanyMembership(user, task.taskCompany)

        return task;
    }

    async update(ids: Record<string, any>, dto: UpdateTaskDto): Promise<Task> {
        const taskToUpdate = await this.repository.findById(ids.taskID, ['creatorUser', 'responsibleUser', 'targetLead', 'taskCompany']);
        const reqUser = await this.usersService.findOne(ids.reqUser);
        let deadline = taskToUpdate?.deadline

        if (!reqUser) {
            throw new NotFoundException('User not found');
        }

        if (!taskToUpdate) {
            throw new NotFoundException(`Task with ID ${ids.taskID} not found`);
        }

        if (dto.deadlineInDays) {
            deadline = this.deadlineCalculator(dto.deadlineInDays)
        }

        const managers = await this.usersService.findAllManagersOfUser(taskToUpdate.responsibleUser);
        const allowedUsers = [...managers, taskToUpdate.responsibleUser];
        
        await this.usersService.validateAccessToAllowedUsers(allowedUsers, reqUser);
        await this.usersService.validateCompanyMembership(reqUser, taskToUpdate.taskCompany)

        Object.assign(taskToUpdate, dto);
        return this.repository.save(taskToUpdate);
    }

    async remove(id: number, reqUser: User): Promise<void> {
        const task = await this.repository.findById(id, ['taskCompany']);
        const user = await this.usersService.findOne(reqUser.userID)

        if (!task) {
            throw new NotFoundException(`Task with ID ${id} not found`)
        }

        const managers = await this.usersService.findAllManagersOfUser(task.responsibleUser);
        const allowedUsers = [...managers, task.responsibleUser];
        
        await this.usersService.validateAccessToAllowedUsers(allowedUsers, reqUser);
        await this.usersService.validateCompanyMembership(user, task.taskCompany)
        
        await this.repository.remove(task);
    }

    async finishTask(taskID: number, reqUser: number): Promise<Task> {
        const task = await this.repository.findById(taskID, ['taskCompany']);
        const user = await this.usersService.findOne(reqUser);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (!task) {
            throw new NotFoundException(`Task with ID ${taskID} not found`);
        }

        const managers = await this.usersService.findAllManagersOfUser(task.responsibleUser);
        const allowedUsers = [...managers, task.responsibleUser];
        
        await this.usersService.validateAccessToAllowedUsers(allowedUsers, user);
        await this.usersService.validateCompanyMembership(user, task.taskCompany)

        task.status = 'COMPLETED'
        return this.repository.save(task);
    }

    async cancelTask(taskID: number, reqUser: number): Promise<Task> {
        const task = await this.repository.findById(taskID, ['taskCompany']);
        const user = await this.usersService.findOne(reqUser);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (!task) {
            throw new NotFoundException(`Task with ID ${taskID} not found`);
        }

        const managers = await this.usersService.findAllManagersOfUser(task.responsibleUser);
        const allowedUsers = [...managers, task.responsibleUser];
        
        await this.usersService.validateAccessToAllowedUsers(allowedUsers, user);

        await this.usersService.validateCompanyMembership(user, task.taskCompany)

        task.status = 'CANCELLED'
        return this.repository.save(task);
    }

    deadlineCalculator(deadlineInDays: number): Date {
        const now = new Date()
        const deadline = new Date(now)

        deadline.setDate(deadline.getDate() + deadlineInDays)
        return deadline
    }

}
