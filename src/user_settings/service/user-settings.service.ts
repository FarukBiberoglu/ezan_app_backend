import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/service/prisma.service';

@Injectable()
export class UserSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(userId: string) {
    return this.prisma.userSettings.findUnique({
      where: { userId },
    });
  }

  async updateLocation(userId: string, latitude: number, longitude: number) {
    return this.prisma.userSettings.upsert({
      where: { userId },

      update: {
        latitude,
        longitude,
      },

      create: {
        userId,
        latitude,
        longitude,
        method: 13,
        updatedAt: new Date(),
      },
    });
  }
}
