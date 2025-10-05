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
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Parallel queries for efficiency
    const [
      totalActivities,
      weeklyActivities,
      monthlyActivities,
      streak,
      problemsSolved,
      totalStudyTime,
      weeklyStudyTime,
      completedAchievements,
      recentActivities
    ] = await Promise.all([
      // Total activities count
      prisma.studentActivity.count({
        where: { userId }
      }),
      
      // Weekly activities count
      prisma.studentActivity.count({
        where: { 
          userId,
          createdAt: { gte: startOfWeek }
        }
      }),
      
      // Monthly activities count
      prisma.studentActivity.count({
        where: { 
          userId,
          createdAt: { gte: startOfMonth }
        }
      }),
      
      // Learning streak
      prisma.learningStreak.findUnique({
        where: { userId }
      }),
      
      // Problems solved
      prisma.studentActivity.count({
        where: { 
          userId,
          type: 'PROBLEM_SOLVED'
        }
      }),
      
      // Total study time
      prisma.studentActivity.aggregate({
        where: { 
          userId,
          duration: { not: null }
        },
        _sum: { duration: true }
      }),
      
      // Weekly study time
      prisma.studentActivity.aggregate({
        where: { 
          userId,
          duration: { not: null },
          createdAt: { gte: startOfWeek }
        },
        _sum: { duration: true }
      }),
      
      // Completed achievements
      prisma.achievement.count({
        where: { 
          userId,
          completed: true
        }
      }),
      
      // Recent activities for "Last Session" display
      prisma.studentActivity.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          type: true,
          subject: true,
          topic: true,
          createdAt: true,
          duration: true
        }
      })
    ]);

    // Calculate weekly progress (percentage towards weekly goal)
    const weeklyGoal = 7; // 7 activities per week as goal
    const weeklyProgress = Math.min((weeklyActivities / weeklyGoal) * 100, 100);

    // Get most recent session info
    const lastSession = recentActivities.find(activity => 
      activity.type === 'TOPIC_STUDIED' || activity.type === 'SESSION_COMPLETED'
    );

    const stats = {
      // Current streak
      currentStreak: streak?.currentStreak || 0,
      longestStreak: streak?.longestStreak || 0,
      
      // Weekly progress
      weeklyProgress: Math.round(weeklyProgress),
      weeklyActivities,
      weeklyStudyTime: weeklyStudyTime._sum?.duration || 0,
      
      // Overall stats
      totalActivities,
      monthlyActivities,
      problemsSolved,
      totalStudyTime: totalStudyTime._sum?.duration || 0,
      completedAchievements,
      
      // Last session
      lastSession: lastSession ? {
        topic: lastSession.topic || lastSession.subject || 'General Study',
        date: lastSession.createdAt,
        duration: lastSession.duration,
        progress: Math.floor(Math.random() * 30) + 60 // Mock progress for now
      } : null,
      
      // Engagement metrics
      dailyAverage: Math.round(totalActivities / Math.max(1, 
        Math.ceil((new Date().getTime() - new Date(session.user.createdAt || new Date()).getTime()) / (1000 * 3600 * 24))
      )),
      
      // Subject breakdown (top 3)
      subjectBreakdown: await getSubjectBreakdown(userId)
    };

    return NextResponse.json({ stats });

  } catch (error) {
    console.error("Student stats API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch student stats" },
      { status: 500 }
    );
  }
}

async function getSubjectBreakdown(userId: string) {
  const activities = await prisma.studentActivity.groupBy({
    by: ['subject'],
    where: { 
      userId,
      subject: { not: null }
    },
    _count: { subject: true },
    orderBy: { _count: { subject: 'desc' } },
    take: 3
  });

  return activities.map(activity => ({
    subject: activity.subject,
    count: activity._count.subject
  }));
}