-- Implement question bank schema changes
-- This migration will apply the changes to the database while checking for existing objects

-- Add new columns to questions table for analytics and metadata
-- Check if columns exist before adding them
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'usageCount') THEN
        ALTER TABLE "questions" ADD COLUMN "usageCount" INTEGER NOT NULL DEFAULT 0;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'avgCorrectRate') THEN
        ALTER TABLE "questions" ADD COLUMN "avgCorrectRate" DOUBLE PRECISION;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'avgTimeToAnswer') THEN
        ALTER TABLE "questions" ADD COLUMN "avgTimeToAnswer" DOUBLE PRECISION;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'tags') THEN
        ALTER TABLE "questions" ADD COLUMN "tags" TEXT[];
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'lastUsedAt') THEN
        ALTER TABLE "questions" ADD COLUMN "lastUsedAt" TIMESTAMP(3);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'reviewCount') THEN
        ALTER TABLE "questions" ADD COLUMN "reviewCount" INTEGER NOT NULL DEFAULT 0;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'version') THEN
        ALTER TABLE "questions" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'isActive') THEN
        ALTER TABLE "questions" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'parentVersionId') THEN
        ALTER TABLE "questions" ADD COLUMN "parentVersionId" TEXT;
    END IF;
END $$;

-- Create indexes for better query performance
-- Check if indexes exist before creating them
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'questions' AND indexname = 'questions_subject_topic_difficulty_idx') THEN
        CREATE INDEX "questions_subject_topic_difficulty_idx" ON "questions"("subject", "topic", "difficulty");
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'questions' AND indexname = 'questions_usage_count_idx') THEN
        CREATE INDEX "questions_usage_count_idx" ON "questions"("usageCount");
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'questions' AND indexname = 'questions_avg_correct_rate_idx') THEN
        CREATE INDEX "questions_avg_correct_rate_idx" ON "questions"("avgCorrectRate");
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'questions' AND indexname = 'questions_last_used_at_idx') THEN
        CREATE INDEX "questions_last_used_at_idx" ON "questions"("lastUsedAt");
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'questions' AND indexname = 'questions_is_active_idx') THEN
        CREATE INDEX "questions_is_active_idx" ON "questions"("isActive");
    END IF;
END $$;

-- Create user_question_history table to track which questions have been used by which users
-- Check if table exists before creating it
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_question_history') THEN
        CREATE TABLE "user_question_history" (
            "id" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "questionId" TEXT NOT NULL,
            "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "wasCorrect" BOOLEAN,
            "timeSpent" INTEGER,
            "subject" TEXT,
            "topic" TEXT,
            "difficulty" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

            CONSTRAINT "user_question_history_pkey" PRIMARY KEY ("id")
        );
    END IF;
END $$;

-- Create indexes on user_question_history for efficient querying
-- Check if indexes exist before creating them
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'user_question_history' AND indexname = 'user_question_history_user_id_idx') THEN
        CREATE INDEX "user_question_history_user_id_idx" ON "user_question_history"("userId");
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'user_question_history' AND indexname = 'user_question_history_question_id_idx') THEN
        CREATE INDEX "user_question_history_question_id_idx" ON "user_question_history"("questionId");
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'user_question_history' AND indexname = 'user_question_history_used_at_idx') THEN
        CREATE INDEX "user_question_history_used_at_idx" ON "user_question_history"("usedAt");
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'user_question_history' AND indexname = 'user_question_history_subject_topic_idx') THEN
        CREATE INDEX "user_question_history_subject_topic_idx" ON "user_question_history"("subject", "topic");
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'user_question_history' AND indexname = 'user_question_history_user_question_idx') THEN
        CREATE INDEX "user_question_history_user_question_idx" ON "user_question_history"("userId", "questionId");
    END IF;
END $$;

-- Add foreign key constraints
-- Check if constraints exist before adding them
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_question_history_userId_fkey') THEN
        ALTER TABLE "user_question_history" ADD CONSTRAINT "user_question_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_question_history_questionId_fkey') THEN
        ALTER TABLE "user_question_history" ADD CONSTRAINT "user_question_history_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'questions_parent_version_id_fkey') THEN
        ALTER TABLE "questions" ADD CONSTRAINT "questions_parent_version_id_fkey" FOREIGN KEY ("parentVersionId") REFERENCES "questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;