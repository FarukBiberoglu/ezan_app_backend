import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/module/prisma.module';
import { PrayerTimesModule } from './prayer_time/module/prayer-time-module';
import { RedisModule } from '@nestjs-modules/ioredis';
import { UserSettingsModule } from './user_settings/module/user-settings.module';

@Module({
  imports: [
    RedisModule.forRoot({
      type: 'single',
      url: 'redis://localhost:6379',
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    PrayerTimesModule,
    AuthModule,
    PrismaModule,
    UserSettingsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
