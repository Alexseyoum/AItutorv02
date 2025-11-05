-- First, resolve the schema drift by adding missing indexes
-- These indexes were added to the Prisma schema but not yet applied to the database

-- Add missing indexes to chat_sessions table
CREATE INDEX IF NOT EXISTS "chat_sessions_created_at_idx" ON "chat_sessions"("createdAt");
CREATE INDEX IF NOT EXISTS "chat_sessions_is_active_idx" ON "chat_sessions"("isActive");
CREATE INDEX IF NOT EXISTS "chat_sessions_user_id_idx" ON "chat_sessions"("userId");

-- Add missing indexes to student_activities table
CREATE INDEX IF NOT EXISTS "student_activities_created_at_idx" ON "student_activities"("createdAt");
CREATE INDEX IF NOT EXISTS "student_activities_type_idx" ON "student_activities"("type");
CREATE INDEX IF NOT EXISTS "student_activities_user_id_idx" ON "student_activities"("userId");

-- Add missing indexes to users table
CREATE INDEX IF NOT EXISTS "users_created_at_idx" ON "users"("createdAt");
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users"("email");

-- Now enhance questions table with analytics fields for question bank system
-- This migration adds fields to track question usage, performance, and metadata
-- while preserving all existing data

-- Add new columns to questions table for analytics and metadata
-- Using IF NOT EXISTS to prevent errors if columns already exist
ALTER TABLE "questions" 
ADD COLUMN IF NOT EXISTS "usageCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "avgCorrectRate" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "avgTimeToAnswer" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "tags" TEXT[],
ADD COLUMN IF NOT EXISTS "lastUsedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "reviewCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "parentVersionId" TEXT;

-- Create indexes for better query performance
-- Using IF NOT EXISTS to prevent errors if indexes already exist
CREATE INDEX IF NOT EXISTS "questions_subject_topic_difficulty_idx" ON "questions"("subject", "topic", "difficulty");
CREATE INDEX IF NOT EXISTS "questions_usage_count_idx" ON "questions"("usageCount");
CREATE INDEX IF NOT EXISTS "questions_avg_correct_rate_idx" ON "questions"("avgCorrectRate");
CREATE INDEX IF NOT EXISTS "questions_last_used_at_idx" ON "questions"("lastUsedAt");
CREATE INDEX IF NOT EXISTS "questions_is_active_idx" ON "questions"("isActive");

-- Create user_question_history table to track which questions have been used by which users
-- Using IF NOT EXISTS to prevent errors if table already exists
CREATE TABLE IF NOT EXISTS "user_question_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "wasCorrect" BOOLEAN,
    "timeSpent" INTEGER, -- Time spent in seconds
    "subject" TEXT,
    "topic" TEXT,
    "difficulty" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_question_history_pkey" PRIMARY KEY ("id")
);

-- Create indexes on user_question_history for efficient querying
CREATE INDEX IF NOT EXISTS "user_question_history_user_id_idx" ON "user_question_history"("userId");
CREATE INDEX IF NOT EXISTS "user_question_history_question_id_idx" ON "user_question_history"("questionId");
CREATE INDEX IF NOT EXISTS "user_question_history_used_at_idx" ON "user_question_history"("usedAt");
CREATE INDEX IF NOT EXISTS "user_question_history_subject_topic_idx" ON "user_question_history"("subject", "topic");
CREATE INDEX IF NOT EXISTS "user_question_history_user_question_idx" ON "user_question_history"("userId", "questionId");

-- Add foreign key constraints conditionally
-- Check if constraint exists before adding to avoid errors
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