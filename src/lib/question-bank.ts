// File: src/lib/question-bank.ts
import { prisma } from "@/lib/prisma";
import { executeWithRetry, ensureConnected } from "@/lib/prisma";
import { QuestionStatus } from "@/generated/prisma";
import { initializeRedis } from "@/lib/redis-client";

export { QuestionStatus };

export class QuestionBankService {
  private static readonly CACHE_KEY = "question_bank";
  private static readonly CACHE_TTL = 3600; // 1 hour

  // Get questions by subject, topic, and difficulty
  static async getQuestionsByCriteria(
    subject: string,
    topic: string,
    difficulty: string,
    limit: number = 10
  ) {
    try {
      console.log("QuestionBankService.getQuestionsByCriteria called with:", { subject, topic, difficulty, limit });
      
      // Ensure database is connected
      await ensureConnected();
      
      // Try to get from cache first (if Redis is available)
      const redis = await initializeRedis();
      if (redis) {
        const cacheKey = `${this.CACHE_KEY}:${subject}:${topic}:${difficulty}`;
        const cached = await redis.get(cacheKey);
        
        if (cached) {
          console.log("Returning cached questions");
          return JSON.parse(cached);
        }
      }
      
      // Get from database
      const questions = await executeWithRetry(() => prisma.question.findMany({
        where: {
          subject,
          ...(topic ? { topic } : {}), // Only filter by topic if provided
          ...(difficulty ? { difficulty } : {}), // Only filter by difficulty if provided
          status: "APPROVED",
          isActive: true
        },
        take: limit,
        orderBy: [
          { usageCount: 'asc' }, // Prefer less used questions
          { lastUsedAt: 'asc' }  // Prefer older questions
        ]
      }));
      
      console.log("Got questions from database:", questions.length);
      
      // If no questions found with exact criteria, try with any difficulty
      if (questions.length === 0 && difficulty) {
        console.warn(`No questions found for ${subject} - ${topic} - ${difficulty}. Trying any difficulty.`);
        const fallbackQuestions = await executeWithRetry(() => prisma.question.findMany({
          where: {
            subject,
            ...(topic ? { topic } : {}),
            status: "APPROVED",
            isActive: true
          },
          take: limit,
          orderBy: [
            { usageCount: 'asc' }, // Prefer less used questions
            { lastUsedAt: 'asc' }  // Prefer older questions
          ]
        }));
        // Don't push, just replace
        // questions.push(...fallbackQuestions);
        console.log("Got fallback questions:", fallbackQuestions.length);
        return fallbackQuestions; // Return fallback questions directly
      }
      
      // Cache the results (if Redis is available)
      if (redis && questions.length > 0) {
        const cacheKey = `${this.CACHE_KEY}:${subject}:${topic}:${difficulty}`;
        await redis.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(questions));
        console.log("Cached questions");
      }
      
      return questions;
    } catch (error: any) {
      console.error("Error fetching questions:", error);
      // Check if it's a database connectivity error
      if (error.message?.includes("Can't reach database server") || 
          error.message?.includes("P1001") ||
          error.message?.includes("Engine is not yet connected")) {
        console.warn("Database connectivity issue detected in QuestionBankService");
        // Return empty array to let caller handle fallback
        return [];
      }
      throw error;
    }
  }

  // Get a single question by ID
  static async getQuestionById(id: string) {
    try {
      console.log("QuestionBankService.getQuestionById called with:", id);
      
      // Ensure database is connected
      await ensureConnected();
      
      const question = await executeWithRetry(() => prisma.question.findUnique({
        where: { id }
      }));
      
      console.log("Got question by ID:", !!question);
      
      return question;
    } catch (error) {
      console.error("Error fetching question:", error);
      throw error;
    }
  }

  // Record question usage
  static async recordQuestionUsage(
    questionId: string,
    userId: string,
    wasCorrect: boolean,
    timeSpent: number,
    subject: string,
    topic: string,
    difficulty: string
  ) {
    try {
      console.log("QuestionBankService.recordQuestionUsage called with:", { questionId, userId, wasCorrect, timeSpent, subject, topic, difficulty });
      
      // Check if this is a mock question (mock questions have IDs starting with "mock-")
      if (questionId.startsWith("mock-")) {
        console.log("Skipping recording usage for mock question:", questionId);
        // Ensure database is connected
        await ensureConnected();
        // For mock questions, we just record in user history without updating question analytics
        await executeWithRetry(() => prisma.userQuestionHistory.create({
          data: {
            userId,
            questionId,
            wasCorrect,
            timeSpent,
            subject,
            topic,
            difficulty
          }
        }));
        return null; // Return null for mock questions
      }
      
      // Ensure database is connected
      await ensureConnected();
      
      // First get the current question to calculate new average
      const currentQuestion = await executeWithRetry(() => prisma.question.findUnique({
        where: { id: questionId }
      }));
      
      if (!currentQuestion) {
        throw new Error(`Question with ID ${questionId} not found`);
      }
      
      // Calculate new average correctness rate
      const currentUsageCount = currentQuestion.usageCount;
      const currentAvgCorrectRate = currentQuestion.avgCorrectRate || 0;
      
      // New average = (old_average * old_count + new_value) / new_count
      const newUsageCount = currentUsageCount + 1;
      const newAvgCorrectRate = ((currentAvgCorrectRate * currentUsageCount) + (wasCorrect ? 1 : 0)) / newUsageCount;
      
      // Calculate new average time
      const currentAvgTime = currentQuestion.avgTimeToAnswer || 0;
      const newAvgTime = ((currentAvgTime * currentUsageCount) + timeSpent) / newUsageCount;
      
      // Update question analytics
      const question = await executeWithRetry(() => prisma.question.update({
        where: { id: questionId },
        data: {
          usageCount: {
            increment: 1
          },
          lastUsedAt: new Date(),
          avgCorrectRate: newAvgCorrectRate,
          avgTimeToAnswer: newAvgTime
        }
      }));
      
      // Record in user history
      await executeWithRetry(() => prisma.userQuestionHistory.create({
        data: {
          userId,
          questionId,
          wasCorrect,
          timeSpent,
          subject,
          topic,
          difficulty
        }
      }));
      
      // Invalidate cache for this question's category (if Redis is available)
      const redis = await initializeRedis();
      if (redis) {
        const cacheKey = `${this.CACHE_KEY}:${question.subject}:${question.topic}:${question.difficulty}`;
        await redis.del(cacheKey);
        console.log("Invalidated cache for:", cacheKey);
      }
      
      return question;
    } catch (error) {
      console.error("Error recording question usage:", error);
      throw error;
    }
  }

  // Get adaptive questions based on user performance
  static async getAdaptiveQuestions(
    userId: string,
    subject: string,
    topic: string,
    difficulty: string,
    limit: number = 5
  ) {
    try {
      console.log("QuestionBankService.getAdaptiveQuestions called with:", { userId, subject, topic, difficulty, limit });
      
      // Ensure database is connected
      await ensureConnected();
      
      // Get user's performance history
      const userHistory = await executeWithRetry(() => prisma.userQuestionHistory.findMany({
        where: {
          userId,
          subject,
          topic
        },
        orderBy: { usedAt: 'desc' },
        take: 20 // Last 20 questions
      }));
      
      console.log("Got user history:", userHistory.length);
      
      // Calculate user's performance metrics
      const correctCount = userHistory.filter(q => q.wasCorrect).length;
      const accuracy = userHistory.length > 0 ? correctCount / userHistory.length : 0.5;
      
      console.log("User accuracy:", accuracy);
      
      // Adjust difficulty based on performance
      let adjustedDifficulty = difficulty;
      if (accuracy > 0.8) {
        // User is doing well, try harder questions
        adjustedDifficulty = this.getHigherDifficulty(difficulty);
      } else if (accuracy < 0.4) {
        // User is struggling, try easier questions
        adjustedDifficulty = this.getLowerDifficulty(difficulty);
      }
      
      console.log("Adjusted difficulty:", adjustedDifficulty);
      
      // Get questions with adjusted difficulty
      const questions = await this.getQuestionsByCriteria(subject, topic, adjustedDifficulty, limit);
      
      console.log("Got adaptive questions:", questions.length);
      
      return questions;
    } catch (error) {
      console.error("Error getting adaptive questions:", error);
      throw error;
    }
  }
  
  // Helper methods for difficulty adjustment
  private static getHigherDifficulty(difficulty: string): string {
    const difficulties = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];
    const currentIndex = difficulties.indexOf(difficulty);
    return currentIndex < difficulties.length - 1 ? difficulties[currentIndex + 1] : difficulty;
  }
  
  private static getLowerDifficulty(difficulty: string): string {
    const difficulties = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];
    const currentIndex = difficulties.indexOf(difficulty);
    return currentIndex > 0 ? difficulties[currentIndex - 1] : difficulty;
  }
}