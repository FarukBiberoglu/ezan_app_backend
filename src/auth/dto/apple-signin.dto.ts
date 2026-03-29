import { IsNotEmpty, IsString } from 'class-validator';

export class AppleSignInDto {
  @IsString()
  @IsNotEmpty()
  identityToken: string;
}
