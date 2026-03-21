import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({})
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(32)
  password: string;
}
