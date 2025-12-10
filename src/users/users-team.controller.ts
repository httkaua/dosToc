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
import { CompaniesService } from 'src/companies/companies.service';
import { RolesGuard } from 'src/rbac/rbac.guard';
import { Roles } from 'src/rbac/role.decorator';
import { Role } from 'src/rbac/role.enum';

@Controller('users/team')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class TeamsController {
  constructor(
    private readonly usersService: UsersService,
    private readonly companiesService: CompaniesService
  ) {}

  @Get()
  @Roles(
    Role.ADM_DEV,
    Role.DEV,
    Role.COMPANY_OWNER,
    Role.SUPERVISOR
  )
  @HttpCode(HttpStatus.OK)
  async getMyTeam(@Request() req): Promise<ResponseUserDto[]> {
    const managerID = Number(req.user.userID);
    const teamMembers = await this.usersService.findAllTeamMembers(managerID);
    return teamMembers;
  }

  @Post('add-member')
  @Roles(
    Role.ADM_DEV,
    Role.DEV,
    Role.COMPANY_OWNER,
    Role.SUPERVISOR
  )
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
  @Roles(
    Role.ADM_DEV,
    Role.DEV,
    Role.COMPANY_OWNER,
    Role.SUPERVISOR
  )
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

  @Patch('promote-member/:id')
  @Roles(
    Role.ADM_DEV,
    Role.DEV,
    Role.COMPANY_OWNER,
    Role.SUPERVISOR
  )
  @HttpCode(HttpStatus.OK)
  async promoteMember(
    @Query('newClassification') newClassification: number,
    @Request() req,
  ): Promise<void> {
    const ids = {
      companyID: req.user.userCompany.companyID,
      reqUser: req.user.userID,
      targetUser: req.params.id
    }

    await this.usersService.removeEmployeeFromTeam(req.user.userID, req.params.id);
    await this.companiesService.assignMemberToPosition(ids, newClassification);

  }

  @Patch('demote-member/:id')
  @Roles(
    Role.ADM_DEV,
    Role.DEV,
    Role.COMPANY_OWNER,
    Role.SUPERVISOR
  )
  @HttpCode(HttpStatus.OK)
  async demoteMember(
    @Query('newClassification') newClassification: number,
    @Request() req,
  ): Promise<void> {
    const ids = {
      companyID: req.user.userCompany.companyID,
      reqUser: req.user.userID,
      targetUser: req.params.id
    }

    const user = await this.usersService.findOne(req.user.userID);
    this.usersService.validateDemote(user, newClassification);

    await this.companiesService.assignMemberToPosition(ids, newClassification);

  }
}