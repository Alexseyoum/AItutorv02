-- Fix schema drift by adding missing indexes
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