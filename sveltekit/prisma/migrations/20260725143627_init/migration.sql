/*
  Warnings:

  - You are about to drop the column `category` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `difficulty` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `recurrence` on the `Task` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Task" DROP COLUMN "category",
DROP COLUMN "difficulty",
DROP COLUMN "recurrence";
