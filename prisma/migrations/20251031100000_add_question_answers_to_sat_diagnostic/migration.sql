-- AlterTable
ALTER TABLE "sat_diagnostic_results" 
ADD COLUMN "questionAnswers" JSONB,
ADD COLUMN "updatedAt" TIMESTAMP(3);