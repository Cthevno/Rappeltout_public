-- CreateTable
CREATE TABLE "SharedTask" (
    "id" SERIAL NOT NULL,
    "houseCode" TEXT NOT NULL,
    "nameTask" TEXT NOT NULL,
    "isFinish" BOOLEAN NOT NULL,
    "isPrivate" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "difficulty" "Difficulty" NOT NULL,
    "recurrence" "Recurrence" NOT NULL,
    "category" "Category" NOT NULL,

    CONSTRAINT "SharedTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_SharedTaskAssignees" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_SharedTaskAssignees_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_SharedTaskAssignees_B_index" ON "_SharedTaskAssignees"("B");

-- AddForeignKey
ALTER TABLE "SharedTask" ADD CONSTRAINT "SharedTask_houseCode_fkey" FOREIGN KEY ("houseCode") REFERENCES "House"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SharedTaskAssignees" ADD CONSTRAINT "_SharedTaskAssignees_A_fkey" FOREIGN KEY ("A") REFERENCES "SharedTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SharedTaskAssignees" ADD CONSTRAINT "_SharedTaskAssignees_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
