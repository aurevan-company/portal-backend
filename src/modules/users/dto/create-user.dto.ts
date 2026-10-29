import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsString,
  IsOptional,
  IsInt,
  Min,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserStatus } from '../user-status.enum.js';

export class CreateUserDto {
  @IsString()
  @Length(1, 100)
  firstname!: string;

  @IsString()
  @Length(1, 100)
  lastname!: string;

  @IsEmail()
  @MaxLength(150)
  email!: string;

  @IsOptional()
  @IsString()
  @Length(5, 20)
  phone?: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  role_id?: number;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;
}
