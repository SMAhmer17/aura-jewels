import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

const bool = ({ value }: { value: unknown }) => (value === 'true' ? true : value === 'false' ? false : value);

export class CustomersQueryDto {
  @IsOptional() @IsString() @MaxLength(100) q?: string;
  @IsOptional() @IsEnum(['spent', 'orders', 'recent', 'name']) sort?: 'spent' | 'orders' | 'recent' | 'name';
  @IsOptional() @Transform(bool) @IsBoolean() repeatOnly?: boolean;
}

export class AnalyticsQueryDto {
  @IsOptional() @IsEnum(['all', 'today', '7d', '30d']) range?: 'all' | 'today' | '7d' | '30d';
}
