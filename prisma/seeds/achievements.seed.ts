import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedAchievements() {
  console.log('🏆 Seeding achievements...');

  const achievements = [
    // Profile Completion Achievements
    {
      title: 'Getting Started',
      description: 'Complete your basic profile information',
      category: 'PROFILE_COMPLETION',
      icon: '👤',
      points: 50,
      rarity: 'COMMON',
      requirement: 'Complete basic profile information',
      conditions: { profileCompletion: 25 },
      order: 1,
    },
    {
      title: 'Profile Pro',
      description: 'Complete 75% of your profile',
      category: 'PROFILE_COMPLETION',
      icon: '⭐',
      points: 100,
      rarity: 'UNCOMMON',
      requirement: 'Complete 75% of your profile',
      conditions: { profileCompletion: 75 },
      order: 2,
    },
    {
      title: 'Profile Master',
      description: 'Complete 100% of your profile',
      category: 'PROFILE_COMPLETION',
      icon: '🌟',
      points: 200,
      rarity: 'RARE',
      requirement: 'Complete 100% of your profile',
      conditions: { profileCompletion: 100 },
      order: 3,
    },

    // Job Application Achievements
    {
      title: 'First Step',
      description: 'Apply to your first job',
      category: 'JOB_APPLICATIONS',
      icon: '📝',
      points: 75,
      rarity: 'COMMON',
      requirement: 'Apply to 1 job',
      conditions: { targetCount: 1 },
      order: 1,
    },
    {
      title: 'Job Hunter',
      description: 'Apply to 5 jobs',
      category: 'JOB_APPLICATIONS',
      icon: '🎯',
      points: 150,
      rarity: 'UNCOMMON',
      requirement: 'Apply to 5 jobs',
      conditions: { targetCount: 5 },
      order: 2,
    },
    {
      title: 'Application Expert',
      description: 'Apply to 25 jobs',
      category: 'JOB_APPLICATIONS',
      icon: '🚀',
      points: 500,
      rarity: 'RARE',
      requirement: 'Apply to 25 jobs',
      conditions: { targetCount: 25 },
      order: 3,
    },

    // Networking Achievements
    {
      title: 'Social Butterfly',
      description: 'Connect with 5 professionals',
      category: 'NETWORKING',
      icon: '🤝',
      points: 100,
      rarity: 'COMMON',
      requirement: 'Make 5 professional connections',
      conditions: { targetCount: 5 },
      order: 1,
    },
    {
      title: 'Network Builder',
      description: 'Connect with 25 professionals',
      category: 'NETWORKING',
      icon: '🌐',
      points: 300,
      rarity: 'UNCOMMON',
      requirement: 'Make 25 professional connections',
      conditions: { targetCount: 25 },
      order: 2,
    },

    // Event Participation Achievements
    {
      title: 'Event Explorer',
      description: 'Attend your first career event',
      category: 'EVENT_PARTICIPATION',
      icon: '🎪',
      points: 100,
      rarity: 'COMMON',
      requirement: 'Attend 1 career event',
      conditions: { targetCount: 1 },
      order: 1,
    },
    {
      title: 'Event Enthusiast',
      description: 'Attend 5 career events',
      category: 'EVENT_PARTICIPATION',
      icon: '🎉',
      points: 250,
      rarity: 'UNCOMMON',
      requirement: 'Attend 5 career events',
      conditions: { targetCount: 5 },
      order: 2,
    },
    {
      title: 'Event Champion',
      description: 'Attend 15 career events',
      category: 'EVENT_PARTICIPATION',
      icon: '🏆',
      points: 750,
      rarity: 'RARE',
      requirement: 'Attend 15 career events',
      conditions: { targetCount: 15 },
      order: 3,
    },

    // Skill Development Achievements
    {
      title: 'Skill Builder',
      description: 'Add 5 skills to your profile',
      category: 'SKILL_DEVELOPMENT',
      icon: '🛠️',
      points: 100,
      rarity: 'COMMON',
      requirement: 'Add 5 skills to your profile',
      conditions: { targetCount: 5 },
      order: 1,
    },
    {
      title: 'Skill Master',
      description: 'Add 15 skills to your profile',
      category: 'SKILL_DEVELOPMENT',
      icon: '⚡',
      points: 300,
      rarity: 'UNCOMMON',
      requirement: 'Add 15 skills to your profile',
      conditions: { targetCount: 15 },
      order: 2,
    },

    // Mentorship Achievements
    {
      title: 'Mentorship Seeker',
      description: 'Request your first mentor',
      category: 'MENTORSHIP',
      icon: '🎓',
      points: 150,
      rarity: 'COMMON',
      requirement: 'Request your first mentor',
      conditions: { targetCount: 1 },
      order: 1,
    },
    {
      title: 'Mentorship Graduate',
      description: 'Complete a mentorship program',
      category: 'MENTORSHIP',
      icon: '🎖️',
      points: 500,
      rarity: 'RARE',
      requirement: 'Complete a mentorship program',
      conditions: { targetCount: 1 },
      order: 2,
    },

    // Career Milestones
    {
      title: 'Interview Ready',
      description: 'Get your first interview invitation',
      category: 'CAREER_MILESTONES',
      icon: '💼',
      points: 200,
      rarity: 'UNCOMMON',
      requirement: 'Get invited to an interview',
      conditions: { targetCount: 1 },
      order: 1,
    },
    {
      title: 'Job Offer Champion',
      description: 'Receive your first job offer',
      category: 'CAREER_MILESTONES',
      icon: '🎊',
      points: 1000,
      rarity: 'EPIC',
      requirement: 'Receive a job offer',
      conditions: { targetCount: 1 },
      order: 2,
    },

    // Special Achievements
    {
      title: 'Early Bird',
      description: 'Join Career Bridge AI in its first year',
      category: 'SPECIAL_EVENTS',
      icon: '🐦',
      points: 500,
      rarity: 'LEGENDARY',
      requirement: 'Join during the first year of operation',
      conditions: { specialEvent: 'early_adopter' },
      order: 1,
      isHidden: true,
    },
    {
      title: 'Community Champion',
      description: 'Help 10 other students with career advice',
      category: 'COMMUNITY_ENGAGEMENT',
      icon: '🤗',
      points: 750,
      rarity: 'EPIC',
      requirement: 'Help 10 students with career advice',
      conditions: { targetCount: 10 },
      order: 1,
    },
  ];

  for (const achievement of achievements) {
    const existing = await prisma.achievement.findFirst({
      where: { title: achievement.title },
    });

    if (!existing) {
      await prisma.achievement.create({
        data: achievement as any,
      });
    }
  }

  console.log(`✅ Seeded ${achievements.length} achievements`);
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedAchievements()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
