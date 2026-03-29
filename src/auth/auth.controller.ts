import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { GetUser } from './decorator/get-user.decorator';
import { RefreshDto } from './dto/refresh.dto';
import { AppleSignInDto } from './dto/apple-signin.dto';
import { GoogleSignInDto } from './dto/google-signin.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('google')
  googleSignIn(@Body() dto: GoogleSignInDto) {
    return this.authService.loginWithGoogle(dto);
  }

  @Post('apple')
  appleSignIn(@Body() dto: AppleSignInDto) {
    return this.authService.loginWithApple(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@GetUser() user: { userId: string }) {
    return this.authService.getMe(user.userId);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@GetUser() user: { userId: string }) {
    return this.authService.logout(user.userId);
  }
}
