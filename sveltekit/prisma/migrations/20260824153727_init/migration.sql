/*
  Warnings:

  - You are about to drop the `_HousePendingInvitation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_HousePendingInvitation" DROP CONSTRAINT "_HousePendingInvitation_A_fkey";

-- DropForeignKey
ALTER TABLE "_HousePendingInvitation" DROP CONSTRAINT "_HousePendingInvitation_B_fkey";

-- DropTable
DROP TABLE "_HousePendingInvitation";

-- CreateTable
CREATE TABLE "Invitation" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "houseCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_email_houseCode_key" ON "Invitation"("email", "houseCode");

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_houseCode_fkey" FOREIGN KEY ("houseCode") REFERENCES "House"("code") ON DELETE CASCADE ON UPDATE CASCADE;
