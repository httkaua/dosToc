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
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { CsrfModule } from './csrf/csrf.module';
import { CsrfController } from './csrf/csrf.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 10,
        },
      ],
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
    CsrfModule,
  ],
  controllers: [
    AppController,
    CsrfController
  ],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

