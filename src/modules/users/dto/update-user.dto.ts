import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserStatus } from '../user-status.enum.js';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  firstname?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  lastname?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  email?: string;

  @IsOptional()
  @IsString()
  @Length(5, 20)
  phone?: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  // SUPER_ADMIN only.
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  new_password?: string;
}
