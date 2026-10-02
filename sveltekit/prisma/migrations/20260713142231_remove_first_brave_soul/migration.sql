-- AlterEnum
BEGIN;
CREATE TYPE "Recurrence_new" AS ENUM ('ONCE', 'ONCE_A_DAY', 'ONCE_A_WEEK', 'ONCE_A_MONTH', 'ONCE_A_YEAR');
ALTER TABLE "Task" ALTER COLUMN "recurrence" TYPE "Recurrence_new" USING ("recurrence"::text::"Recurrence_new");
ALTER TYPE "Recurrence" RENAME TO "Recurrence_old";
ALTER TYPE "Recurrence_new" RENAME TO "Recurrence";
DROP TYPE "public"."Recurrence_old";
COMMIT;
