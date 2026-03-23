import { Injectable } from "@nestjs/common";
import axios from "axios";
import { PrismaService } from "src/prisma/service/prisma.service";

export interface ApiSurah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}
export interface ApiJuz {
  number: number;
  ayahs: {
    numberInSurah: number;
    text: string;
    surah: {
      number: number;
    };
  }[];
}

export interface ApiAyah {
  numberInSurah: number;
  text: string;
}

export interface ApiSurahDetail extends ApiSurah {
  ayahs: ApiAyah[];
}



@Injectable()
export class QuranService {
  constructor(private prisma: PrismaService) {}


  
  async getJuz(id: number) {
    // 🔹 DB kontrol
    const existing = await this.prisma.juz.findUnique({
      where: { id },
      include: { verses: true },
    });
  
    if (existing && existing.verses.length > 0) {
      console.log('DB HIT 💣');
      return existing;
    }
  
    console.log('API CALL 🔥');
  
    // 🔹 API çağır
    const url = `https://api.alquran.cloud/v1/juz/${id}`;
  
    const response = await axios.get<{ data: ApiJuz }>(url);
  
    const juz = response.data.data;
  
    // 🔹 Juz kaydet
    await this.prisma.juz.upsert({
      where: { id },
      update: {},
      create: {
        id: juz.number,
      },
    });
  
    // 🔹 Ayetleri kaydet
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

    // Translation endpoint'i Arapca metin donmedigi icin
    // once ayetlerin text alanini Arapca olarak garanti altina aliriz.
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
}