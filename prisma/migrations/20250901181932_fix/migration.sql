/*
  Warnings:

  - You are about to drop the column `assignmentId` on the `recurring_task_schedules` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."recurring_task_schedules_assignmentId_key";

-- DropIndex
DROP INDEX "public"."task_assignments_scheduleId_key";

-- AlterTable
ALTER TABLE "public"."recurring_task_schedules" DROP COLUMN "assignmentId",
ADD COLUMN     "assignmentIds" TEXT[];
