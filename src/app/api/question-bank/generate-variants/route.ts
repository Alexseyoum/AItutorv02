// File: src/app/api/question-bank/generate-variants/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { QuestionVariantGenerator } from "@/lib/question-variant-generator";

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
    const { questionId, questionIds, count } = body;

    if (!questionId && (!questionIds || !Array.isArray(questionIds))) {
      return NextResponse.json(
        { success: false, message: "Question ID or array of question IDs is required" },
        { status: 400 }
      );
    }

    if (questionId) {
      // Generate variants for a single question
      const variants = await QuestionVariantGenerator.generateVariants(
        questionId,
        count || 3
      );

      return NextResponse.json({ 
        success: true, 
        message: `Generated ${variants.length} variants`,
        variants 
      });
    } else {
      // Batch generate variants
      const variants = await QuestionVariantGenerator.batchGenerateVariants(
        questionIds,
        count || 3
      );

      return NextResponse.json({ 
        success: true, 
        message: `Generated ${variants.length} variants from ${questionIds.length} questions`,
        variants 
      });
    }
  } catch (error) {
    console.error("Failed to generate question variants:", error);
    return NextResponse.json(
      { success: false, message: "Failed to generate question variants", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}