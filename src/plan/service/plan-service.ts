import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/service/prisma.service';
import { CreatePlanDto } from '../dto/create-plan.dto';
import { UpdatePlanDto } from '../dto/update-plan.dto';
import { PLAN_PRESETS } from '../constant/plan-presets';

type SurahGroup = {
  surahId: number;
  surahName: string;
  ayahs: number[];
};

@Injectable()
export class PlanService {
  constructor(private prisma: PrismaService) {}

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

    if (totalDays <= 0) {
      throw new Error('Geçersiz tarih aralığı');
    }

    const daysData: {
      date: Date;
      startJuz: number | null;
      endJuz: number | null;
      startGlobalNumber: number | null;
      endGlobalNumber: number | null;
    }[] = [];

    if (totalDays <= 30) {
      const base = Math.floor(30 / totalDays);
      const extra = 30 % totalDays;

      let currentJuz = 1;

      for (let i = 0; i < totalDays; i++) {
        if (currentJuz > 30) break;

        let juzCount = base;
        if (i < extra) juzCount += 1;

        const start = currentJuz;
        let end = currentJuz + juzCount - 1;
        if (end > 30) end = 30;

        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);

        daysData.push({
          date,
          startJuz: start,
          endJuz: end,
          startGlobalNumber: null,
          endGlobalNumber: null,
        });

        currentJuz = end + 1;
      }
    } else {
      const totalAyahs = 6236;
      const base = Math.floor(totalAyahs / totalDays);
      const extra = totalAyahs % totalDays;

      let current = 1;

      for (let i = 0; i < totalDays; i++) {
        if (current > totalAyahs) break;

        let cnt = base;
        if (i < extra) cnt += 1;

        const startGlobal = current;
        let endGlobal = current + cnt - 1;
        if (endGlobal > totalAyahs) endGlobal = totalAyahs;

        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);

        daysData.push({
          date,
          startJuz: null,
          endJuz: null,
          startGlobalNumber: startGlobal,
          endGlobalNumber: endGlobal,
        });

        current = endGlobal + 1;
      }
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.plan.updateMany({
        where: { userId },
        data: { isActive: false },
      });

      return tx.plan.create({
        data: {
          userId,
          startDate,
          endDate,
          totalDays,
          isActive: true,
          days: { create: daysData },
        },
        include: {
          days: { orderBy: { date: 'asc' } },
        },
      });
    });
  }

  async getPlans(userId: string) {
    return this.prisma.plan.findMany({
      where: { userId },
      include: { days: true },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getPlanById(planId: string, userId: string) {
    const plan = await this.prisma.plan.findFirst({
      where: { id: planId, userId },
      include: {
        days: { orderBy: { date: 'asc' } },
      },
    });

    if (!plan) {
      throw new NotFoundException('Plan bulunamadi');
    }

    return plan;
  }

  async toggleDay(planDayId: string) {
    const day = await this.prisma.planDay.findUnique({
      where: { id: planDayId },
    });

    if (!day) {
      throw new NotFoundException('Gun bulunamadi');
    }

    return this.prisma.planDay.update({
      where: { id: planDayId },
      data: { completed: !day.completed },
    });
  }

  async getPlanDayVerses(planDayId: string, userId: string) {
    const day = await this.prisma.planDay.findFirst({
      where: { id: planDayId, plan: { userId } },
    });

    if (!day) {
      throw new NotFoundException('Gun bulunamadi');
    }

    if (day.startGlobalNumber != null && day.endGlobalNumber != null) {
      const verses = await this.prisma.verse.findMany({
        where: {
          globalNumber: {
            gte: day.startGlobalNumber,
            lte: day.endGlobalNumber,
          },
        },
        include: { surah: true },
        orderBy: [{ surahId: 'asc' }, { number: 'asc' }],
      });

      const grouped: Record<number, SurahGroup> = {};

      for (const v of verses) {
        if (!grouped[v.surahId]) {
          grouped[v.surahId] = {
            surahId: v.surahId,
            surahName: v.surah.name,
            ayahs: [],
          };
        }

        grouped[v.surahId].ayahs.push(v.number);
      }

      return {
        date: day.date,
        juzRange: '-',
        surahs: Object.values(grouped),
      };
    }

    const startJuz = day.startJuz ?? 0;
    const endJuz = day.endJuz ?? 0;

    const verses = await this.prisma.juzVerse.findMany({
      where: {
        juzId: {
          gte: startJuz,
          lte: endJuz,
        },
      },
      include: { surah: true },
      orderBy: [{ surahId: 'asc' }, { number: 'asc' }],
    });

    const grouped: Record<number, SurahGroup> = {};

    for (const v of verses) {
      if (!grouped[v.surahId]) {
        grouped[v.surahId] = {
          surahId: v.surahId,
          surahName: v.surah.name,
          ayahs: [],
        };
      }

      grouped[v.surahId].ayahs.push(v.number);
    }

    return {
      date: day.date,
      juzRange: `${startJuz}-${endJuz}`,
      surahs: Object.values(grouped),
    };
  }

  async deletePlan(planId: string, userId: string) {
    const plan = await this.prisma.plan.findFirst({
      where: { id: planId, userId },
    });

    if (!plan) {
      throw new NotFoundException('Plan bulunamadi');
    }

    await this.prisma.planDay.deleteMany({ where: { planId } });

    return this.prisma.plan.delete({ where: { id: planId } });
  }

  async updatePlan(planId: string, userId: string, dto: UpdatePlanDto) {
    const plan = await this.prisma.plan.findFirst({
      where: { id: planId, userId },
    });

    if (!plan) {
      throw new NotFoundException('Plan bulunamadi');
    }

    await this.prisma.planDay.deleteMany({ where: { planId } });

    return this.createPlan(userId, dto);
  }

  async setActivePlan(planId: string, userId: string) {
    await this.prisma.plan.updateMany({
      where: { userId },
      data: { isActive: false },
    });

    return this.prisma.plan.update({
      where: { id: planId },
      data: { isActive: true },
    });
  }

  async getSurahVersesForDay(
    planDayId: string,
    surahId: number,
    userId: string,
  ) {
    const day = await this.prisma.planDay.findFirst({
      where: { id: planDayId, plan: { userId } },
    });

    if (!day) {
      throw new NotFoundException('Gun bulunamadi');
    }

    if (day.startGlobalNumber != null && day.endGlobalNumber != null) {
      return this.prisma.verse.findMany({
        where: {
          surahId,
          globalNumber: {
            gte: day.startGlobalNumber,
            lte: day.endGlobalNumber,
          },
        },
        orderBy: { number: 'asc' },
        select: {
          globalNumber: true,
          number: true,
          text: true,
          translation: true,
          audioUrl: true,
        },
      });
    }

    if (day.startJuz == null || day.endJuz == null) {
      throw new NotFoundException('Gun okumasi tanimli degil');
    }

    const juzVerses = await this.prisma.juzVerse.findMany({
      where: {
        juzId: { gte: day.startJuz, lte: day.endJuz },
        surahId,
      },
      select: { number: true },
    });

    const numbers = juzVerses.map((v) => v.number);

    if (numbers.length === 0) return [];

    return this.prisma.verse.findMany({
      where: {
        surahId,
        number: { in: numbers },
      },
      orderBy: { number: 'asc' },
      select: {
        globalNumber: true,
        number: true,
        text: true,
        translation: true,
        audioUrl: true,
      },
    });
  }

  getPresets() {
    return PLAN_PRESETS;
  }

  async createFromPreset(userId: string, presetId: string) {
    const preset = PLAN_PRESETS.find((p) => p.id === presetId);

    if (!preset) {
      throw new NotFoundException('Preset bulunamadi');
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + preset.days - 1);

    return this.createPlan(userId, {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
  }
}
