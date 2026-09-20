import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsInt, IsOptional, IsString, Length, Max, MaxLength, Min } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const lower = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value);

/** A customer review. The email is never shown publicly; it stops repeat reviews and confirms a real purchase. */
export class CreateReviewDto {
  @Transform(trim) @IsString() @Length(1, 80) author: string;
  @Transform(lower) @IsEmail() @MaxLength(200) email: string;
  @IsInt() @Min(1) @Max(5) rating: number;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(100) title?: string;
  @Transform(trim) @IsString() @Length(10, 2000, { message: 'Please write at least 10 characters about the product.' }) comment: string;
}

export class PublishReviewDto {
  @IsBoolean() isPublished: boolean;
}
