// File: src/app/api/question-bank/lifecycle/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { QuestionLifecycleManager } from "@/lib/question-lifecycle";
import { QuestionStatus } from "@/lib/question-bank";

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

    // Check if user is admin
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "retireUnderperforming":
        const retiredStats = await QuestionLifecycleManager.retireUnderperformingQuestions();
        return NextResponse.json({ 
          success: true, 
          message: "Underperforming questions retired",
          stats: retiredStats
        });

      case "archiveOld":
        const archivedCount = await QuestionLifecycleManager.archiveOldQuestions();
        return NextResponse.json({ 
          success: true, 
          message: "Old questions archived",
          count: archivedCount
        });

      case "getByStage":
        const { status, limit } = body;
        // Convert string status to enum
        const statusEnum = status as QuestionStatus;
        const questions = await QuestionLifecycleManager.getQuestionsByStage(statusEnum, limit);
        return NextResponse.json({ 
          success: true, 
          questions
        });

      default:
        return NextResponse.json(
          { success: false, message: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Question lifecycle management error:", error);
    return NextResponse.json(
      { success: false, message: "Operation failed", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}