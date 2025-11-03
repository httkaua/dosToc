import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeormModule } from './typeorm/typeorm.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { CompaniesModule } from './companies/companies.module';
import { LeadsModule } from './leads/leads.module';
import { RealestatesModule } from './realestates/realestates.module';
import { TasksModule } from './tasks/tasks.module';
import { RecordsModule } from './records/records.module';
import { PropertyownersModule } from './propertyowners/propertyowners.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    UsersModule,
    CompaniesModule,
    LeadsModule,
    RealestatesModule,
    TasksModule,
    RecordsModule,
    PropertyownersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
