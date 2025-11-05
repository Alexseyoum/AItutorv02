// File: src/app/api/question-bank/test/route.ts
import { NextRequest, NextResponse } from "next/server";
import { QuestionBankService } from "@/lib/question-bank";

export async function GET(_request: NextRequest) {
  try {
    // Test getting questions by criteria
    const questions = await QuestionBankService.getQuestionsByCriteria(
      "Math",
      "Algebra",
      "INTERMEDIATE",
      5
    );

    // Test adaptive questions (using a mock user ID)
    const adaptiveQuestions = await QuestionBankService.getAdaptiveQuestions(
      "test-user-id",
      "Math",
      "Algebra",
      "INTERMEDIATE",
      5
    );

    return NextResponse.json({
      success: true,
      questions: questions.length,
      adaptiveQuestions: adaptiveQuestions.length,
      data: {
        questions: questions.slice(0, 2),
        adaptiveQuestions: adaptiveQuestions.slice(0, 2)
      }
    });
  } catch (error) {
    console.error("Test failed:", error);
    return NextResponse.json(
      { success: false, message: "Test failed", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}