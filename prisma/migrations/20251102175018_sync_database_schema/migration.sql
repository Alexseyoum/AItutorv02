/*
  Warnings:

  - The `status` column on the `questions` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- DropIndex
DROP INDEX "public"."questions_status_idx";

-- AlterTable
ALTER TABLE "questions" DROP COLUMN "status",
ADD COLUMN     "status" "QuestionStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
ALTER COLUMN "tags" SET DEFAULT ARRAY[]::TEXT[];

-- RenameForeignKey
ALTER TABLE "questions" RENAME CONSTRAINT "questions_parent_version_id_fkey" TO "questions_parentVersionId_fkey";

-- RenameIndex
ALTER INDEX "questions_avg_correct_rate_idx" RENAME TO "questions_avgCorrectRate_idx";

-- RenameIndex
ALTER INDEX "questions_is_active_idx" RENAME TO "questions_isActive_idx";

-- RenameIndex
ALTER INDEX "questions_last_used_at_idx" RENAME TO "questions_lastUsedAt_idx";

-- RenameIndex
ALTER INDEX "questions_usage_count_idx" RENAME TO "questions_usageCount_idx";

-- RenameIndex
ALTER INDEX "user_question_history_question_id_idx" RENAME TO "user_question_history_questionId_idx";

-- RenameIndex
ALTER INDEX "user_question_history_used_at_idx" RENAME TO "user_question_history_usedAt_idx";

-- RenameIndex
ALTER INDEX "user_question_history_user_id_idx" RENAME TO "user_question_history_userId_idx";

-- RenameIndex
ALTER INDEX "user_question_history_user_question_idx" RENAME TO "user_question_history_userId_questionId_idx";
