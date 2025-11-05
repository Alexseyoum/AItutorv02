// File: src/app/api/ai/sat/practice-sessions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { SATQuestionGenerator } from "@/lib/sat-question-generator";
import { prisma } from "@/lib/prisma";
// Removed unused DifficultyLevel import

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get user's practice sessions
    const practiceSessions = await prisma.sATPracticeSession.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 10 // Limit to last 10 sessions
    });

    return NextResponse.json({ practiceSessions });
  } catch (error: any) {
    console.error("SAT practice sessions fetch error:", error);
    
    return NextResponse.json(
      { error: "Failed to load practice sessions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    });

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { section, topic, difficulty, count } = body;

    // Validate inputs
    if (!section) {
      return NextResponse.json(
        { error: "Section is required" },
        { status: 400 }
      );
    }

    // Map section to subject
    const subject = mapSectionToSubject(section);
    
    // If no topic specified, use a default one based on section
    const questionTopic = topic || getDefaultTopicForSection(section);
    
    // If no difficulty specified, use intermediate as default
    const questionDifficulty = difficulty || "INTERMEDIATE";

    // Get questions from the question bank
    const questions = await SATQuestionGenerator.getQuestions(
      session.user.id,
      subject,
      questionTopic,
      questionDifficulty,
      count
    );

    return NextResponse.json({ questions });
  } catch (error: any) {
    console.error("SAT practice questions error:", error);
    
    return NextResponse.json(
      { error: "Failed to generate practice questions" },
      { status: 500 }
    );
  }
}

// Helper function to map section to subject
function mapSectionToSubject(section: string): string {
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

// Helper function to get default topic for section
function getDefaultTopicForSection(section: string): string {
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