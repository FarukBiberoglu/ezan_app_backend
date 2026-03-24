import { Injectable } from "@nestjs/common";
import axios from "axios";
import { PrismaService } from "src/prisma/service/prisma.service";
import {
  ApiJuz,
  ApiSurah,
  ApiSurahDetail,
} from "../types/quran-api.types";



@Injectable()
export class QuranService {
  constructor(private prisma: PrismaService) {}


  
  async getJuz(id: number) {
    const existing = await this.prisma.juz.findUnique({
      where: { id },
      include: { verses: true },
    });
  
    if (existing && existing.verses.length > 0) {
      return existing;
    }
  
  
    const url = `https://api.alquran.cloud/v1/juz/${id}`;
  
    const response = await axios.get<{ data: ApiJuz }>(url);
  
    const juz = response.data.data;
  
    await this.prisma.juz.upsert({
      where: { id },
      update: {},
      create: {
        id: juz.number,
      },
    });
  
    await this.prisma.juzVerse.createMany({
      data: juz.ayahs.map((a) => ({
        juzId: id,
        surahId: a.surah.number,
        number: a.numberInSurah,
        text: a.text,
      })),
      skipDuplicates: true,
    });
  
    return this.prisma.juz.findUnique({
      where: { id },
      include: { verses: true },
    });
  }
  
  async getSurahs() {
    const surahs = await this.prisma.surah.findMany({
      orderBy: { id: 'asc' },
    });

    if (surahs.length > 0) {
      return surahs;
    }


    const url = "https://api.alquran.cloud/v1/surah";
    const response = await axios.get<{ data: ApiSurah[] }>(url);
    const data = response.data.data;

    await this.prisma.surah.createMany({
      data: data.map((s) => ({
        id: s.number,
        name: s.name,
        englishName: s.englishName,
        englishTranslation: s.englishNameTranslation,
        numberOfAyahs: s.numberOfAyahs,
        revelationType: s.revelationType,
      })),
    });

    return data;
  }

  async getSurah(id: number) {
    const existing = await this.prisma.surah.findUnique({
      where: { id },
      include: { verses: true },
    });

    if (existing && existing.verses.length > 0) {
      return existing;
    }


    const url = `https://api.alquran.cloud/v1/surah/${id}`;
    const response = await axios.get<{ data: ApiSurahDetail }>(url);
    const surah = response.data.data;

    await this.prisma.surah.upsert({
      where: { id },
      update: {},
      create: {
        id: surah.number,
        name: surah.name,
        englishName: surah.englishName,
        englishTranslation: surah.englishNameTranslation,
        numberOfAyahs: surah.numberOfAyahs,
        revelationType: surah.revelationType,
      },
    });

    await this.prisma.verse.createMany({
      data: surah.ayahs.map((a) => ({
        surahId: id,
        globalNumber: a.number,
        number: a.numberInSurah,
        text: a.text,
      })),
      skipDuplicates: true,
    });

    return this.prisma.surah.findUnique({
      where: { id },
      include: { verses: true },
    });
  }

  async getSurahWithTranslation(id: number) {
    const existing = await this.prisma.surah.findUnique({
      where: { id },
      include: { verses: true },
    });

    const hasTranslation = existing?.verses?.some((v) => v.translation);

    if (existing && hasTranslation) {
      return existing;
    }

    await this.getSurah(id);


    const url = `https://api.alquran.cloud/v1/surah/${id}/tr.diyanet`;
    const response = await axios.get<{ data: ApiSurahDetail }>(url);
    const surah = response.data.data;

    await this.prisma.surah.upsert({
      where: { id },
      update: {},
      create: {
        id: surah.number,
        name: surah.name,
        englishName: surah.englishName,
        englishTranslation: surah.englishNameTranslation,
        numberOfAyahs: surah.numberOfAyahs,
        revelationType: surah.revelationType,
      },
    });

    await Promise.all(
      surah.ayahs.map((a) =>
        this.prisma.verse.updateMany({
          where: {
            surahId: id,
            number: a.numberInSurah,
          },
          data: {
            translation: a.text,
          },
        }),
      ),
    );

    return this.prisma.surah.findUnique({
      where: { id },
      include: { verses: true },
    });
  }


  async getAyahAudio(ayahId : number){
    const existing = await this.prisma.verse.findUnique({
      where: { globalNumber: ayahId },
    });
    if (existing?.audioUrl) {
      console.log('DB HIT 💣');
      return {
        ayahId,
        audioUrl: existing.audioUrl,
      };
    }
    const url = `https://api.alquran.cloud/v1/ayah/${ayahId}/ar.alafasy`;

    const response = await axios.get<{
      data: {
        number: number;
        audio: string;
      };
    }>(url);

    const audioUrl = response.data.data.audio;

    await this.prisma.verse.updateMany({
      where: { globalNumber: ayahId },
      data: { audioUrl },
    });
  
    return {
      ayahId,
      audioUrl,
    };
  }
   
  async searchAyahs(query: string) {
    if (!query || query.trim().length < 2) {
      return [];
    }
    const results = await this.prisma.verse.findMany({
      where: {
        OR: [
          { text: { contains: query, mode: 'insensitive' } },
          { translation: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 20, 
      orderBy: {
        globalNumber: 'asc',
      },
    });
  
    return results.map((v) => ({
      surahId: v.surahId,
      ayahNumber: v.number,
      text: v.text,
      translation: v.translation,
      globalNumber: v.globalNumber,
    }));
  }


}