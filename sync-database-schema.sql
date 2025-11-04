-- File: sync-database-schema.sql
-- Sync database schema with Prisma schema - Safe approach to preserve data
-- This script adds all missing elements without affecting existing data

-- 1. Create the QuestionStatus enum type if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'QuestionStatus') THEN
        CREATE TYPE "QuestionStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'RETIRED', 'ARCHIVED');
        RAISE NOTICE 'Created QuestionStatus enum';
    ELSE
        RAISE NOTICE 'QuestionStatus enum already exists';
    END IF;
END $$;

-- 2. Add missing columns to questions table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'usageCount') THEN
        ALTER TABLE "questions" ADD COLUMN "usageCount" INTEGER NOT NULL DEFAULT 0;
        RAISE NOTICE 'Added usageCount column to questions table';
    ELSE
        RAISE NOTICE 'usageCount column already exists';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'avgCorrectRate') THEN
        ALTER TABLE "questions" ADD COLUMN "avgCorrectRate" DOUBLE PRECISION;
        RAISE NOTICE 'Added avgCorrectRate column to questions table';
    ELSE
        RAISE NOTICE 'avgCorrectRate column already exists';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'avgTimeToAnswer') THEN
        ALTER TABLE "questions" ADD COLUMN "avgTimeToAnswer" DOUBLE PRECISION;
        RAISE NOTICE 'Added avgTimeToAnswer column to questions table';
    ELSE
        RAISE NOTICE 'avgTimeToAnswer column already exists';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'tags') THEN
        ALTER TABLE "questions" ADD COLUMN "tags" TEXT[];
        RAISE NOTICE 'Added tags column to questions table';
    ELSE
        RAISE NOTICE 'tags column already exists';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'lastUsedAt') THEN
        ALTER TABLE "questions" ADD COLUMN "lastUsedAt" TIMESTAMP(3);
        RAISE NOTICE 'Added lastUsedAt column to questions table';
    ELSE
        RAISE NOTICE 'lastUsedAt column already exists';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'reviewCount') THEN
        ALTER TABLE "questions" ADD COLUMN "reviewCount" INTEGER NOT NULL DEFAULT 0;
        RAISE NOTICE 'Added reviewCount column to questions table';
    ELSE
        RAISE NOTICE 'reviewCount column already exists';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'version') THEN
        ALTER TABLE "questions" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
        RAISE NOTICE 'Added version column to questions table';
    ELSE
        RAISE NOTICE 'version column already exists';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'isActive') THEN
        ALTER TABLE "questions" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
        RAISE NOTICE 'Added isActive column to questions table';
    ELSE
        RAISE NOTICE 'isActive column already exists';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'parentVersionId') THEN
        ALTER TABLE "questions" ADD COLUMN "parentVersionId" TEXT;
        RAISE NOTICE 'Added parentVersionId column to questions table';
    ELSE
        RAISE NOTICE 'parentVersionId column already exists';
    END IF;
END $$;

-- Add status column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'status') THEN
        ALTER TABLE "questions" ADD COLUMN "status" "QuestionStatus" NOT NULL DEFAULT 'PENDING_REVIEW';
        RAISE NOTICE 'Added status column to questions table';
    ELSE
        RAISE NOTICE 'status column already exists';
    END IF;
END $$;

-- 3. Create user_question_history table if it doesn't exist
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
        RAISE NOTICE 'Created user_question_history table';
    ELSE
        RAISE NOTICE 'user_question_history table already exists';
    END IF;
END $$;

-- 4. Create indexes on questions table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'questions' AND indexname = 'questions_subject_topic_difficulty_idx') THEN
        CREATE INDEX "questions_subject_topic_difficulty_idx" ON "questions"("subject", "topic", "difficulty");
        RAISE NOTICE 'Created questions_subject_topic_difficulty_idx';
    ELSE
        RAISE NOTICE 'questions_subject_topic_difficulty_idx already exists';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'questions' AND indexname = 'questions_usage_count_idx') THEN
        CREATE INDEX "questions_usage_count_idx" ON "questions"("usageCount");
        RAISE NOTICE 'Created questions_usage_count_idx';
    ELSE
        RAISE NOTICE 'questions_usage_count_idx already exists';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'questions' AND indexname = 'questions_avg_correct_rate_idx') THEN
        CREATE INDEX "questions_avg_correct_rate_idx" ON "questions"("avgCorrectRate");
        RAISE NOTICE 'Created questions_avg_correct_rate_idx';
    ELSE
        RAISE NOTICE 'questions_avg_correct_rate_idx already exists';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'questions' AND indexname = 'questions_last_used_at_idx') THEN
        CREATE INDEX "questions_last_used_at_idx" ON "questions"("lastUsedAt");
        RAISE NOTICE 'Created questions_last_used_at_idx';
    ELSE
        RAISE NOTICE 'questions_last_used_at_idx already exists';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'questions' AND indexname = 'questions_is_active_idx') THEN
        CREATE INDEX "questions_is_active_idx" ON "questions"("isActive");
        RAISE NOTICE 'Created questions_is_active_idx';
    ELSE
        RAISE NOTICE 'questions_is_active_idx already exists';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'questions' AND indexname = 'questions_status_idx') THEN
        CREATE INDEX "questions_status_idx" ON "questions"("status");
        RAISE NOTICE 'Created questions_status_idx';
    ELSE
        RAISE NOTICE 'questions_status_idx already exists';
    END IF;
END $$;

-- 5. Create indexes on user_question_history table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'user_question_history' AND indexname = 'user_question_history_user_id_idx') THEN
        CREATE INDEX "user_question_history_user_id_idx" ON "user_question_history"("userId");
        RAISE NOTICE 'Created user_question_history_user_id_idx';
    ELSE
        RAISE NOTICE 'user_question_history_user_id_idx already exists';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'user_question_history' AND indexname = 'user_question_history_question_id_idx') THEN
        CREATE INDEX "user_question_history_question_id_idx" ON "user_question_history"("questionId");
        RAISE NOTICE 'Created user_question_history_question_id_idx';
    ELSE
        RAISE NOTICE 'user_question_history_question_id_idx already exists';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'user_question_history' AND indexname = 'user_question_history_used_at_idx') THEN
        CREATE INDEX "user_question_history_used_at_idx" ON "user_question_history"("usedAt");
        RAISE NOTICE 'Created user_question_history_used_at_idx';
    ELSE
        RAISE NOTICE 'user_question_history_used_at_idx already exists';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'user_question_history' AND indexname = 'user_question_history_subject_topic_idx') THEN
        CREATE INDEX "user_question_history_subject_topic_idx" ON "user_question_history"("subject", "topic");
        RAISE NOTICE 'Created user_question_history_subject_topic_idx';
    ELSE
        RAISE NOTICE 'user_question_history_subject_topic_idx already exists';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'user_question_history' AND indexname = 'user_question_history_user_question_idx') THEN
        CREATE INDEX "user_question_history_user_question_idx" ON "user_question_history"("userId", "questionId");
        RAISE NOTICE 'Created user_question_history_user_question_idx';
    ELSE
        RAISE NOTICE 'user_question_history_user_question_idx already exists';
    END IF;
END $$;

-- 6. Add foreign key constraints
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_question_history_userId_fkey') THEN
        ALTER TABLE "user_question_history" ADD CONSTRAINT "user_question_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        RAISE NOTICE 'Added user_question_history_userId_fkey constraint';
    ELSE
        RAISE NOTICE 'user_question_history_userId_fkey constraint already exists';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_question_history_questionId_fkey') THEN
        ALTER TABLE "user_question_history" ADD CONSTRAINT "user_question_history_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        RAISE NOTICE 'Added user_question_history_questionId_fkey constraint';
    ELSE
        RAISE NOTICE 'user_question_history_questionId_fkey constraint already exists';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'questions_parent_version_id_fkey') THEN
        ALTER TABLE "questions" ADD CONSTRAINT "questions_parent_version_id_fkey" FOREIGN KEY ("parentVersionId") REFERENCES "questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        RAISE NOTICE 'Added questions_parent_version_id_fkey constraint';
    ELSE
        RAISE NOTICE 'questions_parent_version_id_fkey constraint already exists';
    END IF;
END $$;

RAISE NOTICE 'Database schema sync completed successfully!';