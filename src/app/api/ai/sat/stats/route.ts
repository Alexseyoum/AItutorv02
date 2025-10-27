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

    const userId = session.user.id;

    // Get current date for calculations
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Parallel queries for efficiency
    const [
      practiceSessions,
      diagnosticResults,
      studyPlans,
      totalStudyTime,
      weeklyStudyTime,
      subjectPerformance,
      weeklyProgress
    ] = await Promise.all([
      // Get all practice sessions
      prisma.sATPracticeSession.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      }),
      
      // Get diagnostic results
      prisma.sATDiagnosticResult.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      }),
      
      // Get study plans
      prisma.sATStudyPlan.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      }),
      
      // Total SAT study time
      prisma.sATPracticeSession.aggregate({
        where: { 
          userId,
          timeSpent: { not: null }
        },
        _sum: { timeSpent: true }
      }),
      
      // Weekly SAT study time
      prisma.sATPracticeSession.aggregate({
        where: { 
          userId,
          timeSpent: { not: null },
          createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
        },
        _sum: { timeSpent: true }
      }),
      
      // Subject performance breakdown
      prisma.sATPracticeSession.groupBy({
        by: ['section'],
        where: { 
          userId,
          score: { not: null },
          maxScore: { not: null }
        },
        _avg: { 
          score: true,
          maxScore: true
        },
        _count: true
      }),
      
      // Weekly progress (sessions per week for last 4 weeks)
      prisma.sATPracticeSession.groupBy({
        by: ['section'],
        where: { 
          userId,
          createdAt: { gte: thirtyDaysAgo }
        },
        _count: true
      })
    ]);

    // Calculate key metrics
    const totalSessions = practiceSessions.length;
    const completedSessions = practiceSessions.filter((s: { completedAt: Date | null }) => s.completedAt).length;
    const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
    
    // Calculate average scores by section
    const performanceBySection = subjectPerformance.map((section: { 
      section: string; 
      _avg: { 
        score: number | null; 
        maxScore: number | null 
      }; 
      _count: number 
    }) => ({
      section: section.section,
      averageScore: section._avg.score ? Math.round(section._avg.score) : 0,
      maxScore: section._avg.maxScore ? Math.round(section._avg.maxScore) : 0,
      percentage: section._avg.score && section._avg.maxScore ? 
        Math.round((section._avg.score / section._avg.maxScore) * 100) : 0,
      sessionCount: section._count
    }));
    
    // Calculate weekly activity
    const weeklyActivity = weeklyProgress.map((section: { 
      section: string; 
      _count: number 
    }) => ({
      section: section.section,
      sessions: section._count
    }));
    
    // Get most recent diagnostic result
    const latestDiagnostic = diagnosticResults.length > 0 ? diagnosticResults[0] : null;
    
    // Calculate score improvement if we have multiple diagnostics
    let scoreImprovement = null;
    if (diagnosticResults.length >= 2) {
      const recent = diagnosticResults[0];
      const previous = diagnosticResults[1];
      const recentTotal = recent.totalScore || 0;
      const previousTotal = previous.totalScore || 0;
      scoreImprovement = recentTotal - previousTotal;
    }
    
    // Get study plan progress
    let studyPlanProgress = 0;
    if (studyPlans.length > 0) {
      const latestPlan = studyPlans[0];
      // Type assertion to tell TypeScript that aiGeneratedPlan is an object with weeks property
      const aiPlan = latestPlan.aiGeneratedPlan as { weeks?: unknown[] } | null;
      if (aiPlan && aiPlan.weeks) {
        const totalWeeks = aiPlan.weeks.length;
        const completedWeeks = latestPlan.completedWeeks?.length || 0;
        studyPlanProgress = totalWeeks > 0 ? Math.round((completedWeeks / totalWeeks) * 100) : 0;
      }
    }
    
    // Get last session info
    const lastSession = practiceSessions.length > 0 ? practiceSessions[0] : null;
    
    const stats = {
      // Overall SAT engagement
      totalSessions,
      completedSessions,
      completionRate,
      studyPlanProgress,
      
      // Time spent
      totalStudyTime: totalStudyTime._sum?.timeSpent || 0,
      weeklyStudyTime: weeklyStudyTime._sum?.timeSpent || 0,
      
      // Performance metrics
      performanceBySection,
      latestDiagnostic,
      scoreImprovement,
      
      // Activity trends
      weeklyActivity,
      
      // Last session
      lastSession: lastSession ? {
        section: lastSession.section,
        date: lastSession.createdAt,
        score: lastSession.score,
        maxScore: lastSession.maxScore,
        timeSpent: lastSession.timeSpent,
        completed: !!lastSession.completedAt
      } : null
    };

    return NextResponse.json({ stats });

  } catch (error: any) {
    console.error("SAT stats API error:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Return more detailed error information in development
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json(
        { 
          error: "Failed to fetch SAT statistics", 
          details: error.message,
          stack: error.stack
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to fetch SAT statistics" },
      { status: 500 }
    );
  }
}