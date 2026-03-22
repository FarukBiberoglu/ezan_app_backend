import { Module } from '@nestjs/common';
import { PrayerTimesService } from '../service/prayer-time-service';
import { PrayerTimesController } from '../controller/prayer-time-controller';

@Module({
  controllers: [PrayerTimesController],
  providers: [PrayerTimesService],
})
export class PrayerTimesModule {}