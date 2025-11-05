// File: src/app/api/sat/fallback-questions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { QuestionBankService } from "@/lib/question-bank";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { section, topic, count = 5 } = body;

    console.log("Fallback questions requested:", { section, topic, count });

    // Map section to subject
    let subject = "Math";
    switch (section.toLowerCase()) {
      case "reading":
        subject = "Reading";
        break;
      case "writing":
        subject = "Writing";
        break;
      default:
        subject = "Math";
    }

    // Try to get questions with multiple fallback strategies
    let questions: any[] = [];
    
    // Strategy 1: Try exact match
    try {
      questions = await QuestionBankService.getQuestionsByCriteria(
        subject,
        topic,
        "INTERMEDIATE",
        count
      );
    } catch (error) {
      console.warn("Strategy 1 failed:", error);
    }

    // Strategy 2: Try any difficulty
    if (questions.length === 0) {
      try {
        questions = await QuestionBankService.getQuestionsByCriteria(
          subject,
          topic,
          "", // Any difficulty
          count
        );
      } catch (error) {
        console.warn("Strategy 2 failed:", error);
      }
    }

    // Strategy 3: Try any topic in the subject
    if (questions.length === 0) {
      try {
        questions = await QuestionBankService.getQuestionsByCriteria(
          subject,
          "", // Any topic
          "INTERMEDIATE",
          count
        );
      } catch (error) {
        console.warn("Strategy 3 failed:", error);
      }
    }

    // Transform questions to match expected format
    const formattedQuestions = questions
      .filter((q: any) => q && q.id)
      .map((q: any) => {
        let choicesArray: string[] = [];
        try {
          choicesArray = typeof q.choices === 'string' ? JSON.parse(q.choices) : q.choices;
        } catch (e) {
          console.error("Error parsing choices:", e);
          choicesArray = [];
        }
        
        // Normalize answer to handle edge cases
        let correctAnswerIndex = -1;
        const normalizedAnswer = q.answer?.trim().toLowerCase() || '';
        
        // Try exact match first
        correctAnswerIndex = choicesArray.findIndex((choice: string) => 
          choice.trim().toLowerCase() === normalizedAnswer
        );
        
        // If not found, try to extract just the answer part (in case AI returns "C) 7" format)
        if (correctAnswerIndex === -1) {
          // Remove option letters like "A)", "B)", etc.
          const cleanedAnswer = normalizedAnswer.replace(/^[a-d]\)\s*/i, '');
          correctAnswerIndex = choicesArray.findIndex((choice: string) => 
            choice.trim().toLowerCase() === cleanedAnswer ||
            choice.trim().toLowerCase().includes(cleanedAnswer)
          );
        }
        
        // If still not found, default to 0 and log error
        if (correctAnswerIndex === -1) {
          console.error(`Could not match answer "${q.answer}" to choices:`, choicesArray);
          correctAnswerIndex = 0;
        }
        
        // Map difficulty to expected values
        let difficulty: "easy" | "medium" | "hard" = "medium";
        if (q.difficulty) {
          const lowerDiff = q.difficulty.toLowerCase();
          if (lowerDiff.includes("easy") || lowerDiff === "beginner") {
            difficulty = "easy";
          } else if (lowerDiff.includes("hard") || lowerDiff.includes("advanced")) {
            difficulty = "hard";
          } else {
            difficulty = "medium";
          }
        }
        
        return {
          id: q.id,
          question: q.question || "",
          choices: choicesArray,
          correctAnswer: correctAnswerIndex,
          explanation: q.explanation || "",
          topic: q.topic || topic,
          difficulty: difficulty
        };
      })
      .filter((q: any) => q.id && q.question && q.choices && q.choices.length > 0);

    console.log("Formatted fallback questions:", formattedQuestions.length);

    if (formattedQuestions.length === 0) {
      // Return mock questions as ultimate fallback
      const mockQuestions = [];
      for (let i = 0; i < count; i++) {
        mockQuestions.push({
          id: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}`,
          question: `What is 2 + 2? (Mock question #${i + 1})`,
          choices: ["3", "4", "5", "6"],
          correctAnswer: 1,
          explanation: "This is a mock question because we couldn't find real questions in the database.",
          topic: topic,
          difficulty: "medium"
        });
      }
      
      return NextResponse.json({
        sessionId: `mock-${Date.now()}`,
        questions: mockQuestions
      });
    }

    return NextResponse.json({
      sessionId: `fallback-${Date.now()}`,
      questions: formattedQuestions
    });
  } catch (error) {
    console.error("Fallback questions error:", error);
    
    // Ultimate fallback - return mock questions
    const mockQuestions = [];
    for (let i = 0; i < 5; i++) {
      mockQuestions.push({
        id: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}`,
        question: `What is 2 + 2? (Mock question #${i + 1})`,
        choices: ["3", "4", "5", "6"],
        correctAnswer: 1,
        explanation: "This is a mock question because we couldn't connect to the database.",
        topic: "General",
        difficulty: "medium"
      });
    }
    
    return NextResponse.json({
      sessionId: `mock-${Date.now()}`,
      questions: mockQuestions
    });
  }
}