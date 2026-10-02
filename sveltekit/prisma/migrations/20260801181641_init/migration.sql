-- CreateTable
CREATE TABLE "_HousePending" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_HousePending_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_HousePending_B_index" ON "_HousePending"("B");

-- AddForeignKey
ALTER TABLE "_HousePending" ADD CONSTRAINT "_HousePending_A_fkey" FOREIGN KEY ("A") REFERENCES "House"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_HousePending" ADD CONSTRAINT "_HousePending_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
