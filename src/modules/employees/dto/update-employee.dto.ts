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

// branch_id, email, position, hired_at and terminated_at accept null to clear the value.
export class UpdateEmployeeDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  organization_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  branch_id?: number | null;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  firstname?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  lastname?: string;

  @IsOptional()
  @IsString()
  @Length(5, 30)
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string | null;

  @IsOptional()
  @IsEnum(EmployeePosition)
  position?: EmployeePosition | null;

  @IsOptional()
  @IsDateString({ strict: true })
  hired_at?: string | null;

  @IsOptional()
  @IsDateString({ strict: true })
  terminated_at?: string | null;

  @IsOptional()
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;
}
