/*
  Warnings:

  - A unique constraint covering the columns `[token]` on the table `TwoFA` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `token` to the `TwoFA` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "TwoFA" ADD COLUMN     "token" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "TwoFA_token_key" ON "TwoFA"("token");
