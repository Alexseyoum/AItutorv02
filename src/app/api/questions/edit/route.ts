// File: src/app/api/questions/edit/route.ts
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

    // Check if user is admin
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Question ID is required" },
        { status: 400 }
      );
    }

    // Update the question
    const updatedQuestion = await prisma.question.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ success: true, question: updatedQuestion });
  } catch (error) {
    console.error("Failed to update question:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update question", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}