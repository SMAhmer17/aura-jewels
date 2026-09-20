import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsEmail, IsEnum, IsInt, IsOptional, IsString,
  IsUUID, Matches, Length, Max, MaxLength, Min, ValidateNested,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export class CustomerDto {
  @Transform(trim) @IsString() @Length(1, 100) name: string;
  @Transform(trim) @IsEmail() @MaxLength(200) email: string;
  @Transform(trim) @IsString() @Length(7, 20) phone: string;
  @Transform(trim) @IsString() @Length(1, 300) address: string;
  @Transform(trim) @IsString() @Length(1, 100) city: string;
}

export class OrderLineDto {
  @IsUUID() variantId: string;
  @IsInt() @Min(1) @Max(20) quantity: number;
}

/** The client only says WHAT is wanted. Prices, shipping, and totals are always worked out by the server. */
export class PlaceOrderDto {
  @ValidateNested() @Type(() => CustomerDto) customer: CustomerDto;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(50) @ValidateNested({ each: true }) @Type(() => OrderLineDto) items: OrderLineDto[];
  @IsOptional() @Transform(trim) @IsString() @MaxLength(40) discountCode?: string;
  @IsOptional() @IsBoolean() giftBox?: boolean;
}

export class UpdateOrderStatusDto {
  @IsEnum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']) status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
}

export class UpdateOrderDetailsDto {
  @IsOptional() @IsEnum(['unpaid', 'paid', 'refunded']) paymentStatus?: 'unpaid' | 'paid' | 'refunded';
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}

export class OrderQueryDto {
  @IsOptional() @IsString() @MaxLength(100) q?: string;
  @IsOptional() @IsEnum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']) status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  @IsOptional() @IsEnum(['unpaid', 'paid', 'refunded']) payment?: 'unpaid' | 'paid' | 'refunded';
  @IsOptional() @Matches(DATE) from?: string;
  @IsOptional() @Matches(DATE) to?: string;
  @IsOptional() @IsEnum(['newest', 'oldest', 'highest', 'lowest']) sort?: 'newest' | 'oldest' | 'highest' | 'lowest';
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(200) pageSize?: number;
}
