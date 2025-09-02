/*
  Warnings:

  - You are about to drop the column `assignmentIds` on the `recurring_task_schedules` table. All the data in the column will be lost.
  - You are about to drop the column `nextDueDate` on the `tasks` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."recurring_task_schedules" DROP COLUMN "assignmentIds";

-- AlterTable
ALTER TABLE "public"."tasks" DROP COLUMN "nextDueDate";
