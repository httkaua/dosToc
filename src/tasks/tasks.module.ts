import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Company } from 'src/companies/entities/company.entity';
import { UsersModule } from 'src/users/users.module';
import { CompaniesModule } from 'src/companies/companies.module';
import { TaskRepositoryService } from './services/tasks-repository.service';
import { LeadsModule } from 'src/leads/leads.module';
import { Lead } from 'src/leads/entities/lead.entity';
import { Task } from './entities/task.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Company, Lead, Task]),
    UsersModule,
    LeadsModule
  ],
  providers: [
    TasksService,
    TaskRepositoryService
  ],
  controllers: [TasksController]
})
export class TasksModule {}
