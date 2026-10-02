-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('SUPER_EASY', 'EASY', 'MEDIUM', 'DIFFICULT');

-- CreateEnum
CREATE TYPE "Recurrence" AS ENUM ('ONCE', 'ONCE_A_DAY', 'ONCE_A_WEEK', 'ONCE_A_MONTH', 'ONCE_A_YEAR', 'FIRST_BRAVE_SOUL');

-- CreateTable
CREATE TABLE "Task" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "nameTask" TEXT NOT NULL,
    "isFinish" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "difficulty" "Difficulty" NOT NULL,
    "recurrence" "Recurrence" NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
