import { Body, ClassSerializerInterceptor, Controller, HttpCode, HttpStatus, Post, UseGuards, UseInterceptors, Request, Get, Param, Delete, ParseIntPipe, Patch, Inject } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { ResponseTaskDto } from './dto/response-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { RolesGuard } from 'src/rbac/rbac.guard';
import { Roles } from 'src/rbac/role.decorator';
import { Role } from 'src/rbac/role.enum';
import type { LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";

@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class TasksController {
    constructor(
        private readonly tasksService: TasksService,

      @Inject(WINSTON_MODULE_NEST_PROVIDER)
      private readonly logger: LoggerService,
    ) {}

    //* ----- TASK CREATION ENDPOINTS ----- *//
    @Post('create')
    @Roles(
        Role.ADM_DEV,
        Role.DEV,
        Role.COMPANY_OWNER,
        Role.SUPERVISOR,
        Role.AGENT,
        Role.ASSISTANT
    )
    @HttpCode(HttpStatus.CREATED)
    async create(
    @Body() createTaskDto: CreateTaskDto,
    @Request() req,
    ): Promise<ResponseTaskDto> {
        this.logger.log('POST /tasks/create')
        return await this.tasksService.create(createTaskDto, req.user)
    }

    //* ----- TASK QUERY ENDPOINTS ----- *//
    @Get()
    @Roles(
        Role.ADM_DEV,
        Role.DEV
    )
    @HttpCode(HttpStatus.OK)
    async findAll(): Promise<ResponseTaskDto[]> {
        this.logger.log('GET /tasks')
        return await this.tasksService.findAll(['creatorUser', 'responsibleUser', 'targetLead', 'taskCompany'])
    }

    @Get('in-my-company')
    @Roles(
        Role.ADM_DEV,
        Role.DEV,
        Role.COMPANY_OWNER
    )
    @HttpCode(HttpStatus.OK)
    async findAllOfMyCompany(
    @Request() req
    ): Promise<ResponseTaskDto[]> {
        this.logger.log('GET /tasks/in-my-company')
        return await this.tasksService.findAllOfMyCompany(req.user.userID, ['creatorUser', 'responsibleUser', 'targetLead', 'taskCompany'])
    }

    @Get('my-tasks')
    @Roles(
        Role.ADM_DEV,
        Role.DEV,
        Role.COMPANY_OWNER,
        Role.SUPERVISOR,
        Role.AGENT,
        Role.ASSISTANT
    )
    @HttpCode(HttpStatus.OK)
    async findUserTasks(
    @Request() req
    ): Promise<ResponseTaskDto[]> {
        this.logger.log('GET /tasks/my-tasks')
        return await this.tasksService.findAllOfUser(req.user.userID, ['creatorUser', 'responsibleUser', 'targetLead', 'taskCompany'])
    }

    @Get(':id')
    @Roles(
        Role.ADM_DEV,
        Role.DEV,
        Role.COMPANY_OWNER,
        Role.SUPERVISOR,
        Role.AGENT,
        Role.ASSISTANT
    )
    @HttpCode(HttpStatus.OK)
    async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    ): Promise<ResponseTaskDto> {
        this.logger.log('GET /tasks/:id')
        return await this.tasksService.findOne(id, req.user)
    }

    //* ----- TASK UPDATE ENDPOINTS ----- *//
    @Patch(':id')
    @Roles(
        Role.ADM_DEV,
        Role.DEV,
        Role.COMPANY_OWNER,
        Role.SUPERVISOR,
        Role.AGENT,
        Role.ASSISTANT
    )
    @HttpCode(HttpStatus.OK)
    async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTaskDto: UpdateTaskDto,
    @Request() req,
    ): Promise<ResponseTaskDto> {
        this.logger.log('PATCH /tasks/:id')
        const ids = {
            reqUser: req.user.userID,
            taskID: id,
        }
        return await this.tasksService.update(ids, updateTaskDto);
    }

    @Patch(':id/finish')
    @Roles(
        Role.ADM_DEV,
        Role.DEV,
        Role.COMPANY_OWNER,
        Role.SUPERVISOR,
        Role.AGENT,
        Role.ASSISTANT
    )
    @HttpCode(HttpStatus.OK)
    async finish(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    ): Promise<ResponseTaskDto> {
        this.logger.log('PATCH /tasks/:id/finish')
        return await this.tasksService.finishTask(id, req.user.userID);
    }

    @Patch(':id/cancel')
    @Roles(
        Role.ADM_DEV,
        Role.DEV,
        Role.COMPANY_OWNER,
        Role.SUPERVISOR,
        Role.AGENT,
        Role.ASSISTANT
    )
    @HttpCode(HttpStatus.OK)
    async cancel(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    ): Promise<ResponseTaskDto> {
        this.logger.log('PATCH /tasks/:id/cancel')
        return await this.tasksService.cancelTask(id, req.user.userID);
    }

    //* ----- TASK DELETION ENDPOINT ----- *//
    @Delete(':id')
    @Roles(
        Role.ADM_DEV,
        Role.DEV
    )
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    ): Promise<void> {
        this.logger.log('DELETE /tasks/:id')
        return await this.tasksService.remove(id, req.user.userID);
    }
}
