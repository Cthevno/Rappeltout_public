-- CreateTable
CREATE TABLE "House" (
    "code" TEXT NOT NULL,
    "houseName" TEXT NOT NULL,
    "creatorId" INTEGER NOT NULL,

    CONSTRAINT "House_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "_HouseMembers" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_HouseMembers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_HouseMembers_B_index" ON "_HouseMembers"("B");

-- AddForeignKey
ALTER TABLE "House" ADD CONSTRAINT "House_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_HouseMembers" ADD CONSTRAINT "_HouseMembers_A_fkey" FOREIGN KEY ("A") REFERENCES "House"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_HouseMembers" ADD CONSTRAINT "_HouseMembers_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
