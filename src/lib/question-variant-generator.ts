// File: src/lib/question-variant-generator.ts
import { prisma } from "@/lib/prisma";
import { Question } from "@/generated/prisma";

export class QuestionVariantGenerator {
  /**
   * Generate variants of a question by changing numbers, names, or contexts
   */
  static async generateVariants(questionId: string, count: number = 3) {
    try {
      // Get the original question
      const originalQuestion = await prisma.question.findUnique({
        where: { id: questionId }
      });

      if (!originalQuestion) {
        throw new Error(`Question with ID ${questionId} not found`);
      }

      const variants = [];
      
      // For now, we'll create simple variants by changing numbers in math questions
      // In a full implementation, this would be more sophisticated
      for (let i = 0; i < count; i++) {
        const variant = await this.createVariant(originalQuestion, i);
        variants.push(variant);
      }

      return variants;
    } catch (error) {
      console.error("Error generating question variants:", error);
      throw error;
    }
  }

  /**
   * Create a single variant of a question
   */
  private static async createVariant(originalQuestion: Question, variantIndex: number) {
    try {
      // For math questions, we can change numbers
      let newQuestion = originalQuestion.question;
      let newChoices = originalQuestion.choices as string;
      let newAnswer = originalQuestion.answer;
      let newExplanation = originalQuestion.explanation;

      // Simple number replacement for math questions
      if (originalQuestion.subject === "Math") {
        // Find numbers in the question and replace them
        const numbers = newQuestion.match(/\d+/g);
        if (numbers && numbers.length > 0) {
          // Replace each number with a variant
          numbers.forEach((num, index) => {
            const newNum = parseInt(num) + (variantIndex + 1) * (index + 1);
            newQuestion = newQuestion.replace(new RegExp(num, 'g'), newNum.toString());
          });

          // Update choices and answer if they contain numbers
          if (typeof originalQuestion.choices === 'string') {
            try {
              const choicesArray = JSON.parse(originalQuestion.choices);
              const newChoicesArray = choicesArray.map((choice: string) => {
                let newChoice = choice;
                numbers.forEach((num, index) => {
                  const newNum = parseInt(num) + (variantIndex + 1) * (index + 1);
                  newChoice = newChoice.replace(new RegExp(num, 'g'), newNum.toString());
                });
                return newChoice;
              });
              newChoices = JSON.stringify(newChoicesArray);
            } catch (e) {
              console.error("Error parsing choices:", e);
            }
          }

          // Update answer if it contains numbers
          const answerNumbers = newAnswer.match(/\d+/g);
          if (answerNumbers) {
            answerNumbers.forEach((num, index) => {
              const newNum = parseInt(num) + (variantIndex + 1) * (index + 1);
              newAnswer = newAnswer.replace(new RegExp(num, 'g'), newNum.toString());
            });
          }

          // Update explanation
          newExplanation = `This is variant ${variantIndex + 1} of the original question. ` + newExplanation;
        }
      }

      // Create the variant in the database
      const variant = await prisma.question.create({
        data: {
          topic: originalQuestion.topic,
          subject: originalQuestion.subject,
          difficulty: originalQuestion.difficulty,
          question: newQuestion,
          choices: newChoices,
          answer: newAnswer,
          explanation: newExplanation,
          source: "generated",
          status: "PENDING_REVIEW",
          tags: originalQuestion.tags,
          parentVersionId: originalQuestion.id,
          version: originalQuestion.version + 1
        }
      });

      return variant;
    } catch (error) {
      console.error("Error creating question variant:", error);
      throw error;
    }
  }

  /**
   * Batch generate variants for multiple questions
   */
  static async batchGenerateVariants(questionIds: string[], variantsPerQuestion: number = 3) {
    try {
      const allVariants = [];
      
      for (const questionId of questionIds) {
        try {
          const variants = await this.generateVariants(questionId, variantsPerQuestion);
          allVariants.push(...variants);
        } catch (error) {
          console.error(`Error generating variants for question ${questionId}:`, error);
          // Continue with other questions
        }
      }

      return allVariants;
    } catch (error) {
      console.error("Error in batch variant generation:", error);
      throw error;
    }
  }
}