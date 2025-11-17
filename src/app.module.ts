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
import { PropertyownersModule } from './propertyowners/propertyowners.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { AuthService } from './auth/auth.service';
import { JwtService } from '@nestjs/jwt';

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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

