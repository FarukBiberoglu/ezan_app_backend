import { Injectable, NotFoundException } from "@nestjs/common";
import axios from "axios";
import { PrismaService } from "src/prisma/service/prisma.service";
import Redis from "ioredis";
import { InjectRedis } from "@nestjs-modules/ioredis";

@Injectable()
export class PrayerTimesService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectRedis() private readonly redis: Redis
  ) {}

  async getPrayerTimes(userId: string) {
    const settings = await this.prisma.userSettings.findUnique({
      where: { userId },
    });

    if (!settings || !settings.latitude || !settings.longitude) {
      throw new NotFoundException("Location not set");
    }

    const { latitude, longitude, method } = settings;

    const today = new Date().toISOString().split("T")[0];

    const round = (num: number) => Number(num.toFixed(2));

    const latRounded = round(latitude);
    const lngRounded = round(longitude);

    const cacheKey = `prayer:${latRounded}:${lngRounded}:${method}:${today}`;

    const cachedData = await this.redis.get(cacheKey);

    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const url = `https://api.aladhan.com/v1/timings/${today}?latitude=${latitude}&longitude=${longitude}&method=${method}`;

    const response = await axios.get(url);

    const timings = response.data.data.timings;

    const result = {
      fajr: timings.Fajr,
      dhuhr: timings.Dhuhr,
      asr: timings.Asr,
      maghrib: timings.Maghrib,
      isha: timings.Isha,
      date: today,
    };

    const now = new Date();
    const midnight = new Date();

    midnight.setHours(24, 0, 0, 0); 

    const ttl = Math.floor((midnight.getTime() - now.getTime()) / 1000);
    await this.redis.set(cacheKey, JSON.stringify(result), "EX", ttl);

    return result;
  }

  async getMonthlyPrayerTimes(userId: string) {
    const settings = await this.prisma.userSettings.findUnique({
      where: { userId },
    });
  
    if (!settings || !settings.latitude || !settings.longitude) {
      throw new NotFoundException('Location not set');
    }
  
    const { latitude, longitude, method } = settings;
  
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
  
    const round = (num: number) => Number(num.toFixed(2));
    const latRounded = round(latitude);
    const lngRounded = round(longitude);
  
    const cacheKey = `prayer:month:${latRounded}:${lngRounded}:${method}:${month}:${year}`;
  
    const cached = await this.redis.get(cacheKey);
  
    if (cached) {
      return JSON.parse(cached);
    }
  
      const url = `https://api.aladhan.com/v1/calendar?latitude=${latitude}&longitude=${longitude}&method=${method}&month=${month}&year=${year}`;
  
    const response = await axios.get(url);
  
    const data = response.data.data;
  
    const result = data.map((day: any) => ({
      date: day.date.gregorian.date,
      fajr: day.timings.Fajr,
      dhuhr: day.timings.Dhuhr,
      asr: day.timings.Asr,
      maghrib: day.timings.Maghrib,
      isha: day.timings.Isha,
    }));
  
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);
    const ttl = Math.floor((endOfMonth.getTime() - now.getTime()) / 1000);
  
    await this.redis.set(cacheKey, JSON.stringify(result), 'EX', ttl);
  
    return result;
  }
}