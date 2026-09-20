import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUUID,
  Matches, Max, MaxLength, Min, MinLength, ValidateIf, ValidateNested,
} from 'class-validator';

export const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
// Only web links or files this API uploaded. Blocks javascript: and data: URLs.
export const IMAGE_URL = /^(https?:\/\/[^\s"'<>]{1,500}|\/uploads\/[A-Za-z0-9._-]{1,200})$/;
export const MIN_IMAGES = 3;
export const MAX_IMAGES = 8;

const bool = ({ value }: { value: unknown }) => (value === 'true' ? true : value === 'false' ? false : value);

// ---- Categories ----
export class CategoryDto {
  @IsString() @MinLength(1) @MaxLength(80) name: string;
  @IsOptional() @Matches(SLUG) @MaxLength(80) slug?: string;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() @MaxLength(500) description?: string | null;
  @IsOptional() @IsInt() @Min(0) sortOrder?: number;
}
export class UpdateCategoryDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(80) name?: string;
  @IsOptional() @Matches(SLUG) @MaxLength(80) slug?: string;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() @MaxLength(500) description?: string | null;
  @IsOptional() @IsInt() @Min(0) sortOrder?: number;
}

// ---- Products ----
export class VariantDto {
  @IsOptional() @IsUUID() id?: string;
  @IsString() @MinLength(1) @MaxLength(60) size: string;
  @IsInt() @Min(0) @Max(100000) stock: number;
  @IsOptional() @IsString() @MaxLength(80) sku?: string;
}

export class CreateProductDto {
  @IsString() @MinLength(1) @MaxLength(150) name: string;
  @IsOptional() @Matches(SLUG) @MaxLength(150) slug?: string;
  @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @IsInt() @Min(0) @Max(100_000_000) price: number;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsInt() @Min(1) @Max(100_000_000) compareAtPrice?: number | null;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsUUID() categoryId?: string | null;
  @IsOptional() @IsString() @MaxLength(200) material?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(MAX_IMAGES) @Matches(IMAGE_URL, { each: true, message: 'Each image must be an https link or an uploaded file' }) images?: string[];
  @IsOptional() @IsEnum(['active', 'draft', 'archived']) status?: 'active' | 'draft' | 'archived';
  @IsOptional() @IsBoolean() featured?: boolean;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(30) @ValidateNested({ each: true }) @Type(() => VariantDto) variants: VariantDto[];
}

export class UpdateProductDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(150) name?: string;
  @IsOptional() @Matches(SLUG) @MaxLength(150) slug?: string;
  @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @IsOptional() @IsInt() @Min(0) @Max(100_000_000) price?: number;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsInt() @Min(1) @Max(100_000_000) compareAtPrice?: number | null;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsUUID() categoryId?: string | null;
  @IsOptional() @IsString() @MaxLength(200) material?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(MAX_IMAGES) @Matches(IMAGE_URL, { each: true, message: 'Each image must be an https link or an uploaded file' }) images?: string[];
  @IsOptional() @IsEnum(['active', 'draft', 'archived']) status?: 'active' | 'draft' | 'archived';
  @IsOptional() @IsBoolean() featured?: boolean;
  @IsOptional() @IsArray() @ArrayMinSize(1) @ArrayMaxSize(30) @ValidateNested({ each: true }) @Type(() => VariantDto) variants?: VariantDto[];
}

export class SetStockDto {
  @IsInt() @Min(0) @Max(100000) stock: number;
}

export class ProductQueryDto {
  @IsOptional() @IsString() @MaxLength(100) q?: string;
  @IsOptional() @IsEnum(['active', 'draft', 'archived']) status?: 'active' | 'draft' | 'archived';
  @IsOptional() @IsUUID() categoryId?: string;
  @IsOptional() @Transform(bool) @IsBoolean() onSale?: boolean;
  @IsOptional() @IsEnum(['in', 'low', 'sold']) stock?: 'in' | 'low' | 'sold';
  @IsOptional() @IsEnum(['newest', 'name', 'priceLow', 'priceHigh', 'stockLow']) sort?: 'newest' | 'name' | 'priceLow' | 'priceHigh' | 'stockLow';
}

export class InventoryQueryDto {
  @IsOptional() @IsString() @MaxLength(100) q?: string;
  @IsOptional() @IsEnum(['low', 'sold']) filter?: 'low' | 'sold';
}
