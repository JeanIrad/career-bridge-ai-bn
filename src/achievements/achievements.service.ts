import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AchievementCategory, AchievementRarity } from '@prisma/client';

export interface CreateAchievementDto {
  title: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  points: number;
  rarity: AchievementRarity;
  requirement?: string;
  conditions?: any;
  isHidden?: boolean;
  order?: number;
}

export interface AchievementStats {
  totalPoints: number;
  achievementsEarned: number;
  completionRate: number;
  currentStreak: number;
  level: number;
  levelTitle: string;
  progressToNextLevel: number;
  xpToNextLevel: number;
}

export interface LeaderboardEntry {
  userId: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  totalPoints: number;
  achievementsEarned: number;
  level: number;
  rank: number;
}

@Injectable()
export class AchievementsService {
  constructor(private prisma: PrismaService) {}

  // Create a new achievement (admin only)
  async createAchievement(data: CreateAchievementDto) {
    return this.prisma.achievement.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        icon: data.icon,
        points: data.points,
        rarity: data.rarity,
        requirement: data.requirement,
        conditions: data.conditions,
        isHidden: data.isHidden || false,
        order: data.order || 0,
      },
    });
  }

  // Get all achievements
  async getAllAchievements(includeHidden = false) {
    return this.prisma.achievement.findMany({
      where: includeHidden ? {} : { isHidden: false, isActive: true },
      orderBy: [{ category: 'asc' }, { order: 'asc' }, { createdAt: 'asc' }],
    });
  }

  // Get user's achievements with progress
  async getUserAchievements(userId: string) {
    const achievements = await this.prisma.achievement.findMany({
      where: { isActive: true },
      include: {
        userAchievements: {
          where: { userId },
        },
      },
      orderBy: [{ category: 'asc' }, { order: 'asc' }],
    });

    return achievements.map((achievement) => {
      const userAchievement = achievement.userAchievements[0];
      return {
        id: achievement.id,
        title: achievement.title,
        description: achievement.description,
        category: achievement.category,
        icon: achievement.icon,
        points: achievement.points,
        rarity: achievement.rarity,
        requirement: achievement.requirement,
        earned: userAchievement?.isEarned || false,
        earnedDate: userAchievement?.earnedAt?.toISOString(),
        progress: userAchievement?.progress || 0,
        isHidden: achievement.isHidden,
      };
    });
  }

  // Get user achievement statistics
  async getUserAchievementStats(userId: string): Promise<AchievementStats> {
    const [userAchievements, totalAchievements] = await Promise.all([
      this.prisma.userAchievement.findMany({
        where: { userId },
        include: { achievement: true },
      }),
      this.prisma.achievement.count({
        where: { isActive: true, isHidden: false },
      }),
    ]);

    const earnedAchievements = userAchievements.filter((ua) => ua.isEarned);
    const totalPoints = earnedAchievements.reduce(
      (sum, ua) => sum + ua.achievement.points,
      0,
    );

    const completionRate =
      totalAchievements > 0
        ? Math.round((earnedAchievements.length / totalAchievements) * 100)
        : 0;

    // Calculate level based on points (every 1000 points = 1 level)
    const level = Math.floor(totalPoints / 1000) + 1;
    const progressToNextLevel = totalPoints % 1000;
    const xpToNextLevel = 1000 - progressToNextLevel;

    // Calculate streak (consecutive days with achievements earned)
    const currentStreak = 0; // Mock for now

    // Determine level title
    const levelTitle = this.getLevelTitle(level);

    return {
      totalPoints,
      achievementsEarned: earnedAchievements.length,
      completionRate,
      currentStreak,
      level,
      levelTitle,
      progressToNextLevel,
      xpToNextLevel,
    };
  }

  // Get achievements leaderboard
  async getLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
    const userStats = await this.prisma.user.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
        userAchievements: {
          where: { isEarned: true },
          include: { achievement: true },
        },
      },
    });

    const leaderboard = userStats
      .map((user) => {
        const totalPoints = user.userAchievements.reduce(
          (sum, ua) => sum + ua.achievement.points,
          0,
        );
        const level = Math.floor(totalPoints / 1000) + 1;

        return {
          userId: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar || undefined,
          totalPoints,
          achievementsEarned: user.userAchievements.length,
          level,
          rank: 0,
        };
      })
      .filter((entry) => entry.totalPoints > 0)
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, limit)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    return leaderboard;
  }

  // Award achievement to user
  async awardAchievement(userId: string, achievementId: string) {
    const achievement = await this.prisma.achievement.findUnique({
      where: { id: achievementId },
    });

    if (!achievement) {
      throw new NotFoundException('Achievement not found');
    }

    // Check if user already has this achievement
    const existingUserAchievement =
      await this.prisma.userAchievement.findUnique({
        where: {
          userId_achievementId: { userId, achievementId },
        },
      });

    if (existingUserAchievement?.isEarned) {
      return existingUserAchievement;
    }

    // Award the achievement
    const userAchievement = await this.prisma.userAchievement.upsert({
      where: {
        userId_achievementId: { userId, achievementId },
      },
      update: {
        isEarned: true,
        earnedAt: new Date(),
        progress: 100,
      },
      create: {
        userId,
        achievementId,
        isEarned: true,
        earnedAt: new Date(),
        progress: 100,
      },
      include: { achievement: true },
    });

    // Update achievement total earned count
    await this.prisma.achievement.update({
      where: { id: achievementId },
      data: { totalEarned: { increment: 1 } },
    });

    return userAchievement;
  }

  async createTestAchievement(userId: string) {
    const categories = [
      AchievementCategory.PROFILE_COMPLETION,
      AchievementCategory.JOB_APPLICATIONS,
      AchievementCategory.NETWORKING,
      AchievementCategory.EVENT_PARTICIPATION,
      AchievementCategory.SKILL_DEVELOPMENT,
      AchievementCategory.MENTORSHIP,
      AchievementCategory.CAREER_MILESTONES,
      AchievementCategory.SPECIAL_EVENTS,
    ];
    const rarities = [
      AchievementRarity.COMMON,
      AchievementRarity.UNCOMMON,
      AchievementRarity.RARE,
      AchievementRarity.EPIC,
      AchievementRarity.LEGENDARY,
    ];
    const icons = [
      'BookOpen',
      'TrendingUp',
      'Users',
      'Calendar',
      'Target',
      'Award',
    ];

    const randomCategory =
      categories[Math.floor(Math.random() * categories.length)];
    const randomRarity = rarities[Math.floor(Math.random() * rarities.length)];
    const randomIcon = icons[Math.floor(Math.random() * icons.length)];
    const points = Math.floor(Math.random() * 100) + 50;

    const achievement = await this.prisma.achievement.create({
      data: {
        title: `Test Achievement ${Date.now()}`,
        description:
          'This is a test achievement created for development purposes',
        category: randomCategory,
        rarity: randomRarity,
        icon: randomIcon,
        points: points,
        requirement: 'Test requirement',
        userAchievements: {
          create: {
            userId: userId,
            earnedAt: new Date(),
            progress: 100,
          },
        },
      },
      include: {
        userAchievements: true,
      },
    });

    return achievement;
  }

  private getLevelTitle(level: number): string {
    if (level >= 50) return 'Career Legend';
    if (level >= 25) return 'Career Expert';
    if (level >= 15) return 'Career Professional';
    if (level >= 10) return 'Career Specialist';
    if (level >= 5) return 'Career Enthusiast';
    return 'Career Beginner';
  }
}
