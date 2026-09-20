import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Matches, MaxLength, Min, ValidateIf } from 'class-validator';

const upper = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toUpperCase() : value);
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export class ValidateDiscountDto {
  @Transform(upper) @IsString() @MaxLength(40) code: string;
  @IsInt() @Min(0) subtotal: number;
}

export class DiscountDto {
  @Transform(upper) @IsString() @MaxLength(40) @Matches(/^[A-Z0-9_-]+$/, { message: 'Use letters, numbers, - or _ only' }) code: string;
  @IsEnum(['percentage', 'fixed']) type: 'percentage' | 'fixed';
  @IsInt() @Min(1) value: number;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsInt() @Min(1) usageLimit?: number | null;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsInt() @Min(0) minOrderAmount?: number | null;
  @IsOptional() @ValidateIf((_, v) => v !== null) @Matches(DATE) startsAt?: string | null;
  @IsOptional() @ValidateIf((_, v) => v !== null) @Matches(DATE) endsAt?: string | null;
}

export class UpdateDiscountDto {
  @IsOptional() @Transform(upper) @IsString() @MaxLength(40) @Matches(/^[A-Z0-9_-]+$/) code?: string;
  @IsOptional() @IsEnum(['percentage', 'fixed']) type?: 'percentage' | 'fixed';
  @IsOptional() @IsInt() @Min(1) value?: number;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsInt() @Min(1) usageLimit?: number | null;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsInt() @Min(0) minOrderAmount?: number | null;
  @IsOptional() @ValidateIf((_, v) => v !== null) @Matches(DATE) startsAt?: string | null;
  @IsOptional() @ValidateIf((_, v) => v !== null) @Matches(DATE) endsAt?: string | null;
}
