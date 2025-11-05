// File: src/app/api/question-bank/test-usage/route.ts
import { NextRequest, NextResponse } from "next/server";
import { QuestionBankService } from "@/lib/question-bank";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionId, subject, topic, difficulty } = body;

    if (!questionId) {
      return NextResponse.json(
        { success: false, message: "Question ID is required" },
        { status: 400 }
      );
    }

    // Test recording question usage
    await QuestionBankService.recordQuestionUsage(
      questionId,
      "test-user-id",
      true, // wasCorrect
      30, // timeSpent
      subject || "Math", // Default subject
      topic || "Algebra", // Default topic
      difficulty || "INTERMEDIATE" // Default difficulty
    );

    return NextResponse.json({ success: true, message: "Question usage recorded" });
  } catch (error) {
    console.error("Test failed:", error);
    return NextResponse.json(
      { success: false, message: "Test failed", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}