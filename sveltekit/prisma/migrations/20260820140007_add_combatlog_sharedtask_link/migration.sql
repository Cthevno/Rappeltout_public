/*
  Warnings:

  - A unique constraint covering the columns `[sharedTaskId]` on the table `CombatLog` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "CombatLog" ADD COLUMN     "sharedTaskId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "CombatLog_sharedTaskId_key" ON "CombatLog"("sharedTaskId");

-- AddForeignKey
ALTER TABLE "CombatLog" ADD CONSTRAINT "CombatLog_sharedTaskId_fkey" FOREIGN KEY ("sharedTaskId") REFERENCES "SharedTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;
