import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/service/prisma.service';
import { QuranService } from 'src/quran/service/quran-service';
import { CreatePlanDto } from '../dto/create-plan.dto';

@Injectable()
export class PlanService {
  constructor(
    private prisma: PrismaService,
    private quranService: QuranService,
  ) {}

  async createPlan(userId: string, dto: CreatePlanDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('Kullanici bulunamadi.');
    }

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    const totalDays =
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1;

    const base = Math.floor(30 / totalDays);
    const extra = 30 % totalDays;

    let currentJuz = 1;

    const daysData: Array<{
      date: Date;
      startJuz: number;
      endJuz: number;
    }> = [];

    for (let i = 0; i < totalDays; i++) {
      if (currentJuz > 30) break;

      let juzCount = base;

      if (i < extra) {
        juzCount += 1;
      }

      const start = currentJuz;
      let end = currentJuz + juzCount - 1;

      if (end > 30) end = 30;

      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      daysData.push({
        date,
        startJuz: start,
        endJuz: end,
      });

      currentJuz = end + 1;
    }

    const plan = await this.prisma.plan.create({
      data: {
        userId,
        startDate,
        endDate,
        totalDays,
        days: {
          create: daysData,
        },
      },
      include: {
        days: {
          orderBy: { date: 'asc' },
        },
      },
    });

    return plan;
  }

  async getPlans(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException('kULLANCİ yoq');
    }

    return this.prisma.plan.findMany({
      where: { userId },
      include: {
        days: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getPlanById(planId: string) {
    return this.prisma.plan.findUnique({
      where: { id: planId },
      include: {
        days: {
          orderBy: { date: 'asc' },
        },
      },
    });
  }

  async toggleDay(planDayId: string) {
    const day = await this.prisma.planDay.findUnique({
      where: { id: planDayId },
    });

    return this.prisma.planDay.update({
      where: { id: planDayId },
      data: {
        completed: !day?.completed,
      },
    });
  }

  async getPlanDayVerses(planDayId: string) {
    const day = await this.prisma.planDay.findUnique({
      where: { id: planDayId },
    });

    if (!day) {
      throw new NotFoundException('Gun bulunamadi');
    }

    const targetJuzIds = Array.from(
      { length: day.endJuz - day.startJuz + 1 },
      (_, i) => day.startJuz + i,
    );
    await Promise.all(targetJuzIds.map((id) => this.quranService.getJuz(id)));

    const verses = await this.prisma.juzVerse.findMany({
      where: {
        juzId: {
          gte: day.startJuz,
          lte: day.endJuz,
        },
      },
      include: {
        surah: true,
      },
      orderBy: [{ surahId: 'asc' }, { number: 'asc' }],
    });

    const grouped: Record<string, any> = {};

    for (const v of verses) {
      const key = v.surahId;

      if (!grouped[key]) {
        grouped[key] = {
          surahId: v.surahId,
          surahName: v.surah.name,
          ayahs: [],
        };
      }

      grouped[key].ayahs.push(v.number);
    }
    const result = Object.values(grouped);

    return {
      date: day.date,
      juzRange: `${day.startJuz}-${day.endJuz}`,
      surahs: result,
    };
  }
}
