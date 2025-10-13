/*
  Warnings:

  - Made the column `completedTasks` on table `sat_study_plans` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "sat_study_plans" ALTER COLUMN "completedTasks" SET NOT NULL;
