/*
  Warnings:

  - You are about to drop the column `assignedToIds` on the `task_assignment_groups` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."task_assignment_groups" DROP COLUMN "assignedToIds";

-- CreateTable
CREATE TABLE "public"."_AssignedUsers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AssignedUsers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_AssignedUsers_B_index" ON "public"."_AssignedUsers"("B");

-- AddForeignKey
ALTER TABLE "public"."_AssignedUsers" ADD CONSTRAINT "_AssignedUsers_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."task_assignment_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AssignedUsers" ADD CONSTRAINT "_AssignedUsers_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
