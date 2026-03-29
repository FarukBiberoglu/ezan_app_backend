/*
  Warnings:

  - A unique constraint covering the columns `[globalNumber]` on the table `Verse` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `globalNumber` to the `Verse` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Verse" ADD COLUMN     "globalNumber" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Verse_globalNumber_key" ON "Verse"("globalNumber");
