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
    number: number;
    numberInSurah: number;
    text: string;
    surah: {
      number: number;
    };
  }[];
}

export interface ApiAyah {
  number: number;
  numberInSurah: number;
  text: string;
}

export interface ApiSurahDetail extends ApiSurah {
  ayahs: ApiAyah[];
}

export interface ApiAudioResponse {
  data: {
    number: number;
    audio: string;
  };
}