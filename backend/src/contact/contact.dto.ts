import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const lower = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value);
const upper = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toUpperCase() : value);

export class CreateMessageDto {
  @Transform(trim) @IsString() @Length(1, 100) name: string;
  @Transform(lower) @IsEmail() @MaxLength(200) email: string;
  @IsOptional() @Transform(trim) @IsString() @Length(7, 20) phone?: string;
  @IsOptional() @Transform(upper) @Matches(/^(AJ-\d{4}-\d{4,9})?$/, { message: 'Order numbers look like AJ-2026-1001.' }) orderNumber?: string;
  @Transform(trim) @IsString() @Length(10, 2000, { message: 'Please write at least 10 characters so we can help.' }) message: string;
  /** Hidden field. People never fill it in; bots do. */
  @IsOptional() @IsString() @MaxLength(200) website?: string;
}

export class UpdateMessageStatusDto {
  @IsEnum(['unread', 'read', 'resolved']) status: 'unread' | 'read' | 'resolved';
}

export class MessageQueryDto {
  @IsOptional() @IsEnum(['unread', 'read', 'resolved']) status?: 'unread' | 'read' | 'resolved';
  @IsOptional() @IsString() @MaxLength(100) q?: string;
}
