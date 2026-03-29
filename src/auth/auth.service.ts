import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { verifyIdToken as verifyAppleIdToken } from 'apple-signin-auth';
import { OAuth2Client } from 'google-auth-library';
import { Provider } from 'generated/prisma/client';
import { PrismaService } from 'src/prisma/service/prisma.service';
import { AppleSignInDto } from './dto/apple-signin.dto';
import { GoogleSignInDto } from './dto/google-signin.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly googleClient = new OAuth2Client();

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (exists) {
      throw new BadRequestException('User already exists');
    }

    const hashed = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashed,
        provider: Provider.LOCAL,
      },
    });

    const tokens = this.generateTokens(user.id);

    await this.saveRefreshToken(user.id, tokens.refresh_token);

    return tokens;
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const match = await bcrypt.compare(dto.password, user.password);
    if (!match) throw new UnauthorizedException('Invalid credentials');

    const tokens = this.generateTokens(user.id);

    await this.saveRefreshToken(user.id, tokens.refresh_token);

    return tokens;
  }

  async loginWithGoogle(dto: GoogleSignInDto) {
    const audiences = this.getGoogleOAuthAudiences();
    if (audiences.length === 0) {
      throw new InternalServerErrorException('Google OAuth is not configured');
    }

    let ticket;
    try {
      ticket = await this.googleClient.verifyIdToken({
        idToken: dto.idToken,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Google verifyIdToken failed: ${msg}`);
      throw new UnauthorizedException('Invalid Google token');
    }

    const payload = ticket.getPayload();
    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid Google token');
    }

    if (!this.isGoogleTokenAudAllowed(payload.aud, audiences)) {
      this.logger.warn(
        `Google ID token aud not in GOOGLE_CLIENT_IDS. Token aud=${JSON.stringify(payload.aud)}. ` +
          `Add this client id to .env (comma-separated).`,
      );
      throw new UnauthorizedException('Invalid Google token');
    }

    if (payload.email_verified === false) {
      throw new BadRequestException('Google email is not verified');
    }

    const email = payload.email;
    if (!email) {
      throw new BadRequestException('Google account has no email');
    }

    const googleId = payload.sub;

    const byGoogle = await this.prisma.user.findUnique({
      where: { googleId },
    });
    if (byGoogle) {
      return this.issueSessionTokens(byGoogle.id);
    }

    const byEmail = await this.prisma.user.findUnique({
      where: { email },
    });

    if (byEmail) {
      if (byEmail.googleId && byEmail.googleId !== googleId) {
        throw new BadRequestException(
          'This email is linked to another Google account',
        );
      }

      const user = await this.prisma.user.update({
        where: { id: byEmail.id },
        data: {
          googleId,
          provider: Provider.GOOGLE,
        },
      });
      return this.issueSessionTokens(user.id);
    }

    const user = await this.prisma.user.create({
      data: {
        email,
        googleId,
        provider: Provider.GOOGLE,
      },
    });

    return this.issueSessionTokens(user.id);
  }

  async loginWithApple(dto: AppleSignInDto) {
    const clientId = this.config.get<string>('APPLE_CLIENT_ID')?.trim();
    if (!clientId) {
      throw new InternalServerErrorException('Apple Sign In is not configured');
    }

    let payload: Awaited<ReturnType<typeof verifyAppleIdToken>>;
    try {
      payload = await verifyAppleIdToken(dto.identityToken, {
        audience: clientId,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Apple verifyIdToken failed: ${msg}`);
      throw new UnauthorizedException('Invalid Apple token');
    }

    const appleId = payload.sub;
    const emailFromToken =
      typeof payload.email === 'string' && payload.email.length > 0
        ? payload.email
        : null;
    const email = emailFromToken ?? `apple.${appleId}.user@signin.local`;

    const byApple = await this.prisma.user.findUnique({
      where: { appleId },
    });
    if (byApple) {
      return this.issueSessionTokens(byApple.id);
    }

    if (emailFromToken) {
      const byEmail = await this.prisma.user.findUnique({
        where: { email: emailFromToken },
      });
      if (byEmail) {
        if (byEmail.appleId && byEmail.appleId !== appleId) {
          throw new BadRequestException(
            'This email is linked to another Apple account',
          );
        }
        const user = await this.prisma.user.update({
          where: { id: byEmail.id },
          data: {
            appleId,
            provider: Provider.APPLE,
          },
        });
        return this.issueSessionTokens(user.id);
      }
    }

    const user = await this.prisma.user.create({
      data: {
        email,
        appleId,
        provider: Provider.APPLE,
      },
    });

    return this.issueSessionTokens(user.id);
  }

  private getGoogleOAuthAudiences(): string[] {
    const raw =
      this.config.get<string>('GOOGLE_CLIENT_IDS') ??
      this.config.get<string>('GOOGLE_CLIENT_ID');
    if (!raw?.trim()) return [];
    return raw
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  private isGoogleTokenAudAllowed(
    aud: string | string[] | undefined,
    allowed: string[],
  ): boolean {
    if (aud == null) return false;
    if (typeof aud === 'string') return allowed.includes(aud);
    if (Array.isArray(aud)) {
      return aud.some((a) => typeof a === 'string' && allowed.includes(a));
    }
    return false;
  }

  private async issueSessionTokens(userId: string) {
    const tokens = this.generateTokens(userId);
    await this.saveRefreshToken(userId, tokens.refresh_token);
    return tokens;
  }

  async getMe(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwt.verify(refreshToken) as { userId: string };

      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException();
      }

      const match = await bcrypt.compare(refreshToken, user.refreshToken);

      if (!match) {
        throw new UnauthorizedException();
      }

      const tokens = this.generateTokens(user.id);

      await this.saveRefreshToken(user.id, tokens.refresh_token);

      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    return { message: 'Logged out' };
  }

  private generateTokens(userId: string) {
    const access_token = this.jwt.sign({ userId }, { expiresIn: '15m' });

    const refresh_token = this.jwt.sign({ userId }, { expiresIn: '7d' });

    return { access_token, refresh_token };
  }

  private async saveRefreshToken(userId: string, refreshToken: string) {
    const hashed = await bcrypt.hash(refreshToken, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashed },
    });
  }
}
