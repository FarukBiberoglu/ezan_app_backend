import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { QuranService } from '../service/quran-service';

@Controller('quran')
export class QuranController {
  constructor(private readonly quranService: QuranService) {}

  @Get('surahs')
  getSurahs() {
    return this.quranService.getSurahs();
  }

  @Get('surahs/:id')
  getSurah(@Param('id', ParseIntPipe) id: number) {
    return this.quranService.getSurah(id);
  }

  @Get('surahs/:id/tr')
  getSurahWithTranslation(@Param('id', ParseIntPipe) id: number) {
    return this.quranService.getSurahWithTranslation(id);
  }
  @Get('juz/:id')
  getJuz(@Param('id', ParseIntPipe) id: number) {
    return this.quranService.getJuz(id);
  }

  @Get('ayah/:id/audio')
  getAyahAudio(@Param('id', ParseIntPipe) id: number) {
    return this.quranService.getAyahAudio(id);
  }

  @Get('search')
  search(@Query('q') query: string) {
    return this.quranService.searchAyahs(query);
  }

}