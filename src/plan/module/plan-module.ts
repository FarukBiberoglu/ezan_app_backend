import { Module } from '@nestjs/common';
import { PlanController } from '../controller/plan-controller';
import { PlanService } from '../service/plan-service';
import { PrismaService } from 'src/prisma/service/prisma.service';
import { QuranModule } from 'src/quran/module/quran-module';

@Module({
  imports: [QuranModule],
  controllers: [PlanController],
  providers: [PlanService, PrismaService],
})
export class PlanModule {}
