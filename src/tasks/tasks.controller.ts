import { Body, ClassSerializerInterceptor, Controller, HttpCode, HttpStatus, Post, UseGuards, UseInterceptors, Request, Get, Param, Delete, ParseIntPipe, Patch } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { ResponseTaskDto } from './dto/response-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class TasksController {
    constructor(
        private readonly tasksService: TasksService,
    ) {}

    //* ----- TASK CREATION ENDPOINTS ----- *//
    @Post('create')
    @HttpCode(HttpStatus.CREATED)
    async create(
    @Body() createTaskDto: CreateTaskDto,
    @Request() req,
    ): Promise<ResponseTaskDto> {
        return await this.tasksService.create(createTaskDto, req.user);
    }

    //* ----- TASK QUERY ENDPOINTS ----- *//
    @Get()
    @HttpCode(HttpStatus.OK)
    async findAll(): Promise<ResponseTaskDto[]> {
        return await this.tasksService.findAll(['creatorUser', 'responsibleUser', 'targetLead', 'taskCompany']);
    }

    @Get('in-my-company')
    @HttpCode(HttpStatus.OK)
    async findAllOfMyCompany(
    @Request() req
    ): Promise<ResponseTaskDto[]> {
        return await this.tasksService.findAllOfMyCompany(req.user.userID, ['creatorUser', 'responsibleUser', 'targetLead', 'taskCompany']);
    }

    @Get('my-tasks')
    @HttpCode(HttpStatus.OK)
    async findUserTasks(
    @Request() req
    ): Promise<ResponseTaskDto[]> {
        return await this.tasksService.findAllOfUser(req.user.userID, ['creatorUser', 'responsibleUser', 'targetLead', 'taskCompany']);
    }

    @Get(':id')
    @HttpCode(HttpStatus.OK)
    async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    ): Promise<ResponseTaskDto> {
        return await this.tasksService.findOne(id, req.user);
    }

    //* ----- TASK UPDATE ENDPOINTS ----- *//
    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTaskDto: UpdateTaskDto,
    @Request() req,
    ): Promise<ResponseTaskDto> {
        const ids = {
            reqUser: req.user.userID,
            taskID: id,
        }
        return await this.tasksService.update(ids, updateTaskDto);
    }

    @Patch(':id/finish')
    @HttpCode(HttpStatus.OK)
    async finish(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    ): Promise<ResponseTaskDto> {
        return await this.tasksService.finishTask(id, req.user);
    }

    @Patch(':id/cancel')
    @HttpCode(HttpStatus.OK)
    async cancel(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    ): Promise<ResponseTaskDto> {
        return await this.tasksService.cancelTask(id, req.user);
    }

    //* ----- TASK DELETION ENDPOINT ----- *//
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    ): Promise<void> {
        return await this.tasksService.remove(id, req.user);
    }
    
}
