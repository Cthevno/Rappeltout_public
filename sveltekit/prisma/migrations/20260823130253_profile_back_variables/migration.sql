/*
  Warnings:

  - You are about to drop the column `SharedTasksCompleted` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "SharedTasksCompleted",
ADD COLUMN     "sharedTasksCompleted" INTEGER NOT NULL DEFAULT 0;
