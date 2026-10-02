-- DropEnum
DROP TYPE "Role";

-- CreateTable
CREATE TABLE "CombatLog" (
    "id" SERIAL NOT NULL,
    "monsterId" INTEGER NOT NULL,
    "userId" INTEGER,
    "authorName" TEXT,
    "houseId" TEXT NOT NULL,
    "dmg" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CombatLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Monster" (
    "id" SERIAL NOT NULL,
    "templateId" INTEGER NOT NULL,
    "houseId" TEXT NOT NULL,
    "difficulty" "MonsterDifficulty" NOT NULL,
    "maxHp" INTEGER NOT NULL DEFAULT 100,
    "currentHp" INTEGER NOT NULL DEFAULT 100,
    "loot" TEXT,
    "status" "MonsterStatus" NOT NULL DEFAULT 'ACTIVE',
    "killed" BOOLEAN NOT NULL,
    "escapeDate" TIMESTAMP(3),
    "finishedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Monster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonsterTemplate" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "imageSrc" TEXT NOT NULL,
    "lore" TEXT NOT NULL,

    CONSTRAINT "MonsterTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MonsterTemplate_name_key" ON "MonsterTemplate"("name");

-- AddForeignKey
ALTER TABLE "CombatLog" ADD CONSTRAINT "CombatLog_monsterId_fkey" FOREIGN KEY ("monsterId") REFERENCES "Monster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CombatLog" ADD CONSTRAINT "CombatLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CombatLog" ADD CONSTRAINT "CombatLog_houseId_fkey" FOREIGN KEY ("houseId") REFERENCES "House"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Monster" ADD CONSTRAINT "Monster_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "MonsterTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Monster" ADD CONSTRAINT "Monster_houseId_fkey" FOREIGN KEY ("houseId") REFERENCES "House"("code") ON DELETE CASCADE ON UPDATE CASCADE;
