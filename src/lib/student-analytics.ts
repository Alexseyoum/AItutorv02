import { prisma } from "@/lib/prisma";
import { ActivityType, AchievementCategory } from "@/generated/prisma";

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
      // Create the activity
      const activity = await prisma.studentActivity.create({
        data: {
          userId,
          type,
          subject: options.subject,
          topic: options.topic,
          duration: options.duration,
          score: options.score,
          metadata: options.metadata
        }
      });

      // Update learning streak
      await this.updateLearningStreak(userId);

      // Check for achievements
      await this.checkAchievements(userId, type, options);

      return activity;
    } catch (error) {
      console.error("Error tracking student activity:", error);
      throw error;
    }
  }

  static async updateLearningStreak(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Check if user had activity today
    const todayActivity = await prisma.studentActivity.findFirst({
      where: {
        userId,
        createdAt: { gte: today }
      }
    });

    if (!todayActivity) return; // No activity today, don't update streak

    // Get or create streak record
    let streak = await prisma.learningStreak.findUnique({
      where: { userId }
    });

    if (!streak) {
      // Create new streak
      streak = await prisma.learningStreak.create({
        data: {
          userId,
          currentStreak: 1,
          longestStreak: 1,
          lastActivity: new Date()
        }
      });
      return;
    }

    // Check if last activity was yesterday (consecutive day)
    const lastActivityDate = new Date(streak.lastActivity);
    lastActivityDate.setHours(0, 0, 0, 0);

    if (lastActivityDate.getTime() === yesterday.getTime()) {
      // Consecutive day - increment streak
      const newStreak = streak.currentStreak + 1;
      await prisma.learningStreak.update({
        where: { userId },
        data: {
          currentStreak: newStreak,
          longestStreak: Math.max(newStreak, streak.longestStreak),
          lastActivity: new Date()
        }
      });
    } else if (lastActivityDate.getTime() !== today.getTime()) {
      // Gap in activity - reset streak
      await prisma.learningStreak.update({
        where: { userId },
        data: {
          currentStreak: 1,
          lastActivity: new Date()
        }
      });
    }
    // If lastActivityDate === today, streak was already updated today
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
      console.error("Error checking achievements:", error);
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
        
        console.log(`Achievement awarded: ${achievement.title} to user ${userId}`);
      }
    } catch (error) {
      console.error("Error awarding achievement:", error);
    }
  }

  static async getUserStats(userId: string) {
    const [totalActivities, problemsSolved, streak] = await Promise.all([
      prisma.studentActivity.count({ where: { userId } }),
      prisma.studentActivity.count({ 
        where: { userId, type: ActivityType.PROBLEM_SOLVED } 
      }),
      prisma.learningStreak.findUnique({ where: { userId } })
    ]);

    return {
      totalActivities,
      problemsSolved,
      currentStreak: streak?.currentStreak || 0
    };
  }
}