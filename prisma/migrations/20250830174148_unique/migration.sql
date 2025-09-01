/*
  Warnings:

  - A unique constraint covering the columns `[taskId,assignedTo,scheduleId]` on the table `task_assignments` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "task_assignments_taskId_assignedTo_scheduleId_key" ON "public"."task_assignments"("taskId", "assignedTo", "scheduleId");
