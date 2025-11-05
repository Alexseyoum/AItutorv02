// File: src/lib/sat-question-generator.ts
import { QuestionBankService } from "@/lib/question-bank";
import { Question, DifficultyLevel } from "@/generated/prisma";

export interface SATQuestion {
  id: string;  // Make id required
  question: string;
  choices: string[];
  answer: string;
  explanation: string;
  subject: string;
  topic: string;
  difficulty: string;
}

interface PersonalizedQuestionOptions {
  section: string;
  topic?: string;
  difficulty?: DifficultyLevel;
  count?: number;
}

export class SATQuestionGenerator {
  // Get questions from the question bank for SAT practice
  static async getQuestions(
    userId: string,
    subject: string,
    topic: string,
    difficulty: string,
    count: number = 5
  ): Promise<SATQuestion[]> {
    try {
      console.log("SATQuestionGenerator.getQuestions called with:", { userId, subject, topic, difficulty, count });
      
      // Try to get adaptive questions based on user performance
      let questions = await QuestionBankService.getAdaptiveQuestions(
        userId,
        subject,
        topic,
        difficulty,
        count
      );
      
      console.log("Got adaptive questions:", questions.length);
      
      // If no adaptive questions found, try to get any questions for this topic
      if (questions.length === 0) {
        console.warn(`No adaptive questions found for ${subject} - ${topic} - ${difficulty}. Trying fallback.`);
        const fallbackQuestions = await QuestionBankService.getQuestionsByCriteria(
          subject,
          topic,
          difficulty,
          count,
          userId // Pass userId to avoid repetition
        );
        questions = [...questions, ...fallbackQuestions];
        console.log("Got fallback questions:", fallbackQuestions.length);
      }
      
      // If still no questions, try any difficulty level
      if (questions.length === 0) {
        console.warn(`No questions found for ${subject} - ${topic}. Trying any difficulty.`);
        const anyDifficultyQuestions = await QuestionBankService.getQuestionsByCriteria(
          subject,
          topic,
          "INTERMEDIATE", // Try intermediate as default
          count,
          userId // Pass userId to avoid repetition
        );
        questions = [...questions, ...anyDifficultyQuestions];
        console.log("Got any difficulty questions:", anyDifficultyQuestions.length);
      }
      
      console.log("Total questions before transformation:", questions.length);
      
      // Transform database questions to SAT questions
      const satQuestions = questions.map((question: Question) => {
        console.log("Processing question:", question.id);
        
        let choices: string[] = [];
        try {
          choices = JSON.parse(question.choices as string);
        } catch (e) {
          console.error("Error parsing choices for question", question.id, e);
          choices = [];
        }
        
        return {
          id: question.id,
          question: question.question,
          choices: choices,
          answer: question.answer,
          explanation: question.explanation,
          subject: question.subject,
          topic: question.topic,
          difficulty: question.difficulty
        };
      }).filter((q: SATQuestion): q is SATQuestion => {
        const isValid = q.id !== undefined;
        if (!isValid) {
          console.warn("Filtering out question without ID:", q);
        }
        return isValid;
      }); // Filter out any questions without id
      
      console.log("SAT questions after transformation:", satQuestions.length);
      
      // If we still don't have questions, throw an error
      if (satQuestions.length === 0) {
        throw new Error(`No questions available for ${subject} - ${topic} - ${difficulty}`);
      }
      
      return satQuestions;
    } catch (error) {
      console.error("Error getting SAT questions:", error);
      throw error;
    }
  }
  
  // Get personalized questions based on user performance and preferences
  static async getPersonalizedQuestions(
    userId: string,
    options: PersonalizedQuestionOptions
  ): Promise<SATQuestion[]> {
    try {
      const { section, topic, difficulty, count = 5 } = options;
      
      console.log("SATQuestionGenerator.getPersonalizedQuestions called with:", { userId, section, topic, difficulty, count });
      
      // Map section to subject
      const subject = this.mapSectionToSubject(section);
      
      // If no topic specified, use a default one based on section
      const questionTopic = topic || this.getDefaultTopicForSection(section);
      
      // If no difficulty specified, use intermediate as default
      const questionDifficulty = difficulty || "INTERMEDIATE";
      
      // Get questions from the question bank
      const questions = await this.getQuestions(
        userId,
        subject,
        questionTopic,
        questionDifficulty,
        count
      );
      
      console.log("Personalized questions result:", questions.length);
      
      return questions;
    } catch (error) {
      console.error("Error getting personalized SAT questions:", error);
      throw error;
    }
  }
  
  // Get a single question by ID
  static async getQuestionById(id: string): Promise<SATQuestion | null> {
    try {
      console.log("SATQuestionGenerator.getQuestionById called with:", id);
      
      const question = await QuestionBankService.getQuestionById(id);
      
      if (!question) {
        return null;
      }
      
      let choices: string[] = [];
      try {
        choices = JSON.parse(question.choices as string);
      } catch (e) {
        console.error("Error parsing choices for question", question.id, e);
        choices = [];
      }
      
      return {
        id: question.id,
        question: question.question,
        choices: choices,
        answer: question.answer,
        explanation: question.explanation,
        subject: question.subject,
        topic: question.topic,
        difficulty: question.difficulty
      };
    } catch (error) {
      console.error("Error getting SAT question by ID:", error);
      throw error;
    }
  }
  
  // Record user's answer and update analytics
  static async recordAnswer(
    questionId: string,
    userId: string,
    wasCorrect: boolean,
    timeSpent: number,
    subject: string,
    topic: string,
    difficulty: string
  ): Promise<void> {
    try {
      console.log("SATQuestionGenerator.recordAnswer called with:", { questionId, userId, wasCorrect, timeSpent, subject, topic, difficulty });
      
      await QuestionBankService.recordQuestionUsage(
        questionId,
        userId,
        wasCorrect,
        timeSpent,
        subject,
        topic,
        difficulty
      );
    } catch (error) {
      console.error("Error recording SAT answer:", error);
      throw error;
    }
  }
  
  // Helper method to map section to subject
  private static mapSectionToSubject(section: string): string {
    switch (section.toLowerCase()) {
      case "math":
        return "Math";
      case "reading":
        return "Reading";
      case "writing":
        return "Writing";
      default:
        return "Math"; // Default to Math
    }
  }
  
  // Helper method to get default topic for section
  private static getDefaultTopicForSection(section: string): string {
    switch (section.toLowerCase()) {
      case "math":
        return "Algebra: Linear Equations";
      case "reading":
        return "Reading Comprehension";
      case "writing":
        return "Grammar: Sentence Structure";
      default:
        return "Algebra: Linear Equations";
    }
  }
}