import { IsEmail, IsInt, IsOptional, IsString, MaxLength, Max, Min, ValidateIf } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional() @IsString() @MaxLength(100) storeName?: string;
  @IsOptional() @IsString() @MaxLength(100) tagline?: string;
  @IsOptional() @ValidateIf((_, v) => v !== '') @IsEmail() @MaxLength(200) supportEmail?: string;
  @IsOptional() @IsString() @MaxLength(30) supportPhone?: string;
  @IsOptional() @IsInt() @Min(0) @Max(1_000_000) shippingFlatRate?: number;
  @IsOptional() @IsInt() @Min(0) @Max(100_000_000) freeShippingThreshold?: number;
  @IsOptional() @IsInt() @Min(0) @Max(1_000_000) giftBoxPrice?: number;
  @IsOptional() @IsInt() @Min(0) @Max(10_000) lowStockThreshold?: number;
}
