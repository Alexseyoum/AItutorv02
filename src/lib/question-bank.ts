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
    limit: number = 10,
    userId?: string // Add userId parameter to avoid repetition
  ) {
    try {
      console.log("QuestionBankService.getQuestionsByCriteria called with:", { subject, topic, difficulty, limit, userId });
      
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
      
      // Build the query with repetition avoidance logic
      const whereClause: any = {
        subject,
        ...(topic ? { topic } : {}), // Only filter by topic if provided
        ...(difficulty ? { difficulty } : {}), // Only filter by difficulty if provided
        status: "APPROVED",
        isActive: true
      };
      
      // If we have a userId, exclude questions the user has recently answered correctly
      if (userId) {
        // Get recently answered questions (last 30 days) that were answered correctly
        const recentCorrectAnswers = await executeWithRetry(() => 
          prisma.userQuestionHistory.findMany({
            where: {
              userId,
              subject,
              topic,
              wasCorrect: true,
              usedAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
              }
            },
            select: {
              questionId: true
            }
          })
        );
        
        // Exclude these questions from selection
        if (recentCorrectAnswers.length > 0) {
          whereClause.id = {
            notIn: recentCorrectAnswers.map(q => q.questionId)
          };
        }
      }
      
      // Get from database with improved ordering to avoid repetition
      const questions = await executeWithRetry(() => prisma.question.findMany({
        where: whereClause,
        take: limit * 2, // Get more questions to allow for filtering
        orderBy: [
          { usageCount: 'asc' }, // Prefer less used questions
          { lastUsedAt: 'asc' },  // Prefer older questions
          { avgCorrectRate: 'asc' } // Prefer questions with lower correct rates (more challenging)
        ]
      }));
      
      console.log(`Got ${questions.length} questions from database for ${subject} - ${topic} - ${difficulty}`);
      
      // Log detailed information about the questions retrieved
      if (questions.length > 0) {
        console.log("Sample questions:", questions.slice(0, 3).map(q => ({
          id: q.id,
          subject: q.subject,
          topic: q.topic,
          difficulty: q.difficulty
        })));
      }
      
      // Apply additional filtering to avoid repetition
      let filteredQuestions = questions;
      
      // If we have a userId, apply more sophisticated filtering
      if (userId) {
        // Get all questions this user has ever seen
        const allUserQuestions = await executeWithRetry(() => 
          prisma.userQuestionHistory.findMany({
            where: {
              userId,
              subject,
              topic
            },
            select: {
              questionId: true,
              wasCorrect: true,
              usedAt: true
            }
          })
        );
        
        // Create a map of question performance
        const questionPerformance = new Map();
        allUserQuestions.forEach(q => {
          if (!questionPerformance.has(q.questionId) || q.usedAt > questionPerformance.get(q.questionId).usedAt) {
            questionPerformance.set(q.questionId, q);
          }
        });
        
        // Filter out recently answered questions and incorrectly answered questions (unless it's been a while)
        const now = new Date();
        filteredQuestions = questions.filter(q => {
          const performance = questionPerformance.get(q.id);
          if (!performance) return true; // Never seen before, include it
          
          // If answered correctly recently, don't show again
          if (performance.wasCorrect && 
              (now.getTime() - performance.usedAt.getTime()) < 7 * 24 * 60 * 60 * 1000) { // Last 7 days
            return false;
          }
          
          // If answered incorrectly, show again sooner
          if (!performance.wasCorrect && 
              (now.getTime() - performance.usedAt.getTime()) > 24 * 60 * 60 * 1000) { // After 1 day
            return true;
          }
          
          // For other cases, apply standard filtering
          return (now.getTime() - performance.usedAt.getTime()) > 3 * 24 * 60 * 60 * 1000; // After 3 days
        });
      }
      
      // Take only the number of questions requested
      const finalQuestions = filteredQuestions.slice(0, limit);
      console.log(`Final questions after filtering: ${finalQuestions.length}`);
      
      // If no questions found with exact criteria, try with any difficulty
      if (finalQuestions.length === 0 && difficulty) {
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
        console.log(`Got ${fallbackQuestions.length} fallback questions for ${subject} - ${topic} (any difficulty)`);
        return fallbackQuestions; // Return fallback questions directly
      }
      
      // Cache the results (if Redis is available)
      if (redis && finalQuestions.length > 0) {
        const cacheKey = `${this.CACHE_KEY}:${subject}:${topic}:${difficulty}`;
        await redis.setEx(cacheKey, this.CACHE_TTL, JSON.stringify(finalQuestions));
        console.log("Cached questions");
      }
      
      return finalQuestions;
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
  
  // Helper method to get consecutive incorrect count for a user and question
  private static async getConsecutiveIncorrectCount(userId: string, questionId: string): Promise<number> {
    try {
      // Get the user's history for this question, ordered by most recent first
      const history = await executeWithRetry(() => 
        prisma.userQuestionHistory.findMany({
          where: {
            userId,
            questionId
          },
          orderBy: {
            usedAt: 'desc'
          },
          take: 10 // Check last 10 attempts
        })
      );
      
      // Count consecutive incorrect answers from most recent
      let count = 0;
      for (const attempt of history) {
        if (attempt.wasCorrect) {
          break; // Stop counting when we hit a correct answer
        }
        count++;
      }
      
      return count;
    } catch (error) {
      console.error("Error getting consecutive incorrect count:", error);
      return 0; // Default to 0 if there's an error
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
      
      // Get user's performance history for this topic
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
      
      // Calculate average time spent
      const avgTime = userHistory.length > 0 ? 
        userHistory.reduce((sum, q) => sum + (q.timeSpent || 0), 0) / userHistory.length : 60;
      
      console.log("User accuracy:", accuracy, "Average time:", avgTime);
      
      // Adjust difficulty based on performance
      let adjustedDifficulty = difficulty;
      if (accuracy > 0.8 && avgTime < 45) {
        // User is doing well and answering quickly, try harder questions
        adjustedDifficulty = this.getHigherDifficulty(difficulty);
      } else if (accuracy < 0.4 || avgTime > 120) {
        // User is struggling or taking too long, try easier questions
        adjustedDifficulty = this.getLowerDifficulty(difficulty);
      }
      
      console.log("Adjusted difficulty:", adjustedDifficulty);
      
      // Get questions with adjusted difficulty, avoiding repetition
      const questions = await this.getQuestionsByCriteria(subject, topic, adjustedDifficulty, limit, userId);
      
      console.log("Got adaptive questions:", questions.length);
      
      // If we don't have enough questions, try to get more with the original difficulty
      if (questions.length < limit && adjustedDifficulty !== difficulty) {
        const additionalQuestions = await this.getQuestionsByCriteria(
          subject, topic, difficulty, limit - questions.length, userId
        );
        questions.push(...additionalQuestions);
      }
      
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