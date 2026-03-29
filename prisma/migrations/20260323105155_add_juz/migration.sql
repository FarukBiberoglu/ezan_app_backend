-- CreateTable
CREATE TABLE "Juz" (
    "id" INTEGER NOT NULL,

    CONSTRAINT "Juz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JuzVerse" (
    "id" SERIAL NOT NULL,
    "juzId" INTEGER NOT NULL,
    "surahId" INTEGER NOT NULL,
    "number" INTEGER NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "JuzVerse_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "JuzVerse" ADD CONSTRAINT "JuzVerse_juzId_fkey" FOREIGN KEY ("juzId") REFERENCES "Juz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
