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

    // Add a timeout to the database query
    const diagnostic = await Promise.race([
      prisma.sATDiagnosticResult.findFirst({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' }
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 5000)
      )
    ]);

    // Parse strengths and weaknesses if they're JSON strings
    if (diagnostic && typeof diagnostic === 'object') {
      if ('strengths' in diagnostic && typeof diagnostic.strengths === 'string') {
        try {
          diagnostic.strengths = JSON.parse(diagnostic.strengths);
        } catch (e) {
          console.error('Failed to parse strengths:', e);
          diagnostic.strengths = [];
        }
      }
      if ('weaknesses' in diagnostic && typeof diagnostic.weaknesses === 'string') {
        try {
          diagnostic.weaknesses = JSON.parse(diagnostic.weaknesses);
        } catch (e) {
          console.error('Failed to parse weaknesses:', e);
          diagnostic.weaknesses = [];
        }
      }
    }

    return NextResponse.json({ diagnostic });
  } catch (error: any) {
    console.error("SAT diagnostic fetch error:", error);
    
    // Handle specific timeout error
    if (error.message === 'Database query timeout') {
      return NextResponse.json(
        { error: "Database connection timeout. Please try again." },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  let prismaClient: any = null;
  
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
    const { mathScore, readingScore, writingScore, totalScore, strengths, weaknesses, questionAnswers } = body;

    // Parse JSON strings if they are strings, otherwise use as-is
    const parsedStrengths = typeof strengths === 'string' ? JSON.parse(strengths) : strengths;
    const parsedWeaknesses = typeof weaknesses === 'string' ? JSON.parse(weaknesses) : weaknesses;
    const parsedQuestionAnswers = typeof questionAnswers === 'string' ? JSON.parse(questionAnswers) : questionAnswers;

    // Create a new Prisma client instance for this request to avoid connection pool issues
    prismaClient = prisma;

    // Add timeout to database operations
    const operationWithTimeout = async (operation: Promise<any>) => {
      return Promise.race([
        operation,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database operation timeout')), 10000)
        )
      ]);
    };

    // Check if a diagnostic result already exists for this user
    const existingDiagnostic = await operationWithTimeout(
      prismaClient.sATDiagnosticResult.findFirst({
        where: { userId: session.user.id }
      })
    );

    let diagnostic;
    if (existingDiagnostic) {
      // Update existing diagnostic result
      diagnostic = await operationWithTimeout(
        prismaClient.sATDiagnosticResult.update({
          where: { id: existingDiagnostic.id },
          data: {
            mathScore,
            readingScore,
            writingScore,
            totalScore,
            strengths: parsedStrengths,
            weaknesses: parsedWeaknesses,
            questionAnswers: parsedQuestionAnswers,
            updatedAt: new Date()
          }
        })
      );
    } else {
      // Create new diagnostic result
      diagnostic = await operationWithTimeout(
        prismaClient.sATDiagnosticResult.create({
          data: {
            userId: session.user.id,
            mathScore,
            readingScore,
            writingScore,
            totalScore,
            strengths: parsedStrengths,
            weaknesses: parsedWeaknesses,
            questionAnswers: parsedQuestionAnswers
          }
        })
      );
    }

    return NextResponse.json({ diagnostic });
  } catch (error: any) {
    console.error("SAT diagnostic creation/update error:", error);
    
    // Handle specific timeout error
    if (error.message === 'Database operation timeout') {
      return NextResponse.json(
        { error: "Database connection timeout. Please try again." },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}