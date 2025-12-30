import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from '../entities/task.entity';
import type { LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";

@Injectable()
export class TaskRepositoryService {
    constructor(
        @InjectRepository(Task)
        private readonly taskRepository: Repository<Task>,

        @Inject(WINSTON_MODULE_NEST_PROVIDER)
        private readonly logger: LoggerService,
    ) {}

    async findById(id: number, relations: string[]): Promise<Task | null> {
        const start = Date.now()
        const task = await this.taskRepository.findOne({
            where: { taskID: id },
            relations,
        })

        if (this.logger.debug) {
            this.logger.debug(`TasksRepository.findById executed, taskID: ${task?.taskID}, relations: ${relations}, durationMs: ${Date.now() - start}`, 'Tasks Repository Service')
        }
        
        return task;
    }

    async findAll(relations: string[]): Promise<Task[]> {
        const start = Date.now()
        const tasks = await this.taskRepository.find({
        relations,
        order: { createdAt: 'DESC' }
        })

        if (this.logger.debug) {
            this.logger.debug(`TasksRepository.findAll executed, resultCount: ${tasks.length}, relations: ${relations}, durationMs: ${Date.now() - start}`, 'Tasks Repository Service')
        }

        return tasks
    }

    async save(task: Task): Promise<Task> {
        const start = Date.now()
        const savedTask = await this.taskRepository.save(task)

        if (this.logger.debug) {
            this.logger.debug(`TasksRepository.save executed, durationMs: ${Date.now() - start}`, 'Tasks Repository Service')
        }
        return savedTask
    }

    async create(taskData: Partial<Task>): Promise<Task> {
        const start = Date.now()
        const task = this.taskRepository.create(taskData)
        this.save(task)

        if (this.logger.debug) {
            this.logger.debug(`TasksRepository.create executed, durationMs: ${Date.now() - start}`, 'Tasks Repository Service');
        }
        return task
    }

    async remove(task: Task): Promise<void> {
        const start = Date.now()
        await this.taskRepository.remove(task)
        if (this.logger.debug) {
            this.logger.debug(`TasksRepository.remove executed, durationMs: ${Date.now() - start}`, 'Tasks Repository Service');
        }
    }

    async findAllCompanyTasks(id: number, relations: string[]): Promise<Task[]> {
        const start = Date.now()
        const tasks = await this.taskRepository.find({
            where: { taskCompany: { companyID: id } },
            relations,
            order: { createdAt: 'DESC' }
        })

        if (!tasks || tasks.length === 0) {
            this.logger.warn(`No tasks found. companyID: ${id}`, 'Tasks Repository Service')
            throw new NotFoundException(`No tasks found for company`)
        }

        if (this.logger.debug) {
            this.logger.debug(`TasksRepository.findAllCompanyTasks executed, resultCount: ${tasks.length}, durationMs: ${Date.now() - start}`, 'Tasks Repository Service')
        }

        return tasks
    }

    async findAllUserTasks(id: number, relations: string[]): Promise<Task[]> {
        const start = Date.now()
        const tasks = await this.taskRepository.find({
            where: { responsibleUser: { userID: id } },
            relations,
            order: { createdAt: 'DESC' }
        })

        if (!tasks || tasks.length === 0) {
            this.logger.warn(`No tasks found for user with ID ${id}`, 'Tasks Repository Service')
            throw new NotFoundException(`No tasks found for user`);
        }

        if (this.logger.debug) {
            this.logger.debug(`TasksRepository.findAllUserTasks executed, resultCount: ${tasks.length}, durationMs: ${Date.now() - start}`, 'Tasks Repository Service')
        }

        return tasks
    }

}