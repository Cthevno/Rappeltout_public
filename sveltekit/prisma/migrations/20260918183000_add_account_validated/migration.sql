-- AlterTable
ALTER TABLE "User" ADD COLUMN "accountValidated" BOOLEAN NOT NULL DEFAULT false;

UPDATE "User" SET "accountValidated" = true;