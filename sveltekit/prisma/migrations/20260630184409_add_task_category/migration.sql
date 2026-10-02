/*
  Warnings:

  - Added the required column `category` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Category" AS ENUM ('STUDIES', 'SPORT', 'ADMINISTRATIVE', 'HEALTH', 'PERSONAL');

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "category" "Category" NOT NULL;
