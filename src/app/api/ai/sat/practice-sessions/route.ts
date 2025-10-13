// src/app/api/ai/sat/practice-sessions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    // Check if there's an ID parameter
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      // Fetch specific session by ID
      const practiceSession = await prisma.sATPracticeSession.findUnique({
        where: { 
          id,
          userId: session.user.id 
        }
      });

      if (!practiceSession) {
        return NextResponse.json(
          { error: "Session not found" },
          { status: 404 }
        );
      }

      console.log("Loaded practice session:", practiceSession);
      console.log("Answers object:", practiceSession.answers);

      return NextResponse.json({ session: practiceSession });
    } else {
      // Fetch all sessions for the user
      const sessions = await prisma.sATPracticeSession.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' }
      });

      return NextResponse.json({ sessions });
    }
  } catch (error) {
    console.error("SAT practice sessions fetch error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: "Internal server error", details: errorMessage },
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
    const { section, score, maxScore, answers, timeSpent } = body;

    console.log("Creating practice session with data:", {
      userId: session.user.id,
      section,
      score,
      maxScore,
      answers,
      timeSpent
    });

    // Validate required fields
    if (!section) {
      return NextResponse.json(
        { error: "Section is required" },
        { status: 400 }
      );
    }

    const practiceSession = await prisma.sATPracticeSession.create({
      data: {
        userId: session.user.id,
        section,
        score,
        maxScore,
        // Store the entire answers object (which now includes both questions and userAnswers)
        answers,
        timeSpent,
        completedAt: new Date()
      }
    });

    console.log("Created practice session:", practiceSession);

    return NextResponse.json({ session: practiceSession });
  } catch (error) {
    console.error("SAT practice session creation error:", error);
    // Check for specific Prisma errors
    if (error instanceof Error && 'code' in error && error.code === 'P2003') {
      return NextResponse.json(
        { error: "Invalid user ID", details: "The user ID provided does not exist" },
        { status: 400 }
      );
    }
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 }
    );
  }
}

// Add PUT method to update practice sessions
export async function PUT(request: NextRequest) {
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
    const { id, score, maxScore, completedAt } = body;

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Verify the session belongs to the user
    const existingSession = await prisma.sATPracticeSession.findUnique({
      where: { id }
    });

    if (!existingSession || existingSession.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Session not found or unauthorized" },
        { status: 404 }
      );
    }

    const updatedSession = await prisma.sATPracticeSession.update({
      where: { id },
      data: {
        score,
        maxScore,
        completedAt: completedAt ? new Date(completedAt) : existingSession.completedAt
      }
    });

    return NextResponse.json({ session: updatedSession });
  } catch (error) {
    console.error("SAT practice session update error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 }
    );
  }
}
