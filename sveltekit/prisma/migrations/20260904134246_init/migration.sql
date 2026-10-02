-- DropIndex
DROP INDEX "CombatLog_sharedTaskId_key";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "monstersSlayed" INTEGER NOT NULL DEFAULT 0;
