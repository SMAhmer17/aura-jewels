import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsString, Length, Max, Min } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateReviewDto {
  @Transform(trim) @IsString() @Length(1, 80) author: string;
  @IsInt() @Min(1) @Max(5) rating: number;
  @Transform(trim) @IsString() @Length(1, 2000) comment: string;
}

export class PublishReviewDto {
  @IsBoolean() isPublished: boolean;
}
