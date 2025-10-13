-- AlterTable to add progress tracking to sat_study_plans
ALTER TABLE "sat_study_plans" 
ADD COLUMN "completedWeeks" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN "completedTasks" JSONB DEFAULT '{}';