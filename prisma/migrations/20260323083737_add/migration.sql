-- CreateTable
CREATE TABLE "Surah" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "englishName" TEXT NOT NULL,
    "englishTranslation" TEXT NOT NULL,
    "numberOfAyahs" INTEGER NOT NULL,
    "revelationType" TEXT NOT NULL,

    CONSTRAINT "Surah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verse" (
    "id" SERIAL NOT NULL,
    "surahId" INTEGER NOT NULL,
    "number" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "translation" TEXT,

    CONSTRAINT "Verse_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Verse" ADD CONSTRAINT "Verse_surahId_fkey" FOREIGN KEY ("surahId") REFERENCES "Surah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
