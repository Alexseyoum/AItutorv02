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

    const updatedSession = await prisma.sATPracticeSession.update({
      where: { id: sessionId },
      data: {
        score,
        answers: {
          ...(existingSession.answers as object || {}),
          userAnswers: answers
        },
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