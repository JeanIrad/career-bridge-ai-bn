import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { UserProfile } from '../ai/ai.service';

export interface SkillGap {
  skill: string;
  currentLevel: number; // 0-10 scale
  requiredLevel: number; // 0-10 scale
  importance: number; // 0-10 scale
  marketDemand: 'high' | 'medium' | 'low';
  timeToLearn: string; // estimated time
  resources: LearningResource[];
}

export interface LearningResource {
  type: 'course' | 'certification' | 'book' | 'practice' | 'project';
  title: string;
  provider: string;
  url?: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  cost: number;
  rating: number;
  relevanceScore: number;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  targetRole: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  steps: LearningStep[];
  prerequisites: string[];
  outcomes: string[];
  marketValue: number;
}

export interface LearningStep {
  order: number;
  title: string;
  description: string;
  skills: string[];
  resources: LearningResource[];
  estimatedTime: string;
  isCompleted: boolean;
}

export interface PersonalizedLearningPlan {
  userId: string;
  careerGoal: string;
  currentLevel: string;
  targetLevel: string;
  timeframe: string;
  skillGaps: SkillGap[];
  recommendedPaths: LearningPath[];
  prioritySkills: string[];
  weeklyPlan: WeeklyLearningPlan[];
  milestones: LearningMilestone[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WeeklyLearningPlan {
  week: number;
  focus: string;
  goals: string[];
  activities: {
    day: string;
    activity: string;
    duration: string;
    resources: LearningResource[];
  }[];
  assessment: string;
}

export interface LearningMilestone {
  title: string;
  description: string;
  targetDate: Date;
  skills: string[];
  assessmentCriteria: string[];
  isCompleted: boolean;
  completedDate?: Date;
}

@Injectable()
export class LearningRecommendationService {
  private readonly logger = new Logger(LearningRecommendationService.name);
  private readonly CACHE_TTL = 7200; // 2 hours

  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  /**
   * Generate personalized learning plan based on career goals
   */
  async generatePersonalizedLearningPlan(
    userId: string,
    careerGoal: string,
    timeframe: string = '6 months',
  ): Promise<PersonalizedLearningPlan> {
    try {
      const cacheKey = `learning_plan:${userId}:${careerGoal}:${timeframe}`;
      const cached = await this.cacheService.get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      const userProfile = await this.buildUserProfile(userId);
      if (!userProfile) {
        throw new Error('User profile not found');
      }

      // Analyze skill gaps
      const skillGaps = await this.analyzeSkillGaps(userProfile, careerGoal);

      // Generate learning paths
      const recommendedPaths = await this.generateLearningPaths(
        skillGaps,
        careerGoal,
      );

      // Create weekly plan
      const weeklyPlan = this.createWeeklyLearningPlan(skillGaps, timeframe);

      // Set milestones
      const milestones = this.createLearningMilestones(skillGaps, timeframe);

      // Prioritize skills based on market demand and career relevance
      const prioritySkills = this.prioritizeSkills(skillGaps);

      const learningPlan: PersonalizedLearningPlan = {
        userId,
        careerGoal,
        currentLevel: this.inferCurrentLevel(userProfile),
        targetLevel: this.inferTargetLevel(careerGoal),
        timeframe,
        skillGaps,
        recommendedPaths,
        prioritySkills,
        weeklyPlan,
        milestones,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.cacheService.set(
        cacheKey,
        JSON.stringify(learningPlan),
        this.CACHE_TTL,
      );

      return learningPlan;
    } catch (error) {
      this.logger.error('Error generating personalized learning plan:', error);
      throw error;
    }
  }

  /**
   * Get skill gap analysis for current market demands
   */
  async getSkillGapAnalysis(userId: string): Promise<{
    skillGaps: SkillGap[];
    marketInsights: {
      trendingSkills: string[];
      decliningSkills: string[];
      emergingSkills: string[];
      highDemandSkills: string[];
    };
    recommendations: string[];
  }> {
    try {
      const cacheKey = `skill_gaps:${userId}`;
      const cached = await this.cacheService.get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      const userProfile = await this.buildUserProfile(userId);
      if (!userProfile) {
        throw new Error('User profile not found');
      }

      // Get current market skill demands
      const marketSkills = await this.getMarketSkillDemands();

      // Analyze user's skill gaps
      const skillGaps = await this.analyzeUserSkillGaps(
        userProfile,
        marketSkills,
      );

      // Get market insights
      const marketInsights = await this.getMarketInsights();

      // Generate personalized recommendations
      const recommendations = this.generateSkillRecommendations(
        skillGaps,
        marketInsights,
      );

      const result = {
        skillGaps,
        marketInsights,
        recommendations,
      };

      await this.cacheService.set(
        cacheKey,
        JSON.stringify(result),
        this.CACHE_TTL,
      );

      return result;
    } catch (error) {
      this.logger.error('Error analyzing skill gaps:', error);
      throw error;
    }
  }

  /**
   * Get learning resources for specific skills
   */
  async getLearningResources(
    skills: string[],
    difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate',
    budget?: number,
  ): Promise<{ [skill: string]: LearningResource[] }> {
    try {
      const cacheKey = `learning_resources:${skills.join(',')}:${difficulty}:${budget || 'any'}`;
      const cached = await this.cacheService.get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      const resourcesMap: { [skill: string]: LearningResource[] } = {};

      for (const skill of skills) {
        resourcesMap[skill] = await this.findLearningResourcesForSkill(
          skill,
          difficulty,
          budget,
        );
      }

      await this.cacheService.set(
        cacheKey,
        JSON.stringify(resourcesMap),
        this.CACHE_TTL,
      );

      return resourcesMap;
    } catch (error) {
      this.logger.error('Error getting learning resources:', error);
      throw error;
    }
  }

  /**
   * Track learning progress and update recommendations
   */
  async updateLearningProgress(
    userId: string,
    skillProgress: {
      skill: string;
      newLevel: number;
      completedResources: string[];
    }[],
  ): Promise<void> {
    try {
      // Update user skill levels
      for (const progress of skillProgress) {
        await this.updateUserSkillLevel(
          userId,
          progress.skill,
          progress.newLevel,
        );
      }

      // Clear relevant caches to refresh recommendations
      await this.clearUserLearningCache(userId);

      this.logger.log(`Updated learning progress for user ${userId}`);
    } catch (error) {
      this.logger.error('Error updating learning progress:', error);
      throw error;
    }
  }

  // Private helper methods

  private async buildUserProfile(userId: string): Promise<UserProfile | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        skills: true,
        education: true,
        experiences: true,
      },
    });

    if (!user) return null;

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      university: user.university ?? undefined,
      major: user.major ?? undefined,
      graduationYear: user.graduationYear ?? undefined,
      gpa: user.gpa ?? undefined,
      bio: user.bio ?? undefined,
      headline: user.headline ?? undefined,
      location: {
        city: user.city ?? undefined,
        state: user.state ?? undefined,
        country: user.country ?? undefined,
      },
      skills: user.skills.map((skill) => ({
        name: skill.name,
        endorsements: skill.endorsements || 0,
      })),
      education: user.education.map((edu) => ({
        institution: edu.institution,
        degree: edu.degree,
        field: edu.field,
        grade: edu.grade ?? undefined,
        startDate: edu.startDate,
        endDate: edu.endDate ?? undefined,
      })),
      experiences: user.experiences.map((exp) => ({
        title: exp.title,
        company: 'Company',
        description: exp.description,
        location: exp.location,
        startDate: exp.startDate,
        endDate: exp.endDate ?? undefined,
        isCurrent: exp.isCurrent,
        skills: exp.skills,
      })),
      languages: user.languages,
      interests: user.interests,
      availability: user.availability ?? undefined,
    };
  }

  private async analyzeSkillGaps(
    userProfile: UserProfile,
    careerGoal: string,
  ): Promise<SkillGap[]> {
    // Get required skills for the career goal
    const requiredSkills = await this.getRequiredSkillsForCareer(careerGoal);

    // Get user's current skills
    const userSkills = userProfile.skills.map((s) => s.name.toLowerCase());

    const skillGaps: SkillGap[] = [];

    for (const requiredSkill of requiredSkills) {
      const currentLevel = this.getCurrentSkillLevel(
        userSkills,
        requiredSkill.name,
      );

      if (currentLevel < requiredSkill.requiredLevel) {
        const resources = await this.findLearningResourcesForSkill(
          requiredSkill.name,
          'intermediate',
        );

        skillGaps.push({
          skill: requiredSkill.name,
          currentLevel,
          requiredLevel: requiredSkill.requiredLevel,
          importance: requiredSkill.importance,
          marketDemand: requiredSkill.marketDemand,
          timeToLearn: this.estimateTimeToLearn(
            currentLevel,
            requiredSkill.requiredLevel,
          ),
          resources,
        });
      }
    }

    return skillGaps.sort((a, b) => b.importance - a.importance);
  }

  private async generateLearningPaths(
    skillGaps: SkillGap[],
    careerGoal: string,
  ): Promise<LearningPath[]> {
    // Generate structured learning paths based on skill gaps and career goal
    const paths: LearningPath[] = [];

    // Create different path options (fast track, comprehensive, practical)
    paths.push(this.createFastTrackPath(skillGaps, careerGoal));
    paths.push(this.createComprehensivePath(skillGaps, careerGoal));
    paths.push(this.createPracticalPath(skillGaps, careerGoal));

    return paths;
  }

  private createWeeklyLearningPlan(
    skillGaps: SkillGap[],
    timeframe: string,
  ): WeeklyLearningPlan[] {
    const weeks = this.parseTimeframeToWeeks(timeframe);
    const plan: WeeklyLearningPlan[] = [];

    // Distribute skills across weeks based on priority and complexity
    const skillsPerWeek = Math.ceil(skillGaps.length / weeks);

    for (let week = 1; week <= weeks; week++) {
      const weekSkills = skillGaps.slice(
        (week - 1) * skillsPerWeek,
        week * skillsPerWeek,
      );

      plan.push({
        week,
        focus: weekSkills.map((s) => s.skill).join(', '),
        goals: weekSkills.map(
          (s) =>
            `Improve ${s.skill} from level ${s.currentLevel} to ${s.requiredLevel}`,
        ),
        activities: this.generateWeeklyActivities(weekSkills),
        assessment: `Complete practice exercises for ${weekSkills.map((s) => s.skill).join(', ')}`,
      });
    }

    return plan;
  }

  private createLearningMilestones(
    skillGaps: SkillGap[],
    timeframe: string,
  ): LearningMilestone[] {
    const milestones: LearningMilestone[] = [];
    const weeks = this.parseTimeframeToWeeks(timeframe);

    // Create milestones at 25%, 50%, 75%, and 100% completion
    const milestonePercentages = [0.25, 0.5, 0.75, 1.0];

    milestonePercentages.forEach((percentage, index) => {
      const targetWeek = Math.ceil(weeks * percentage);
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + targetWeek * 7);

      const relevantSkills = skillGaps
        .slice(0, Math.ceil(skillGaps.length * percentage))
        .map((sg) => sg.skill);

      milestones.push({
        title: `Milestone ${index + 1}: ${Math.round(percentage * 100)}% Complete`,
        description: `Complete learning objectives for ${relevantSkills.join(', ')}`,
        targetDate,
        skills: relevantSkills,
        assessmentCriteria: [
          'Complete all assigned courses',
          'Pass practice assessments',
          'Build a project demonstrating skills',
        ],
        isCompleted: false,
      });
    });

    return milestones;
  }

  private prioritizeSkills(skillGaps: SkillGap[]): string[] {
    return skillGaps
      .sort((a, b) => {
        // Priority based on importance, market demand, and gap size
        const aScore =
          a.importance *
          this.getMarketDemandScore(a.marketDemand) *
          (a.requiredLevel - a.currentLevel);
        const bScore =
          b.importance *
          this.getMarketDemandScore(b.marketDemand) *
          (b.requiredLevel - b.currentLevel);
        return bScore - aScore;
      })
      .slice(0, 5)
      .map((sg) => sg.skill);
  }

  // Helper methods with placeholder implementations

  private async getRequiredSkillsForCareer(careerGoal: string): Promise<
    {
      name: string;
      requiredLevel: number;
      importance: number;
      marketDemand: 'high' | 'medium' | 'low';
    }[]
  > {
    // In a real implementation, this would query a database or API
    const skillsMap: { [key: string]: any[] } = {
      'software engineer': [
        {
          name: 'JavaScript',
          requiredLevel: 8,
          importance: 9,
          marketDemand: 'high',
        },
        {
          name: 'React',
          requiredLevel: 7,
          importance: 8,
          marketDemand: 'high',
        },
        {
          name: 'Node.js',
          requiredLevel: 7,
          importance: 8,
          marketDemand: 'high',
        },
        {
          name: 'Python',
          requiredLevel: 6,
          importance: 7,
          marketDemand: 'high',
        },
        { name: 'Git', requiredLevel: 7, importance: 9, marketDemand: 'high' },
      ],
      'data scientist': [
        {
          name: 'Python',
          requiredLevel: 9,
          importance: 10,
          marketDemand: 'high',
        },
        {
          name: 'Machine Learning',
          requiredLevel: 8,
          importance: 9,
          marketDemand: 'high',
        },
        { name: 'SQL', requiredLevel: 8, importance: 9, marketDemand: 'high' },
        {
          name: 'Statistics',
          requiredLevel: 8,
          importance: 9,
          marketDemand: 'high',
        },
        {
          name: 'TensorFlow',
          requiredLevel: 7,
          importance: 8,
          marketDemand: 'high',
        },
      ],
    };

    return skillsMap[careerGoal.toLowerCase()] || [];
  }

  private getCurrentSkillLevel(
    userSkills: string[],
    skillName: string,
  ): number {
    // Simple matching - in reality, this would be more sophisticated
    const hasSkill = userSkills.some(
      (skill) =>
        skill.includes(skillName.toLowerCase()) ||
        skillName.toLowerCase().includes(skill),
    );
    return hasSkill ? 5 : 0; // Default to 5 if they have it, 0 if not
  }

  private estimateTimeToLearn(
    currentLevel: number,
    requiredLevel: number,
  ): string {
    const levelDifference = requiredLevel - currentLevel;
    const weeksPerLevel = 2; // Estimate 2 weeks per skill level
    const totalWeeks = levelDifference * weeksPerLevel;

    if (totalWeeks <= 4) return `${totalWeeks} weeks`;
    if (totalWeeks <= 16) return `${Math.round(totalWeeks / 4)} months`;
    return `${Math.round(totalWeeks / 12)} quarters`;
  }

  private async findLearningResourcesForSkill(
    skill: string,
    difficulty: 'beginner' | 'intermediate' | 'advanced',
    budget?: number,
  ): Promise<LearningResource[]> {
    // In a real implementation, this would query learning platforms APIs
    const sampleResources: LearningResource[] = [
      {
        type: 'course',
        title: `${skill} for ${difficulty}s`,
        provider: 'Coursera',
        duration: '6 weeks',
        difficulty,
        cost: 49,
        rating: 4.5,
        relevanceScore: 0.9,
      },
      {
        type: 'certification',
        title: `${skill} Professional Certificate`,
        provider: 'edX',
        duration: '3 months',
        difficulty,
        cost: 299,
        rating: 4.7,
        relevanceScore: 0.95,
      },
      {
        type: 'book',
        title: `Learning ${skill}: A Comprehensive Guide`,
        provider: "O'Reilly",
        duration: '2-3 weeks',
        difficulty,
        cost: 39,
        rating: 4.3,
        relevanceScore: 0.8,
      },
    ];

    // Filter by budget if provided
    if (budget) {
      return sampleResources.filter((resource) => resource.cost <= budget);
    }

    return sampleResources;
  }

  private createFastTrackPath(
    skillGaps: SkillGap[],
    careerGoal: string,
  ): LearningPath {
    return {
      id: 'fast-track',
      title: 'Fast Track to ' + careerGoal,
      description: 'Accelerated learning path focusing on essential skills',
      targetRole: careerGoal,
      duration: '3 months',
      difficulty: 'intermediate',
      steps: this.generateLearningSteps(skillGaps.slice(0, 3), 'fast'),
      prerequisites: ['Basic programming knowledge'],
      outcomes: [
        'Job-ready skills',
        'Portfolio projects',
        'Interview preparation',
      ],
      marketValue: 8,
    };
  }

  private createComprehensivePath(
    skillGaps: SkillGap[],
    careerGoal: string,
  ): LearningPath {
    return {
      id: 'comprehensive',
      title: 'Comprehensive ' + careerGoal + ' Program',
      description: 'In-depth learning covering all aspects of the role',
      targetRole: careerGoal,
      duration: '6 months',
      difficulty: 'intermediate',
      steps: this.generateLearningSteps(skillGaps, 'comprehensive'),
      prerequisites: ['High school education'],
      outcomes: [
        'Expert-level skills',
        'Multiple certifications',
        'Industry connections',
      ],
      marketValue: 9,
    };
  }

  private createPracticalPath(
    skillGaps: SkillGap[],
    careerGoal: string,
  ): LearningPath {
    return {
      id: 'practical',
      title: 'Practical ' + careerGoal + ' Skills',
      description: 'Hands-on learning through real projects',
      targetRole: careerGoal,
      duration: '4 months',
      difficulty: 'intermediate',
      steps: this.generateLearningSteps(skillGaps, 'practical'),
      prerequisites: ['Some relevant experience'],
      outcomes: [
        'Real-world projects',
        'Practical experience',
        'Professional network',
      ],
      marketValue: 8.5,
    };
  }

  private generateLearningSteps(
    skillGaps: SkillGap[],
    pathType: string,
  ): LearningStep[] {
    return skillGaps.map((gap, index) => ({
      order: index + 1,
      title: `Master ${gap.skill}`,
      description: `Learn ${gap.skill} from level ${gap.currentLevel} to ${gap.requiredLevel}`,
      skills: [gap.skill],
      resources: gap.resources,
      estimatedTime: gap.timeToLearn,
      isCompleted: false,
    }));
  }

  private generateWeeklyActivities(skillGaps: SkillGap[]): any[] {
    const activities: Array<{
      day: string;
      activity: string;
      duration: string;
      resources: LearningResource[];
    }> = [];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    days.forEach((day, index) => {
      const skill = skillGaps[index % skillGaps.length];
      activities.push({
        day,
        activity: `Study ${skill?.skill || 'Review'} fundamentals`,
        duration: '2 hours',
        resources: skill?.resources.slice(0, 2) || [],
      });
    });

    return activities;
  }

  private parseTimeframeToWeeks(timeframe: string): number {
    const monthsMatch = timeframe.match(/(\d+)\s*months?/i);
    if (monthsMatch) {
      return parseInt(monthsMatch[1]) * 4;
    }

    const weeksMatch = timeframe.match(/(\d+)\s*weeks?/i);
    if (weeksMatch) {
      return parseInt(weeksMatch[1]);
    }

    return 24; // Default to 6 months
  }

  private getMarketDemandScore(demand: 'high' | 'medium' | 'low'): number {
    return demand === 'high' ? 3 : demand === 'medium' ? 2 : 1;
  }

  private inferCurrentLevel(userProfile: UserProfile): string {
    if (userProfile.experiences.length === 0) return 'Entry Level';
    if (userProfile.experiences.length <= 2) return 'Junior';
    if (userProfile.experiences.length <= 5) return 'Mid-Level';
    return 'Senior';
  }

  private inferTargetLevel(careerGoal: string): string {
    if (
      careerGoal.toLowerCase().includes('senior') ||
      careerGoal.toLowerCase().includes('lead')
    ) {
      return 'Senior';
    }
    if (
      careerGoal.toLowerCase().includes('junior') ||
      careerGoal.toLowerCase().includes('entry')
    ) {
      return 'Junior';
    }
    return 'Mid-Level';
  }

  // Placeholder methods for market analysis
  private async getMarketSkillDemands(): Promise<any[]> {
    return []; // Would fetch from market data APIs
  }

  private async analyzeUserSkillGaps(
    userProfile: UserProfile,
    marketSkills: any[],
  ): Promise<SkillGap[]> {
    return []; // Would analyze user skills against market demands
  }

  private async getMarketInsights(): Promise<any> {
    return {
      trendingSkills: ['AI/ML', 'Cloud Computing', 'Cybersecurity'],
      decliningSkills: ['Flash', 'jQuery'],
      emergingSkills: ['Web3', 'Quantum Computing'],
      highDemandSkills: ['React', 'Python', 'AWS'],
    };
  }

  private generateSkillRecommendations(
    skillGaps: SkillGap[],
    marketInsights: any,
  ): string[] {
    return [
      'Focus on high-demand skills first',
      'Consider emerging technologies for competitive advantage',
      'Build projects to demonstrate your skills',
    ];
  }

  private async updateUserSkillLevel(
    userId: string,
    skill: string,
    newLevel: number,
  ): Promise<void> {
    // Would update user's skill level in the database
  }

  private async clearUserLearningCache(userId: string): Promise<void> {
    await this.cacheService.del(`learning_plan:${userId}:*`);
    await this.cacheService.del(`skill_gaps:${userId}`);
  }
}
