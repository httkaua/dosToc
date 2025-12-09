import { Transform, Type } from 'class-transformer';
import { IsEmail, IsString, IsNotEmpty, MinLength, MaxLength, IsOptional, IsNumber, IsArray, IsObject, ValidateNested, IsBoolean, IsIn, IsPositive, Max, ArrayMaxSize, ArrayUnique, isNotEmpty } from 'class-validator';

export class CreateTaskDto {

    @IsNumber({ maxDecimalPlaces: 0 })
    @IsNotEmpty()
    @IsPositive()
    responsibleUser: number

    @IsString()
    @IsNotEmpty()
    @IsIn([
      'CALL',
      'EMAIL',
      'VISIT IN THE STORE',
      'MESSAGE',
      'OTHER'
    ])
    taskType: string

    @IsString()
    @IsNotEmpty()
    @MinLength(5)
    @MaxLength(500)
    observations: string

    @IsNumber({ maxDecimalPlaces: 0 })
    @IsNotEmpty()
    @Max(365)
    deadlineInDays: number

    @IsNumber({ maxDecimalPlaces: 0 })
    @IsOptional()
    @IsPositive()
    targetLead: number

    @IsBoolean()
    @IsOptional()
    notifyByEmail: boolean

}
