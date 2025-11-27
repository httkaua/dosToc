import {
  Controller,
  Request,
  Get,
  Post,
  Patch,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Query,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  Body,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ResponseUserDto } from './dto/response-user.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('users/team')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class TeamsController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getMyTeam(@Request() req): Promise<ResponseUserDto[]> {
    const managerID = Number(req.user.userID);
    const teamMembers = await this.usersService.findAllTeamMembers(managerID);
    return teamMembers;
  }

  @Get('all-company-members')
  @HttpCode(HttpStatus.OK)
  async findAllCompanyMembers(@Request() req): Promise<ResponseUserDto[]> {
    const user = await this.usersService.findOne(req.user.userID);
    const users = await this.usersService.findAllCompanyMembers(
      user.userID,
      user.userCompany.companyID,
    );
    return users;
  }

  @Post('add-member')
  @HttpCode(HttpStatus.OK)
  async addToTeam(
    @Body() body: { managerId: number; employeeId: number },
    @Request() req,
  ): Promise<ResponseUserDto> {
    const employee = await this.usersService.addEmployeeToTeam(
      body.managerId,
      body.employeeId,
    );
    return new ResponseUserDto(employee);
  }

  @Patch('remove-member')
  @HttpCode(HttpStatus.OK)
  async removeFromTeam(
    @Body() body: { managerId: number; employeeId: number },
    @Request() req,
  ): Promise<ResponseUserDto> {
    const employee = await this.usersService.removeEmployeeFromTeam(
      body.managerId,
      body.employeeId,
    );
    return new ResponseUserDto(employee);
  }
}