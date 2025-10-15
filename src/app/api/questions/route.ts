import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest) {
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

    // Only admins can approve/reject questions
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, message: "Question ID and status are required" },
        { status: 400 }
      );
    }

    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { success: false, message: "Status must be 'approved' or 'rejected'" },
        { status: 400 }
      );
    }

    const updatedQuestion = await prisma.question.update({
      where: { id },
      data: { status, updatedAt: new Date() }
    });

    return NextResponse.json({ success: true, question: updatedQuestion });
  } catch (error: any) {
    console.error("Failed to update question status:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update question status", error: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch approved questions by topic
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const topic = searchParams.get("topic");
    const subject = searchParams.get("subject");
    const difficulty = searchParams.get("difficulty");
    const limit = parseInt(searchParams.get("limit") || "10");

    const questions = await prisma.question.findMany({
      where: {
        status: "approved",
        ...(topic && { topic: { contains: topic, mode: "insensitive" } }),
        ...(subject && { subject: { contains: subject, mode: "insensitive" } }),
        ...(difficulty && { difficulty: { contains: difficulty, mode: "insensitive" } })
      },
      take: Math.min(limit, 50), // Cap at 50 questions
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json({ success: true, questions });
  } catch (error: unknown) {
    console.error("Failed to fetch questions:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch questions", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}