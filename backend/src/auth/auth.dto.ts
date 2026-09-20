import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

const lower = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value);

export class LoginDto {
  @Transform(lower) @IsEmail() @MaxLength(200) email: string;
  @IsString() @MinLength(1) @MaxLength(200) password: string;
}

export class RegisterDto {
  @IsString() @MinLength(1) @MaxLength(100) name: string;
  @Transform(lower) @IsEmail() @MaxLength(200) email: string;
  @IsString() @MinLength(8) @MaxLength(200) password: string;
  @IsOptional() @IsString() @MaxLength(20) phone?: string;
}
