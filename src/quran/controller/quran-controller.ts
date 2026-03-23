import { Controller, Get, Param } from '@nestjs/common';
import { QuranService } from '../service/quran-service';

@Controller('quran')
export class QuranController {
  constructor(private readonly quranService: QuranService) {}

  @Get('surahs')
  getSurahs() {
    return this.quranService.getSurahs();
  }

  @Get('surahs/:id')
  getSurah(@Param('id') id: string) {
    return this.quranService.getSurah(Number(id));
  }

  @Get('surahs/:id/tr')
  getSurahWithTranslation(@Param('id') id: string) {
    return this.quranService.getSurahWithTranslation(Number(id));
  }
  @Get('juz/:id')
getJuz(@Param('id') id: string) {
  return this.quranService.getJuz(Number(id));
}
}