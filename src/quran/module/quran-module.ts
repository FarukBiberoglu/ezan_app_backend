import { Module } from '@nestjs/common';
import { QuranService } from '../service/quran-service';
import { QuranController } from '../controller/quran-controller';


@Module({
  controllers: [QuranController],
  providers: [QuranService],
})
export class QuranModule {}