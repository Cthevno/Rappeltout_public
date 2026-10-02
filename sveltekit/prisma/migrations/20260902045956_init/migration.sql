-- CreateTable
CREATE TABLE "_HousePendingInvitation" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_HousePendingInvitation_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_HousePendingInvitation_B_index" ON "_HousePendingInvitation"("B");

-- AddForeignKey
ALTER TABLE "_HousePendingInvitation" ADD CONSTRAINT "_HousePendingInvitation_A_fkey" FOREIGN KEY ("A") REFERENCES "House"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_HousePendingInvitation" ADD CONSTRAINT "_HousePendingInvitation_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
