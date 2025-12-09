import { ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from '../entities/task.entity';

@Injectable()
export class TaskRepositoryService {
    constructor(

        @InjectRepository(Task)
        private readonly taskRepository: Repository<Task>,
    ) {}

    async findById(id: number, relations: string[]): Promise<Task | null> {
        const task = await this.taskRepository.findOne({
            where: { taskID: id },
            relations,
        });
        
        return task;
    }

    async findAll(relations: string[]): Promise<Task[]> {
        if (!relations) {
            throw new ForbiddenException('Tasks relations forbidden.')
        }
        const tasks = await this.taskRepository.find({
        relations,
        order: { createdAt: 'DESC' }
        });

        return tasks
    }

    async save(task: Task): Promise<Task> {
        return this.taskRepository.save(task);
    }

    async create(taskData: Partial<Task>): Promise<Task> {
        const task = this.taskRepository.create(taskData);
        return this.save(task);
    }

    async remove(task: Task): Promise<void> {
        await this.taskRepository.remove(task);
    }

    async findAllCompanyTasks(id: number, relations: string[]): Promise<Task[]> {
    const tasks = await this.taskRepository.find({
        where: { taskCompany: { companyID: id } },
        relations,
        order: { createdAt: 'DESC' }
    });

    if (!tasks || tasks.length === 0) {
        throw new NotFoundException(`No tasks found for company with ID ${id}.`);
    }

    return tasks
    }

    async findAllUserTasks(id: number, relations: string[]): Promise<Task[]> {
    const tasks = await this.taskRepository.find({
        where: { responsibleUser: { userID: id } },
        relations,
        order: { createdAt: 'DESC' }
    });

    if (!tasks || tasks.length === 0) {
        throw new NotFoundException(`No tasks found for user with ID ${id}.`);
    }

    return tasks
    }

}