import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
} from 'class-validator';
import { EmployeeStatus } from '../employee-status.enum.js';

export class CreateEmployeeDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  organization_id!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  branch_id!: number;

  @IsString()
  @Length(1, 150)
  name!: string;

  @IsString()
  @Length(5, 20)
  phone!: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  position?: string;

  @IsOptional()
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;
}
