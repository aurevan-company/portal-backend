import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
} from 'class-validator';
import { EmployeePosition } from '../employee-position.enum.js';
import { EmployeeStatus } from '../employee-status.enum.js';

export class CreateEmployeeDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  organization_id!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  branch_id?: number;

  @IsString()
  @Length(1, 100)
  firstname!: string;

  @IsString()
  @Length(1, 100)
  lastname!: string;

  @IsString()
  @Length(5, 30)
  phone!: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsEnum(EmployeePosition)
  position?: EmployeePosition;

  @IsOptional()
  @IsDateString({ strict: true })
  hired_at?: string;

  @IsOptional()
  @IsDateString({ strict: true })
  terminated_at?: string;

  @IsOptional()
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;
}
