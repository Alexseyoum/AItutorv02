// src/app/api/ai/sat/diagnostic/route.ts
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

    const diagnostic = await prisma.sATDiagnosticResult.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ diagnostic });
  } catch (error) {
    console.error("SAT diagnostic fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
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
    const { mathScore, readingScore, writingScore, totalScore, strengths, weaknesses } = body;

    const diagnostic = await prisma.sATDiagnosticResult.create({
      data: {
        userId: session.user.id,
        mathScore,
        readingScore,
        writingScore,
        totalScore,
        strengths,
        weaknesses
      }
    });

    return NextResponse.json({ diagnostic });
  } catch (error) {
    console.error("SAT diagnostic creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}