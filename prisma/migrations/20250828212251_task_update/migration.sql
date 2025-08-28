-- AlterTable
ALTER TABLE "public"."tasks" ADD COLUMN     "lastGenerated" TIMESTAMP(3),
ADD COLUMN     "nextDueDate" TIMESTAMP(3);
