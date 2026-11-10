import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';
import { PriceType } from '../price-type.enum.js';

export class PriceListItemDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  service_id!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  vehicle_category_id!: number;

  @IsEnum(PriceType)
  price_type!: PriceType;

  @IsInt()
  @Min(0)
  price!: number;

  // Ignored (stored as null) for FIXED; must be greater than price for RANGE.
  @IsOptional()
  @IsInt()
  @Min(0)
  price_max?: number | null;
}

export class UpsertPriceListDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => PriceListItemDto)
  items!: PriceListItemDto[];
}
