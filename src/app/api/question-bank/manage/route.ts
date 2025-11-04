// File: src/app/api/question-bank/manage/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
    const { action, ...params } = body;

    switch (action) {
      case "generateVariants":
        return await handleGenerateVariants(params);
      case "batchApprove":
        return await handleBatchApprove(params);
      case "batchReject":
        return await handleBatchReject(params);
      case "getStats":
        return await handleGetStats();
      default:
        return NextResponse.json(
          { success: false, message: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Question bank management error:", error);
    return NextResponse.json(
      { success: false, message: "Operation failed", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

async function handleGenerateVariants(params: any) {
  try {
    const { questionId, questionIds, count } = params;

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
    } else if (questionIds && Array.isArray(questionIds)) {
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
    } else {
      return NextResponse.json(
        { success: false, message: "Question ID or array of question IDs is required" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Generate variants error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to generate variants", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

async function handleBatchApprove(params: any) {
  try {
    const { questionIds } = params;

    if (!questionIds || !Array.isArray(questionIds)) {
      return NextResponse.json(
        { success: false, message: "Array of question IDs is required" },
        { status: 400 }
      );
    }

    const updatedQuestions = await prisma.question.updateMany({
      where: {
        id: { in: questionIds }
      },
      data: {
        status: "APPROVED",
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Approved ${updatedQuestions.count} questions`
    });
  } catch (error) {
    console.error("Batch approve error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to approve questions", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

async function handleBatchReject(params: any) {
  try {
    const { questionIds } = params;

    if (!questionIds || !Array.isArray(questionIds)) {
      return NextResponse.json(
        { success: false, message: "Array of question IDs is required" },
        { status: 400 }
      );
    }

    const updatedQuestions = await prisma.question.updateMany({
      where: {
        id: { in: questionIds }
      },
      data: {
        status: "REJECTED",
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Rejected ${updatedQuestions.count} questions`
    });
  } catch (error) {
    console.error("Batch reject error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to reject questions", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

async function handleGetStats() {
  try {
    // Get total questions count
    const totalQuestions = await prisma.question.count();
    
    // Get counts by status
    const statusCounts = await prisma.question.groupBy({
      by: ['status'],
      _count: {
        _all: true
      }
    });
    
    // Get counts by subject
    const subjectCounts = await prisma.question.groupBy({
      by: ['subject'],
      _count: {
        _all: true
      }
    });
    
    // Get counts by difficulty
    const difficultyCounts = await prisma.question.groupBy({
      by: ['difficulty'],
      _count: {
        _all: true
      }
    });
    
    // Get recent usage stats (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const usageStats = await prisma.userQuestionHistory.groupBy({
      by: ['usedAt'],
      _count: {
        _all: true
      },
      where: {
        usedAt: {
          gte: sevenDaysAgo
        }
      }
    });
    
    // Format usage stats by date
    const formattedUsageStats = usageStats.map(stat => ({
      date: stat.usedAt.toISOString().split('T')[0],
      count: stat._count._all
    }));

    return NextResponse.json({
      success: true,
      stats: {
        totalQuestions,
        statusCounts,
        subjectCounts,
        difficultyCounts,
        usageStats: formattedUsageStats
      }
    });
  } catch (error) {
    console.error("Get stats error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to get stats", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}