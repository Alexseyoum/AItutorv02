// File: src/lib/question-lifecycle.ts
import { prisma } from "@/lib/prisma";
import { QuestionStatus } from "@/lib/question-bank";

export class QuestionLifecycleManager {
  /**
   * Move questions to retired status based on performance metrics
   */
  static async retireUnderperformingQuestions() {
    try {
      // Retire questions with low correct rate (<30%)
      const lowPerformanceQuestions = await prisma.question.updateMany({
        where: {
          AND: [
            { avgCorrectRate: { lt: 0.3 } },
            { status: QuestionStatus.APPROVED }
          ]
        },
        data: {
          status: QuestionStatus.RETIRED,
          updatedAt: new Date()
        }
      });

      // Retire questions with very high usage count (>1000)
      const highUsageQuestions = await prisma.question.updateMany({
        where: {
          AND: [
            { usageCount: { gt: 1000 } },
            { status: QuestionStatus.APPROVED }
          ]
        },
        data: {
          status: QuestionStatus.RETIRED,
          updatedAt: new Date()
        }
      });

      console.log(`Retired ${lowPerformanceQuestions.count} low-performance questions`);
      console.log(`Retired ${highUsageQuestions.count} high-usage questions`);

      return {
        lowPerformance: lowPerformanceQuestions.count,
        highUsage: highUsageQuestions.count
      };
    } catch (error) {
      console.error("Error retiring questions:", error);
      throw error;
    }
  }

  /**
   * Archive questions that have been retired for over a year
   */
  static async archiveOldQuestions() {
    try {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const archivedQuestions = await prisma.question.updateMany({
        where: {
          AND: [
            { status: QuestionStatus.RETIRED },
            { updatedAt: { lt: oneYearAgo } }
          ]
        },
        data: {
          status: QuestionStatus.ARCHIVED,
          updatedAt: new Date()
        }
      });

      console.log(`Archived ${archivedQuestions.count} old questions`);

      return archivedQuestions.count;
    } catch (error) {
      console.error("Error archiving questions:", error);
      throw error;
    }
  }

  /**
   * Get questions by lifecycle stage
   */
  static async getQuestionsByStage(status: QuestionStatus, limit: number = 50) {
    try {
      const questions = await prisma.question.findMany({
        where: {
          status: status
        },
        take: limit,
        orderBy: {
          createdAt: 'desc'
        }
      });

      return questions;
    } catch (error) {
      console.error(`Error fetching ${status} questions:`, error);
      throw error;
    }
  }
}