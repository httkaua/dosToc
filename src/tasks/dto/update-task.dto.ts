import { IsEmail, IsString, IsNotEmpty, MinLength, MaxLength, IsOptional, IsNumber, IsArray, IsBoolean, IsPositive, IsInt, IsIn, IsJSON, IsObject, ValidateNested } from 'class-validator';
import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateTaskDto } from './create-task.dto';


export class UpdateTaskDto extends PartialType(CreateTaskDto) {}