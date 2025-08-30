-- DropForeignKey
ALTER TABLE "public"."recurring_task_schedules" DROP CONSTRAINT "recurring_task_schedules_assignmentId_fkey";

-- AddForeignKey
ALTER TABLE "public"."task_assignments" ADD CONSTRAINT "task_assignments_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "public"."recurring_task_schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
