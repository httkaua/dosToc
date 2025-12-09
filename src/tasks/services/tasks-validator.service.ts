import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Company } from 'src/companies/entities/company.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from '../entities/task.entity';

@Injectable()
export class TaskValidatorService {
    constructor(
        @InjectRepository(Task)
        private readonly taskRepository: Repository<Task>
    ) {}

    async validateUniqueTaskInCompany(updateTaskDto: Record<string, any>, company: Company): Promise<void> {
        const existingTask = await this.taskRepository.findOne({
            where: {
                taskCompany: company,
                responsibleUser: updateTaskDto.responsibleUser,
                targetLead: updateTaskDto.targetLead,
                taskType: updateTaskDto.taskType
            }
        });

        if (existingTask) {
            throw new ConflictException(
                `This task already exists in the company. ID ${existingTask.taskID}`
            );
        }
    }
}