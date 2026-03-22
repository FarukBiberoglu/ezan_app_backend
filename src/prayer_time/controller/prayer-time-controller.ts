import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { GetUser } from 'src/auth/decorator/get-user.decorator';
import { PrayerTimesService } from '../service/prayer-time-service';

@Controller('prayer-times')
export class PrayerTimesController {
  constructor(private readonly prayerTimesService: PrayerTimesService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  getPrayerTimes(@GetUser('id') userId: string) {
    return this.prayerTimesService.getPrayerTimes(userId);
  }
}