// src/app/api/sat/complete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const { sessionId, answers, score } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    const existingSession = await prisma.sATPracticeSession.findUnique({
      where: { id: sessionId }
    });

    if (!existingSession || existingSession.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Session not found or unauthorized" },
        { status: 404 }
      );
    }

    // Calculate time spent (assuming answers array contains timing information)
    // If the existing session already has timeSpent, we keep it
    // Otherwise we calculate it from the answers if possible
    let timeSpent = existingSession.timeSpent || 0;
    
    // If answers is an array with timing info, calculate total time
    if (Array.isArray(answers)) {
      // We'll need to get the original questions to calculate time properly
      // For now, we'll just update the session with the provided data
    }

    const updatedSession = await prisma.sATPracticeSession.update({
      where: { id: sessionId },
      data: {
        score,
        answers: answers, // Store the answers directly, not merged
        timeSpent: timeSpent,
        completedAt: new Date()
      }
    });

    return NextResponse.json({ session: updatedSession });
  } catch (error) {
    console.error("SAT practice complete error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: "Failed to complete session", details: errorMessage },
      { status: 500 }
    );
  }
}