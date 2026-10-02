/*
  Warnings:

  - You are about to drop the column `category` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `difficulty` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `recurrence` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `xp` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the `CombatLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Monster` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MonsterTemplate` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('HEADMASTER', 'TEACHER', 'STUDENT');

-- DropForeignKey
ALTER TABLE "CombatLog" DROP CONSTRAINT "CombatLog_monsterId_fkey";

-- DropForeignKey
ALTER TABLE "CombatLog" DROP CONSTRAINT "CombatLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "Monster" DROP CONSTRAINT "Monster_templateId_fkey";

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "category",
DROP COLUMN "difficulty",
DROP COLUMN "recurrence",
DROP COLUMN "xp";

-- DropTable
DROP TABLE "CombatLog";

-- DropTable
DROP TABLE "Monster";

-- DropTable
DROP TABLE "MonsterTemplate";
