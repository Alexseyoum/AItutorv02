-- Complete database sync to match Prisma schema
-- This migration will restore all missing elements without affecting existing data

-- Create the QuestionStatus enum type if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'QuestionStatus') THEN
        CREATE TYPE "QuestionStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'RETIRED', 'ARCHIVED');
    END IF;
END $$;

-- Recreate the user_question_history table if it doesn't exist
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

-- Add missing columns to questions table
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

-- Add status column if it doesn't exist (even though migration 4 should have added it)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'status') THEN
        ALTER TABLE "questions" ADD COLUMN "status" "QuestionStatus" NOT NULL DEFAULT 'PENDING_REVIEW';
    END IF;
END $$;

-- Create indexes on questions table
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

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'questions' AND indexname = 'questions_status_idx') THEN
        CREATE INDEX "questions_status_idx" ON "questions"("status");
    END IF;
END $$;

-- Create indexes on user_question_history table
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

-- Rename indexes to match the schema (fix drift)
-- Note: In PostgreSQL, we need to drop and recreate indexes to rename them
-- chat_sessions indexes
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'chat_sessions' AND indexname = 'chat_sessions_created_at_idx') THEN
        DROP INDEX "chat_sessions_created_at_idx";
        CREATE INDEX "chat_sessions_createdAt_idx" ON "chat_sessions"("createdAt");
    END IF;
END $$;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'chat_sessions' AND indexname = 'chat_sessions_is_active_idx') THEN
        DROP INDEX "chat_sessions_is_active_idx";
        CREATE INDEX "chat_sessions_isActive_idx" ON "chat_sessions"("isActive");
    END IF;
END $$;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'chat_sessions' AND indexname = 'chat_sessions_user_id_idx') THEN
        DROP INDEX "chat_sessions_user_id_idx";
        CREATE INDEX "chat_sessions_userId_idx" ON "chat_sessions"("userId");
    END IF;
END $$;

-- student_activities indexes
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'student_activities' AND indexname = 'student_activities_created_at_idx') THEN
        DROP INDEX "student_activities_created_at_idx";
        CREATE INDEX "student_activities_createdAt_idx" ON "student_activities"("createdAt");
    END IF;
END $$;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'student_activities' AND indexname = 'student_activities_user_id_idx') THEN
        DROP INDEX "student_activities_user_id_idx";
        CREATE INDEX "student_activities_userId_idx" ON "student_activities"("userId");
    END IF;
END $$;

-- users indexes
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'users' AND indexname = 'users_created_at_idx') THEN
        DROP INDEX "users_created_at_idx";
        CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");
    END IF;
END $$;