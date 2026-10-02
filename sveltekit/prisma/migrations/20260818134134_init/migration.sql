/*
  Warnings:

  - You are about to drop the column `isPrivate` on the `SharedTask` table. All the data in the column will be lost.
  - You are about to drop the column `recurrence` on the `SharedTask` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SharedTask" DROP COLUMN "isPrivate",
DROP COLUMN "recurrence";

-- DropEnum
DROP TYPE "Recurrence";
