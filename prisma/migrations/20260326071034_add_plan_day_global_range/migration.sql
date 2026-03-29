-- AlterTable
ALTER TABLE "PlanDay" ADD COLUMN     "endGlobalNumber" INTEGER,
ADD COLUMN     "startGlobalNumber" INTEGER,
ALTER COLUMN "startJuz" DROP NOT NULL,
ALTER COLUMN "endJuz" DROP NOT NULL;
