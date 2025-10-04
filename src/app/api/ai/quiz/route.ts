import { NextRequest, NextResponse } from "next/server";
import { EngagingTutorAgent } from "@/lib/ai/tutor-engine";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { concept, difficulty = 'medium' } = await request.json();

    if (!concept) {
      return NextResponse.json(
        { error: "Concept is required" },
        { status: 400 }
      );
    }

    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return NextResponse.json(
        { error: "Difficulty must be easy, medium, or hard" },
        { status: 400 }
      );
    }

    const tutorAgent = new EngagingTutorAgent();
    const quiz = await tutorAgent.generateMicroQuiz(concept, difficulty);

    if (!quiz) {
      return NextResponse.json(
        { error: "Failed to generate quiz" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      quiz
    });

  } catch (error) {
    console.error("Quiz generation API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}