import { Module } from '@nestjs/common';
import { QuranService } from '../service/quran-service';
import { QuranController } from '../controller/quran-controller';
import { PrismaService } from 'src/prisma/service/prisma.service';

@Module({
  controllers: [QuranController],
  providers: [QuranService, PrismaService],
  exports: [QuranService],
})
export class QuranModule {}
