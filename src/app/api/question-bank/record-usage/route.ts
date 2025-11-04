// File: src/app/api/question-bank/record-usage/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { QuestionBankService } from "@/lib/question-bank";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { questionId, wasCorrect, timeSpent, subject, topic, difficulty } = body;

    if (!questionId) {
      return NextResponse.json(
        { success: false, message: "Question ID is required" },
        { status: 400 }
      );
    }

    // Record question usage in the question bank
    await QuestionBankService.recordQuestionUsage(
      questionId,
      session.user.id,
      wasCorrect,
      timeSpent,
      subject,
      topic,
      difficulty
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to record question usage:", error);
    return NextResponse.json(
      { success: false, message: "Failed to record question usage", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}