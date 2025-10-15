import { prisma, executeWithRetry } from "@/lib/prisma";
import { ActivityType, AchievementCategory } from "@/generated/prisma";
import { Logger } from "@/lib/logger";

export class StudentAnalytics {
  
  static async trackActivity(
    userId: string, 
    type: ActivityType, 
    options: {
      subject?: string;
      topic?: string;
      duration?: number;
      score?: number;
      metadata?: any;
    } = {}
  ) {
    try {
      // Create the activity with retry logic
      const activity = await executeWithRetry(async () => 
        prisma.studentActivity.create({
          data: {
            userId,
            type,
            subject: options.subject,
            topic: options.topic,
            duration: options.duration,
            score: options.score,
            metadata: options.metadata
          }
        })
      );

      // Update learning streak
      await this.updateLearningStreak(userId);

      // Check for achievements
      await this.checkAchievements(userId, type, options);

      return activity;
    } catch (error) {
      Logger.error("Error tracking student activity", error as Error, { userId, type, options });
      throw error;
    }
  }

  static async updateLearningStreak(userId: string) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Check if user had activity today with retry
      const todayActivity = await executeWithRetry(async () =>
        prisma.studentActivity.findFirst({
          where: {
            userId,
            createdAt: { gte: today }
          }
        })
      );

      if (!todayActivity) return; // No activity today, don't update streak

      // Get or create streak record with retry
      let streak = await executeWithRetry(async () =>
        prisma.learningStreak.findUnique({
          where: { userId }
        })
      );

      if (!streak) {
        // Create new streak with retry
        streak = await executeWithRetry(async () =>
          prisma.learningStreak.create({
            data: {
              userId,
              currentStreak: 1,
              longestStreak: 1,
              lastActivity: new Date()
            }
          })
        );
        return;
      }

      // Check if last activity was yesterday (consecutive day)
      const lastActivityDate = new Date(streak.lastActivity);
      lastActivityDate.setHours(0, 0, 0, 0);

      if (lastActivityDate.getTime() === yesterday.getTime()) {
        // Consecutive day - increment streak
        const newStreak = streak.currentStreak + 1;
        await executeWithRetry(async () =>
          prisma.learningStreak.update({
            where: { userId },
            data: {
              currentStreak: newStreak,
              longestStreak: Math.max(newStreak, streak.longestStreak),
              lastActivity: new Date()
            }
          })
        );
      } else if (lastActivityDate.getTime() !== today.getTime()) {
        // Gap in activity - reset streak
        await executeWithRetry(async () =>
          prisma.learningStreak.update({
            where: { userId },
            data: {
              currentStreak: 1,
              lastActivity: new Date()
            }
          })
        );
      }
      // If lastActivityDate === today, streak was already updated today
    } catch (error) {
      Logger.error("Error updating learning streak", error as Error, { userId });
      // Don't throw - let the main operation continue
    }
  }

  static async checkAchievements(
    userId: string, 
    activityType: ActivityType, 
    options: any
  ) {
    try {
      // Get user's current stats
      const stats = await this.getUserStats(userId);

      // Define achievement checks
      const achievementChecks = [
        {
          id: 'first-chat',
          title: 'First Question',
          description: 'Asked your first question!',
          icon: '💬',
          category: AchievementCategory.MILESTONE,
          condition: activityType === ActivityType.CHAT_MESSAGE && stats.totalActivities === 1
        },
        {
          id: 'problem-solver',
          title: 'Problem Solver',
          description: 'Solved 10 problems',
          icon: '🧠',
          category: AchievementCategory.PROBLEM_SOLVING,
          condition: stats.problemsSolved >= 10
        },
        {
          id: 'week-warrior',
          title: 'Week Warrior',
          description: 'Maintained a 7-day learning streak',
          icon: '🔥',
          category: AchievementCategory.STREAK,
          condition: stats.currentStreak >= 7
        },
        {
          id: 'dedicated-learner',
          title: 'Dedicated Learner',
          description: 'Completed 50 learning activities',
          icon: '📚',
          category: AchievementCategory.ENGAGEMENT,
          condition: stats.totalActivities >= 50
        }
      ];

      // Check and award achievements
      for (const check of achievementChecks) {
        if (check.condition) {
          await this.awardAchievement(userId, check);
        }
      }
    } catch (error) {
      Logger.error("Error checking achievements", error as Error, { userId, activityType, options });
    }
  }

  static async awardAchievement(userId: string, achievement: any) {
    try {
      // Check if achievement already exists
      const existing = await prisma.achievement.findFirst({
        where: {
          userId,
          title: achievement.title
        }
      });

      if (!existing) {
        await prisma.achievement.create({
          data: {
            userId,
            title: achievement.title,
            description: achievement.description,
            icon: achievement.icon,
            category: achievement.category,
            progress: 100,
            completed: true
          }
        });

      }
    } catch (error) {
      Logger.error("Error awarding achievement", error as Error, { userId, achievement });
    }
  }

  static async getUserStats(userId: string) {
    try {
      const [activities, streak, achievements, problemsSolved] = await Promise.all([
        executeWithRetry(async () => 
          prisma.studentActivity.count({ where: { userId } })
        ),
        executeWithRetry(async () => 
          prisma.learningStreak.findUnique({ where: { userId } })
        ),
        executeWithRetry(async () => 
          prisma.achievement.count({ where: { userId } })
        ),
        executeWithRetry(async () => 
          prisma.studentActivity.count({
            where: { 
              userId,
              type: ActivityType.PROBLEM_SOLVED
            }
          })
        )
      ]);

      return {
        totalActivities: activities,
        currentStreak: streak?.currentStreak || 0,
        longestStreak: streak?.longestStreak || 0,
        achievements: achievements,
        problemsSolved: problemsSolved
      };
    } catch (error) {
      Logger.error("Error getting user stats", error as Error, { userId });
      return {
        totalActivities: 0,
        currentStreak: 0,
        longestStreak: 0,
        achievements: 0,
        problemsSolved: 0
      };
    }
  }

  static async getLeaderboard(limit: number = 10) {
    try {
      const leaderboard = await executeWithRetry(async () => 
        prisma.learningStreak.findMany({
          take: limit,
          orderBy: { currentStreak: 'desc' },
          include: {
            user: {
              select: {
                name: true,
                image: true
              }
            }
          }
        })
      );

      return leaderboard.map(streak => ({
        userId: streak.userId,
        userName: streak.user?.name || 'Anonymous',
        userImage: streak.user?.image,
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak
      }));
    } catch (error) {
      Logger.error("Error getting leaderboard", error as Error, { limit });
      return [];
    }
  }
}