import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';

export class QuoteAddonDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  service_id!: number;

  // Required for RANGE addons (price..price_max); ignored for FIXED.
  @IsOptional()
  @IsInt()
  @Min(0)
  amount?: number;
}

export class PriceQuoteDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  vehicle_category_id!: number;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @IsInt({ each: true })
  @Min(1, { each: true })
  service_ids!: number[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => QuoteAddonDto)
  addons?: QuoteAddonDto[];
}
