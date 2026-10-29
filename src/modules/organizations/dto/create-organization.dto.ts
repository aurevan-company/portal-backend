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
import { OrganizationStatus } from '../organization-status.enum.js';

export class CreateOrganizationDto {
  @IsString()
  @Length(1, 150)
  name!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  owner_id!: number;

  @IsString()
  @Length(5, 20)
  phone!: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  logo_url?: string;

  @IsOptional()
  @IsEnum(OrganizationStatus)
  status?: OrganizationStatus;
}
