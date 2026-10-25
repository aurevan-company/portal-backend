import { Type } from 'class-transformer';
import {
  IsEmail,
  IsString,
  IsOptional,
  IsInt,
  Min,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @Length(2, 100)
  name!: string;

  @IsEmail()
  @MaxLength(150)
  email!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  roleId?: number;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;
}
