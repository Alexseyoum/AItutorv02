// File: src/lib/batch-question-generator.ts
import { prisma } from "@/lib/prisma";
import { generateQuestions } from "@/lib/utils/questionBank";
import { rateLimiter } from "@/lib/rate-limiter";

export class BatchQuestionGenerator {
  /**
   * Generate a batch of questions for specific topics
   */
  static async generateBatch(params: {
    topics: { subject: string; topic: string; count: number }[];
    difficulty?: string;
    userId?: string;
  }) {
    try {
      const generatedQuestions = [];
      
      for (const topic of params.topics) {
        try {
          // Wait for rate limit
          await rateLimiter.waitForLimit("question-generation");
          
          // Generate questions for this topic
          const questions = await generateQuestions({
            subject: topic.subject,
            topic: topic.topic,
            difficulty: params.difficulty,
            questionCount: topic.count
          });
          
          // Save questions to database
          for (const question of questions) {
            const savedQuestion = await prisma.question.create({
              data: {
                topic: topic.topic,
                subject: topic.subject,
                difficulty: params.difficulty || "INTERMEDIATE",
                question: question.question,
                choices: JSON.stringify(question.choices),
                answer: question.answer,
                explanation: question.explanation,
                source: "generated",
                status: "PENDING_REVIEW",
                userGeneratedBy: params.userId
              }
            });
            
            generatedQuestions.push(savedQuestion);
          }
        } catch (error) {
          console.error(`Error generating questions for ${topic.subject} - ${topic.topic}:`, error);
          // Continue with other topics
        }
      }
      
      return generatedQuestions;
    } catch (error) {
      console.error("Batch question generation failed:", error);
      throw error;
    }
  }

  /**
   * Generate questions for all SAT topics
   */
  static async generateSATBatch(params: {
    countPerTopic?: number;
    difficulty?: string;
    userId?: string;
  }) {
    const topics = [
      // Math topics
      { subject: "Math", topic: "Algebra: Linear Equations", count: params.countPerTopic || 5 },
      { subject: "Math", topic: "Algebra: Systems of Equations", count: params.countPerTopic || 5 },
      { subject: "Math", topic: "Algebra: Quadratic Equations", count: params.countPerTopic || 5 },
      { subject: "Math", topic: "Geometry: Triangles", count: params.countPerTopic || 5 },
      { subject: "Math", topic: "Geometry: Circles", count: params.countPerTopic || 5 },
      { subject: "Math", topic: "Data Analysis: Statistics", count: params.countPerTopic || 5 },
      { subject: "Math", topic: "Data Analysis: Probability", count: params.countPerTopic || 5 },
      
      // Reading topics
      { subject: "Reading", topic: "Reading Comprehension: Literature", count: params.countPerTopic || 5 },
      { subject: "Reading", topic: "Reading Comprehension: History", count: params.countPerTopic || 5 },
      { subject: "Reading", topic: "Reading Comprehension: Science", count: params.countPerTopic || 5 },
      { subject: "Reading", topic: "Command of Evidence", count: params.countPerTopic || 5 },
      { subject: "Reading", topic: "Words in Context", count: params.countPerTopic || 5 },
      
      // Writing topics
      { subject: "Writing", topic: "Standard English Conventions: Grammar", count: params.countPerTopic || 5 },
      { subject: "Writing", topic: "Standard English Conventions: Punctuation", count: params.countPerTopic || 5 },
      { subject: "Writing", topic: "Expression of Ideas: Organization", count: params.countPerTopic || 5 },
      { subject: "Writing", topic: "Expression of Ideas: Precision", count: params.countPerTopic || 5 }
    ];
    
    return await this.generateBatch({
      topics,
      difficulty: params.difficulty,
      userId: params.userId
    });
  }
}