/*
  Warnings:

  - A unique constraint covering the columns `[surahId,number]` on the table `Verse` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "UserSettings" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "JuzVerse_juzId_idx" ON "JuzVerse"("juzId");

-- CreateIndex
CREATE INDEX "PlanDay_planId_idx" ON "PlanDay"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "Verse_surahId_number_key" ON "Verse"("surahId", "number");

-- AddForeignKey
ALTER TABLE "JuzVerse" ADD CONSTRAINT "JuzVerse_surahId_fkey" FOREIGN KEY ("surahId") REFERENCES "Surah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
