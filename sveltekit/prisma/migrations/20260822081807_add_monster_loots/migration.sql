-- CreateEnum
CREATE TYPE "LootType" AS ENUM ('COLLECTIVE', 'INDIVIDUAL');

-- AlterTable
ALTER TABLE "Monster" ADD COLUMN     "collectiveLoot" TEXT,
ADD COLUMN     "lootType" "LootType" NOT NULL DEFAULT 'COLLECTIVE';

-- CreateTable
CREATE TABLE "MonsterLoot" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "monsterId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "MonsterLoot_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MonsterLoot" ADD CONSTRAINT "MonsterLoot_monsterId_fkey" FOREIGN KEY ("monsterId") REFERENCES "Monster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonsterLoot" ADD CONSTRAINT "MonsterLoot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
