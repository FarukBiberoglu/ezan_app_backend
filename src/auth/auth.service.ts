import {
    BadRequestException,
    Injectable,
    UnauthorizedException,
  } from '@nestjs/common';
  import { JwtService } from '@nestjs/jwt';
  import * as bcrypt from 'bcrypt';
  import { PrismaService } from 'src/prisma/service/prisma.service';
  import { LoginDto } from './dto/login.dto';
  import { RegisterDto } from './dto/register.dto';
  
  @Injectable()
  export class AuthService {
    constructor(
      private prisma: PrismaService,
      private jwt: JwtService,
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
  
      const match = await bcrypt.compare(dto.password, user.password);
      if (!match) throw new UnauthorizedException('Invalid credentials');
  
      const tokens = this.generateTokens(user.id);
  
      await this.saveRefreshToken(user.id, tokens.refresh_token);
  
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
  
        const match = await bcrypt.compare(
          refreshToken,
          user.refreshToken,
        );
  
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
      const access_token = this.jwt.sign(
        { userId },
        { expiresIn: '15m' },
      );
  
      const refresh_token = this.jwt.sign(
        { userId },
        { expiresIn: '7d' },
      );
  
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