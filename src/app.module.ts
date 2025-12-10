import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { CompaniesModule } from './companies/companies.module';
import { LeadsModule } from './leads/leads.module';
import { RealestatesModule } from './realestates/realestates.module';
import { TasksModule } from './tasks/tasks.module';
import { RecordsModule } from './records/records.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { AuthService } from './auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from './users/users.service';
import { PropertyownersModule } from './propertyowners/propertyowners.module';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './rbac/rbac.guard';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RBACModule } from './rbac/rbac.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    UsersModule,
    CompaniesModule,
    LeadsModule,
    RealestatesModule,
    TasksModule,
    RecordsModule,
    PropertyownersModule,
    AuthModule,
    RBACModule,
  ],
  controllers: [AppController],
  providers: [
  AppService,
  ],
})
export class AppModule {}

