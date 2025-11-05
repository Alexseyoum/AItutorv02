// File: src/app/api/question-bank/generate-batch/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { BatchQuestionGenerator } from "@/lib/batch-question-generator";

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
    const { topics, countPerTopic, difficulty, generateSAT } = body;

    let questions;
    
    if (generateSAT) {
      // Generate questions for all SAT topics
      questions = await BatchQuestionGenerator.generateSATBatch({
        countPerTopic,
        difficulty,
        userId: session.user.id
      });
    } else if (topics && Array.isArray(topics)) {
      // Generate questions for specific topics
      questions = await BatchQuestionGenerator.generateBatch({
        topics,
        difficulty,
        userId: session.user.id
      });
    } else {
      return NextResponse.json(
        { success: false, message: "Either 'topics' array or 'generateSAT' flag is required" },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: `Generated ${questions.length} questions`,
      questions 
    });
  } catch (error) {
    console.error("Batch question generation failed:", error);
    return NextResponse.json(
      { success: false, message: "Failed to generate questions", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}