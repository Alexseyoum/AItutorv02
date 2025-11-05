-- File: prisma/migrations/20251102100004_add_question_status_enum/migration.sql
-- Add QuestionStatus enum and update questions table

-- Create the QuestionStatus enum type
CREATE TYPE "QuestionStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'RETIRED', 'ARCHIVED');

-- Add the status column to questions table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'status') THEN
        ALTER TABLE "questions" ADD COLUMN "status" "QuestionStatus" NOT NULL DEFAULT 'PENDING_REVIEW';
    END IF;
END $$;

-- Update existing rows to have proper status values
-- This is a safety measure to ensure existing data conforms to the new enum
UPDATE "questions" 
SET "status" = CASE 
    WHEN "status" = 'pending_review' THEN 'PENDING_REVIEW'::"QuestionStatus"
    WHEN "status" = 'approved' THEN 'APPROVED'::"QuestionStatus"
    WHEN "status" = 'rejected' THEN 'REJECTED'::"QuestionStatus"
    ELSE 'PENDING_REVIEW'::"QuestionStatus"
END
WHERE "status" IN ('pending_review', 'approved', 'rejected');

-- Create index on status for better query performance
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'questions' AND indexname = 'questions_status_idx') THEN
        CREATE INDEX "questions_status_idx" ON "questions"("status");
    END IF;
END $$;