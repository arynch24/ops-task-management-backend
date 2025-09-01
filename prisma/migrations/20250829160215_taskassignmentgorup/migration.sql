-- CreateTable
CREATE TABLE "public"."task_assignment_groups" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "assignedToIds" TEXT[],
    "assignedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_assignment_groups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "task_assignment_groups_taskId_key" ON "public"."task_assignment_groups"("taskId");

-- AddForeignKey
ALTER TABLE "public"."task_assignment_groups" ADD CONSTRAINT "task_assignment_groups_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
