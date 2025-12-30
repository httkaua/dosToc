import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TaskRepositoryService } from './services/tasks-repository.service';
import { UsersService } from 'src/users/users.service';
import { CompaniesService } from 'src/companies/companies.service';
import { User } from 'src/users/entities/user.entity';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { Lead } from 'src/leads/entities/lead.entity';
import { LeadsService } from 'src/leads/leads.service';
import { UpdateTaskDto } from './dto/update-task.dto';
import type { LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Injectable()
export class TasksService {
    constructor(
        private readonly repository: TaskRepositoryService,
        private readonly usersService: UsersService,
        private readonly leadsService: LeadsService,

        @Inject(WINSTON_MODULE_NEST_PROVIDER)
        private readonly logger: LoggerService,
    ) {}

    async create(dto: CreateTaskDto, reqUser: User): Promise<Task> {
        if (this.logger.debug) {
            this.logger.debug(`Creating task: ${dto.taskType}, ${dto.observations.length > 16 ? dto.observations.substring(0, 16) + '...' : dto.observations}`, 'Tasks Service')
        }
        const user = await this.usersService.findOne(reqUser.userID)
        const deadline = this.deadlineCalculator(dto.deadlineInDays)
        const responsibleUser = await this.usersService.findOne(dto.responsibleUser)
        const managers = await this.usersService.findAllManagersOfUser(responsibleUser)
        const allowedUsers = [...managers, responsibleUser]
        let targetLead: Lead | undefined = undefined

        if (!user.userCompany) {
            this.logger.warn(`Invalid attempt to create a task with a creator user without a company. userID: ${reqUser.userID}`, 'Tasks Service')
            throw new ConflictException('User must belong to a company to create tasks.');
        }

        await this.usersService.validateAccessToAllowedUsers(allowedUsers, user);

        if (dto.targetLead) {
            targetLead = await this.leadsService.findOne(dto.targetLead, user)
            if (targetLead.attendingUser.userID !== responsibleUser.userID) {
                this.logger.warn(`Invalid attempt to create a task with a lead not attended by your respective responsible user. (task)responsibleUser: ${responsibleUser.userID}, (lead)attendingUser: ${targetLead.attendingUser.userID}`, 'Tasks Service')
                throw new ConflictException(`The lead must being attended for the user ${responsibleUser.searchableName}`)
            }
        }

        const task = await this.repository.create({
            ...dto,
            creatorUser: user,
            responsibleUser: responsibleUser,
            targetLead,
            taskCompany: user.userCompany,
            deadline
        })

        this.logger.log(`Task created successfully`, 'Tasks Service')
        return task
    }

    async findAll(relations: string[]): Promise<Task[]> {
        if (this.logger.debug) {
            this.logger.debug(`Function called: findAll`, 'Tasks Service');
        }
        return await this.repository.findAll(relations);
    }

    async findAllOfMyCompany(userID: number, relations: string[]): Promise<Task[]> {
        if (this.logger.debug) {
            this.logger.debug(`Function called: findAllOfMyCompany`, 'Tasks Service')
        }

        const user = await this.usersService.findOne(userID)
        const companyID = user.userCompany.companyID

        if (!companyID) {
            this.logger.warn(`User company not found. userCompany: ${user.userCompany}`, 'Tasks Service')
            throw new NotFoundException('Company not found')
        }

        const leads = await this.repository.findAllCompanyTasks(companyID, relations)
        return leads
    }

    async findAllOfUser(userID: number, relations: string[]): Promise<Task[]> {
        if (this.logger.debug) {
            this.logger.debug(`Function called: findAllOfUser`, 'Tasks Service')
        }

        const user = await this.usersService.findOne(userID)
        const companyID = user.userCompany.companyID

        if (!companyID) {
            this.logger.warn(`User company not found. userCompany: ${user.userCompany}`, 'Tasks Service')
            throw new NotFoundException('Company not found')
        }

        return await this.repository.findAllCompanyTasks(companyID, relations);
    }

    async findOne(id: number, reqUser: User): Promise<Task> {
        if (this.logger.debug) {
            this.logger.debug(`Function called: findOne`, 'Tasks Service')
        }
        
        const task = await this.repository.findById(id, ['creatorUser', 'responsibleUser', 'targetLead', 'taskCompany'])
        const user = await this.usersService.findOne(reqUser.userID)

        if (!task) {
            this.logger.warn(`Task not found: ${id}`, 'Tasks Service')
            throw new NotFoundException(`Task not found`)
        }

        const managers = await this.usersService.findAllManagersOfUser(task.responsibleUser)
        const allowedUsers = [...managers, task.responsibleUser]

        await this.usersService.validateAccessToAllowedUsers(allowedUsers, reqUser)
        await this.usersService.validateCompanyMembership(user, task.taskCompany)

        return task
    }

    async update(ids: Record<string, any>, dto: UpdateTaskDto): Promise<Task> {
        if (this.logger.debug) {
            this.logger.debug(`Updating task: ${ids.taskID}`, 'Tasks Service')
        }

        const taskToUpdate = await this.repository.findById(ids.taskID, ['creatorUser', 'responsibleUser', 'targetLead', 'taskCompany'])
        const reqUser = await this.usersService.findOne(ids.reqUser)
        let deadline = taskToUpdate?.deadline

        if (!reqUser) {
            this.logger.warn(`User not found: ${ids.reqUser}`, 'Tasks Service')
            throw new NotFoundException('User not found')
        }

        if (!taskToUpdate) {
            this.logger.warn(`Task not found: ${ids.taskID}`, 'Tasks Service')
            throw new NotFoundException(`Task with ID ${ids.taskID} not found`)
        }

        if (
            dto.deadlineInDays &&
            (taskToUpdate.creatorUser === taskToUpdate.responsibleUser || taskToUpdate.creatorUser === reqUser)
        ) {
            deadline = this.deadlineCalculator(dto.deadlineInDays)
        }

        const dtoWithDeadline = { ...dto, deadline }

        const managers = await this.usersService.findAllManagersOfUser(taskToUpdate.responsibleUser)
        const allowedUsers = [...managers, taskToUpdate.responsibleUser]
    
        await this.usersService.validateAccessToAllowedUsers(allowedUsers, reqUser)
        await this.usersService.validateCompanyMembership(reqUser, taskToUpdate.taskCompany)

        Object.assign(taskToUpdate, dtoWithDeadline)
        this.logger.log(`Task updated successfully: ${taskToUpdate.taskID}`, 'Tasks Service')
        return this.repository.save(taskToUpdate)
    }

    async remove(id: number, reqUser: User): Promise<void> {
        if (this.logger.debug) {
            this.logger.debug(`Removing task: ${id}`, 'Tasks Service')
        }
        const task = await this.repository.findById(id, ['taskCompany', 'responsibleUser'])
        const user = await this.usersService.findOne(reqUser.userID)

        if (!task) {
            this.logger.warn(`Task not found: ${id}`, 'Tasks Service')
            throw new NotFoundException(`Task not found`)
        }

        const managers = await this.usersService.findAllManagersOfUser(task.responsibleUser)
        const allowedUsers = [...managers, task.responsibleUser]
        
        await this.usersService.validateAccessToAllowedUsers(allowedUsers, reqUser)
        await this.usersService.validateCompanyMembership(user, task.taskCompany)
        
        await this.repository.remove(task)
        this.logger.log(`Task removed successfully: ${task.taskID}`, 'Tasks Service')
    }

    async finishTask(taskID: number, reqUser: number): Promise<Task> {
        if (this.logger.debug) {
            this.logger.debug(`Finishing task: ${taskID}`, 'Tasks Service')
        }

        const task = await this.repository.findById(taskID, ['taskCompany', 'responsibleUser'])
        const user = await this.usersService.findOne(reqUser)

        if (!user) {
            this.logger.warn(`User not found: ${reqUser}`, 'Tasks Service')
            throw new NotFoundException('User not found')
        }

        if (!task) {
            this.logger.warn(`Task not found: ${taskID}`, 'Tasks Service')
            throw new NotFoundException(`Task not found`)
        }

        const managers = await this.usersService.findAllManagersOfUser(task.responsibleUser)
        const allowedUsers = [...managers, task.responsibleUser]
        
        await this.usersService.validateAccessToAllowedUsers(allowedUsers, user)
        await this.usersService.validateCompanyMembership(user, task.taskCompany)

        task.status = 'COMPLETED'
        const savedTask = await this.repository.save(task)
        this.logger.log(`Task finished successfully: ${task.taskID}`, 'Tasks Service')
        return savedTask
    }

    async cancelTask(taskID: number, reqUser: number): Promise<Task> {
        if (this.logger.debug) {
            this.logger.debug(`Cancelling task: ${taskID}`, 'Tasks Service')
        }

        const task = await this.repository.findById(taskID, ['taskCompany', 'responsibleUser'])
        const user = await this.usersService.findOne(reqUser)

        if (!user) {
            this.logger.warn(`User not found: ${reqUser}`, 'Tasks Service')
            throw new NotFoundException('User not found')
        }

        if (!task) {
            this.logger.warn(`Task not found: ${taskID}`, 'Tasks Service')
            throw new NotFoundException(`Task not found`)
        }

        const managers = await this.usersService.findAllManagersOfUser(task.responsibleUser)
        const allowedUsers = [...managers, task.responsibleUser]
        
        await this.usersService.validateAccessToAllowedUsers(allowedUsers, user)

        await this.usersService.validateCompanyMembership(user, task.taskCompany)

        task.status = 'CANCELLED'
        this.logger.log(`Task cancelled successfully: ${task.taskID}`, 'Tasks Service')
        return this.repository.save(task)
    }

    deadlineCalculator(deadlineInDays: number): Date {
        if (this.logger.debug) {
            this.logger.debug(`Calculating deadline: ${deadlineInDays} days`, 'Tasks Service')
        }

        const now = new Date()
        const deadline = new Date(now)

        deadline.setDate(deadline.getDate() + deadlineInDays)
        this.logger.log(`Deadline calculated: ${deadline.toISOString()}`, 'Tasks Service')
        return deadline
    }

}
