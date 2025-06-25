import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { UserProfile } from '../ai/types';

export interface CareerPath {
  id: string;
  title: string;
  description: string;
  industry: string;
  startingRoles: string[];
  progressionSteps: CareerStep[];
  averageProgression: {
    yearsToNextLevel: number;
    salaryGrowth: number;
  };
  requiredSkills: string[];
  alternativePaths: string[];
  marketOutlook: 'excellent' | 'good' | 'stable' | 'declining';
}

export interface CareerStep {
  level: number;
  title: string;
  description: string;
  responsibilities: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  averageSalary: {
    min: number;
    max: number;
    median: number;
  };
  yearsOfExperience: {
    min: number;
    max: number;
  };
  nextSteps: string[];
  transitionProbability: number;
}

export interface CareerTransition {
  from: string;
  to: string;
  difficulty: 'easy' | 'moderate' | 'challenging';
  timeframe: string;
  requiredSkills: string[];
  bridgeSkills: string[];
  successRate: number;
  averageSalaryChange: number;
  keyStrategies: string[];
}

export interface PersonalizedCareerAnalysis {
  userId: string;
  currentPosition: {
    inferredTitle: string;
    level: string;
    experience: string;
    strengths: string[];
    gaps: string[];
  };
  careerTrajectory: {
    shortTerm: CareerPrediction[];
    longTerm: CareerPrediction[];
    alternativePaths: CareerPath[];
  };
  recommendations: {
    immediate: ActionItem[];
    quarterly: ActionItem[];
    annual: ActionItem[];
  };
  marketPosition: {
    competitiveness: number;
    marketValue: number;
    demandLevel: 'high' | 'medium' | 'low';
    growthPotential: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CareerPrediction {
  targetRole: string;
  probability: number;
  timeframe: string;
  requiredActions: string[];
  expectedSalary: number;
  marketDemand: 'high' | 'medium' | 'low';
  reasoning: string[];
}

export interface ActionItem {
  category: 'skill' | 'experience' | 'network' | 'education' | 'certification';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  steps: string[];
  estimatedTime: string;
  impact: number;
  resources: string[];
}

export interface IndustryInsight {
  industry: string;
  growthRate: number;
  jobOpenings: number;
  averageSalary: number;
  topSkills: string[];
  emergingRoles: string[];
  trends: string[];
  outlook: string;
}

@Injectable()
export class CareerPathService {
  private readonly logger = new Logger(CareerPathService.name);
  private readonly CACHE_TTL = 86400; // 24 hours

  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
  ) {}

  /**
   * Generate comprehensive career analysis for a user
   */
  async generateCareerAnalysis(
    userId: string,
  ): Promise<PersonalizedCareerAnalysis> {
    try {
      const cacheKey = `career_analysis:${userId}`;
      const cached = await this.cacheService.get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      const userProfile = await this.buildUserProfile(userId);
      if (!userProfile) {
        throw new Error('User profile not found');
      }

      // Analyze current position
      const currentPosition = this.analyzeCurrentPosition(userProfile);

      // Generate career trajectory predictions
      const careerTrajectory = await this.generateCareerTrajectory(
        userProfile,
        currentPosition,
      );

      // Create actionable recommendations
      const recommendations = await this.generateCareerRecommendations(
        userProfile,
        currentPosition,
      );

      // Assess market position
      const marketPosition = await this.assessMarketPosition(
        userProfile,
        currentPosition,
      );

      const analysis: PersonalizedCareerAnalysis = {
        userId,
        currentPosition,
        careerTrajectory,
        recommendations,
        marketPosition,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.cacheService.set(
        cacheKey,
        JSON.stringify(analysis),
        this.CACHE_TTL,
      );

      return analysis;
    } catch (error) {
      this.logger.error('Error generating career analysis:', error);
      throw error;
    }
  }

  /**
   * Analyze potential career transitions
   */
  async analyzeCareerTransitions(
    userId: string,
    targetRoles: string[],
  ): Promise<CareerTransition[]> {
    try {
      const cacheKey = `career_transitions:${userId}:${targetRoles.join(',')}`;
      const cached = await this.cacheService.get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      const userProfile = await this.buildUserProfile(userId);
      if (!userProfile) {
        throw new Error('User profile not found');
      }

      const currentRole = this.inferCurrentRole(userProfile);
      const transitions: CareerTransition[] = [];

      for (const targetRole of targetRoles) {
        const transition = await this.analyzeTransition(
          currentRole,
          targetRole,
          userProfile,
        );
        transitions.push(transition);
      }

      // Sort by feasibility (success rate and difficulty)
      transitions.sort((a, b) => {
        const aScore =
          a.successRate *
          (a.difficulty === 'easy' ? 3 : a.difficulty === 'moderate' ? 2 : 1);
        const bScore =
          b.successRate *
          (b.difficulty === 'easy' ? 3 : b.difficulty === 'moderate' ? 2 : 1);
        return bScore - aScore;
      });

      await this.cacheService.set(
        cacheKey,
        JSON.stringify(transitions),
        this.CACHE_TTL,
      );

      return transitions;
    } catch (error) {
      this.logger.error('Error analyzing career transitions:', error);
      throw error;
    }
  }

  /**
   * Get industry insights and trends
   */
  async getIndustryInsights(industries: string[]): Promise<IndustryInsight[]> {
    try {
      const cacheKey = `industry_insights:${industries.join(',')}`;
      const cached = await this.cacheService.get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      const insights: IndustryInsight[] = [];

      for (const industry of industries) {
        const insight = await this.generateIndustryInsight(industry);
        insights.push(insight);
      }

      await this.cacheService.set(
        cacheKey,
        JSON.stringify(insights),
        this.CACHE_TTL,
      );

      return insights;
    } catch (error) {
      this.logger.error('Error getting industry insights:', error);
      throw error;
    }
  }

  /**
   * Get available career paths for a specific role
   */
  async getCareerPathsForRole(role: string): Promise<CareerPath[]> {
    try {
      const cacheKey = `career_paths:${role}`;
      const cached = await this.cacheService.get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      const paths = await this.generateCareerPaths(role);

      await this.cacheService.set(
        cacheKey,
        JSON.stringify(paths),
        this.CACHE_TTL,
      );

      return paths;
    } catch (error) {
      this.logger.error('Error getting career paths:', error);
      throw error;
    }
  }

  /**
   * Predict salary progression based on career path
   */
  async predictSalaryProgression(
    userId: string,
    targetPath: string,
    timeframe: number = 5,
  ): Promise<{
    currentSalary: number;
    projectedSalary: number;
    yearlyProjections: { year: number; salary: number; role: string }[];
    factors: string[];
  }> {
    try {
      const userProfile = await this.buildUserProfile(userId);
      if (!userProfile) {
        throw new Error('User profile not found');
      }

      const currentSalary = await this.estimateCurrentSalary(userProfile);
      const salaryProgression = await this.calculateSalaryProgression(
        userProfile,
        targetPath,
        timeframe,
      );

      return {
        currentSalary,
        projectedSalary: salaryProgression.projectedSalary,
        yearlyProjections: salaryProgression.yearlyProjections,
        factors: salaryProgression.factors,
      };
    } catch (error) {
      this.logger.error('Error predicting salary progression:', error);
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
        experiences: {
          include: {
            company: true,
          },
        },
        jobApplications: {
          include: {
            job: {
              include: { company: true },
            },
          },
        },
      },
    });

    if (!user) return null;

    return {
      id: user.id,
      status: user.status,
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
        company: exp.company.name,
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

  private analyzeCurrentPosition(
    userProfile: UserProfile,
  ): PersonalizedCareerAnalysis['currentPosition'] {
    const mostRecentExp =
      userProfile.experiences.find((exp) => exp.isCurrent) ||
      userProfile.experiences[0];

    const inferredTitle = mostRecentExp?.title || 'Entry Level Professional';
    const level = this.inferCareerLevel(userProfile);
    const experience = this.calculateTotalExperience(userProfile.experiences);

    return {
      inferredTitle,
      level,
      experience,
      strengths: this.identifyStrengths(userProfile),
      gaps: this.identifyGaps(userProfile, inferredTitle),
    };
  }

  private async generateCareerTrajectory(
    userProfile: UserProfile,
    currentPosition: PersonalizedCareerAnalysis['currentPosition'],
  ): Promise<PersonalizedCareerAnalysis['careerTrajectory']> {
    const shortTerm = await this.generateShortTermPredictions(
      userProfile,
      currentPosition,
    );
    const longTerm = await this.generateLongTermPredictions(
      userProfile,
      currentPosition,
    );
    const alternativePaths = await this.generateAlternativePaths(
      userProfile,
      currentPosition,
    );

    return {
      shortTerm,
      longTerm,
      alternativePaths,
    };
  }

  private async generateCareerRecommendations(
    userProfile: UserProfile,
    currentPosition: PersonalizedCareerAnalysis['currentPosition'],
  ): Promise<PersonalizedCareerAnalysis['recommendations']> {
    return {
      immediate: this.generateImmediateActions(userProfile, currentPosition),
      quarterly: this.generateQuarterlyActions(userProfile, currentPosition),
      annual: this.generateAnnualActions(userProfile, currentPosition),
    };
  }

  private async assessMarketPosition(
    userProfile: UserProfile,
    currentPosition: PersonalizedCareerAnalysis['currentPosition'],
  ): Promise<PersonalizedCareerAnalysis['marketPosition']> {
    return {
      competitiveness: this.calculateCompetitiveness(userProfile),
      marketValue: await this.estimateMarketValue(userProfile),
      demandLevel: await this.assessDemandLevel(currentPosition.inferredTitle),
      growthPotential: this.calculateGrowthPotential(
        userProfile,
        currentPosition,
      ),
    };
  }

  private inferCurrentRole(userProfile: UserProfile): string {
    const currentExp = userProfile.experiences.find((exp) => exp.isCurrent);
    return (
      currentExp?.title || userProfile.experiences[0]?.title || 'Entry Level'
    );
  }

  private async analyzeTransition(
    currentRole: string,
    targetRole: string,
    userProfile: UserProfile,
  ): Promise<CareerTransition> {
    // Analyze the difficulty and requirements for role transition
    const difficulty = this.assessTransitionDifficulty(currentRole, targetRole);
    const requiredSkills = await this.getRequiredSkillsForRole(targetRole);
    const userSkills = userProfile.skills.map((s) => s.name.toLowerCase());

    const bridgeSkills = requiredSkills.filter(
      (skill) =>
        !userSkills.some(
          (userSkill) =>
            userSkill.includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(userSkill),
        ),
    );

    return {
      from: currentRole,
      to: targetRole,
      difficulty,
      timeframe: this.estimateTransitionTimeframe(
        difficulty,
        bridgeSkills.length,
      ),
      requiredSkills,
      bridgeSkills,
      successRate: this.calculateSuccessRate(
        currentRole,
        targetRole,
        userProfile,
      ),
      averageSalaryChange: await this.estimateSalaryChange(
        currentRole,
        targetRole,
      ),
      keyStrategies: this.generateTransitionStrategies(
        currentRole,
        targetRole,
        bridgeSkills,
      ),
    };
  }

  private async generateIndustryInsight(
    industry: string,
  ): Promise<IndustryInsight> {
    // In a real implementation, this would fetch from industry data APIs
    return {
      industry,
      growthRate: 0.08, // 8% growth
      jobOpenings: 15000,
      averageSalary: 85000,
      topSkills: ['JavaScript', 'Python', 'Cloud Computing', 'Data Analysis'],
      emergingRoles: ['AI Engineer', 'DevOps Specialist', 'Product Manager'],
      trends: [
        'Remote work adoption',
        'AI integration',
        'Sustainable practices',
      ],
      outlook:
        'Strong growth expected due to digital transformation initiatives',
    };
  }

  private async generateCareerPaths(role: string): Promise<CareerPath[]> {
    // Generate career paths based on role
    const paths: CareerPath[] = [];

    // Example path for software engineer
    if (
      role.toLowerCase().includes('engineer') ||
      role.toLowerCase().includes('developer')
    ) {
      paths.push({
        id: 'tech-leadership',
        title: 'Technical Leadership Track',
        description: 'Progress from individual contributor to technical leader',
        industry: 'Technology',
        startingRoles: ['Junior Developer', 'Software Engineer'],
        progressionSteps: [
          {
            level: 1,
            title: 'Junior Software Engineer',
            description: 'Entry-level development role',
            responsibilities: [
              'Write code',
              'Fix bugs',
              'Learn best practices',
            ],
            requiredSkills: ['Programming basics', 'Version control'],
            preferredSkills: ['Framework knowledge', 'Testing'],
            averageSalary: { min: 60000, max: 80000, median: 70000 },
            yearsOfExperience: { min: 0, max: 2 },
            nextSteps: ['Software Engineer', 'Frontend Developer'],
            transitionProbability: 0.8,
          },
          {
            level: 2,
            title: 'Software Engineer',
            description: 'Mid-level development role',
            responsibilities: [
              'Design features',
              'Code review',
              'Mentor juniors',
            ],
            requiredSkills: ['Multiple programming languages', 'System design'],
            preferredSkills: ['Leadership', 'Project management'],
            averageSalary: { min: 80000, max: 120000, median: 100000 },
            yearsOfExperience: { min: 2, max: 5 },
            nextSteps: ['Senior Engineer', 'Tech Lead'],
            transitionProbability: 0.7,
          },
        ],
        averageProgression: { yearsToNextLevel: 2.5, salaryGrowth: 0.15 },
        requiredSkills: ['Programming', 'Problem solving', 'Communication'],
        alternativePaths: ['Product Management', 'DevOps', 'Data Science'],
        marketOutlook: 'excellent',
      });
    }

    return paths;
  }

  // Helper methods for analysis

  private inferCareerLevel(userProfile: UserProfile): string {
    const totalExperience = this.calculateTotalExperienceYears(
      userProfile.experiences,
    );

    if (totalExperience < 2) return 'Entry Level';
    if (totalExperience < 5) return 'Junior';
    if (totalExperience < 8) return 'Mid Level';
    if (totalExperience < 12) return 'Senior';
    return 'Executive';
  }

  private calculateTotalExperience(
    experiences: UserProfile['experiences'],
  ): string {
    const years = this.calculateTotalExperienceYears(experiences);
    return `${years} years`;
  }

  private calculateTotalExperienceYears(
    experiences: UserProfile['experiences'],
  ): number {
    return experiences.reduce((total, exp) => {
      const start = new Date(exp.startDate);
      const end = exp.endDate ? new Date(exp.endDate) : new Date();
      const years =
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
      return total + years;
    }, 0);
  }

  private identifyStrengths(userProfile: UserProfile): string[] {
    const strengths: string[] = [];

    // Analyze skills
    if (userProfile.skills.length > 10) {
      strengths.push('Diverse skill set');
    }

    // Analyze education
    if (
      userProfile.education.some((edu) =>
        edu.degree.toLowerCase().includes('master'),
      )
    ) {
      strengths.push('Advanced education');
    }

    // Analyze experience diversity
    const companies = new Set(
      userProfile.experiences.map((exp) => exp.company),
    );
    if (companies.size > 3) {
      strengths.push('Diverse work experience');
    }

    return strengths;
  }

  private identifyGaps(
    userProfile: UserProfile,
    currentRole: string,
  ): string[] {
    const gaps: string[] = [];

    // This would be more sophisticated in a real implementation
    const commonSkills = ['Leadership', 'Project Management', 'Communication'];
    const userSkills = userProfile.skills.map((s) => s.name.toLowerCase());

    commonSkills.forEach((skill) => {
      if (!userSkills.some((us) => us.includes(skill.toLowerCase()))) {
        gaps.push(skill);
      }
    });

    return gaps;
  }

  private async generateShortTermPredictions(
    userProfile: UserProfile,
    currentPosition: any,
  ): Promise<CareerPrediction[]> {
    // Generate 1-2 year predictions
    return [
      {
        targetRole: 'Senior ' + currentPosition.inferredTitle,
        probability: 0.7,
        timeframe: '18 months',
        requiredActions: [
          'Gain leadership experience',
          'Complete advanced training',
        ],
        expectedSalary: 95000,
        marketDemand: 'high',
        reasoning: ['Strong technical background', 'Growing market demand'],
      },
    ];
  }

  private async generateLongTermPredictions(
    userProfile: UserProfile,
    currentPosition: any,
  ): Promise<CareerPrediction[]> {
    // Generate 3-5 year predictions
    return [
      {
        targetRole: 'Engineering Manager',
        probability: 0.6,
        timeframe: '3-4 years',
        requiredActions: ['Develop management skills', 'Lead larger projects'],
        expectedSalary: 130000,
        marketDemand: 'high',
        reasoning: ['Natural career progression', 'Leadership potential'],
      },
    ];
  }

  private async generateAlternativePaths(
    userProfile: UserProfile,
    currentPosition: any,
  ): Promise<CareerPath[]> {
    return await this.generateCareerPaths(currentPosition.inferredTitle);
  }

  private generateImmediateActions(
    userProfile: UserProfile,
    currentPosition: any,
  ): ActionItem[] {
    return [
      {
        category: 'skill',
        priority: 'high',
        title: 'Complete online certification',
        description: 'Earn a certification in a key technology',
        steps: [
          'Choose relevant certification',
          'Study for 2-3 hours weekly',
          'Schedule exam',
        ],
        estimatedTime: '2 months',
        impact: 8,
        resources: ['Coursera', 'Udemy', 'Official documentation'],
      },
    ];
  }

  private generateQuarterlyActions(
    userProfile: UserProfile,
    currentPosition: any,
  ): ActionItem[] {
    return [
      {
        category: 'experience',
        priority: 'medium',
        title: 'Lead a significant project',
        description: 'Take ownership of a high-impact project',
        steps: [
          'Identify opportunity',
          'Propose leadership role',
          'Execute successfully',
        ],
        estimatedTime: '3 months',
        impact: 9,
        resources: ['Project management tools', 'Leadership training'],
      },
    ];
  }

  private generateAnnualActions(
    userProfile: UserProfile,
    currentPosition: any,
  ): ActionItem[] {
    return [
      {
        category: 'education',
        priority: 'medium',
        title: 'Pursue advanced degree or certification',
        description: 'Enhance credentials with formal education',
        steps: ['Research programs', 'Apply', 'Complete coursework'],
        estimatedTime: '12-24 months',
        impact: 10,
        resources: ['Universities', 'Professional associations'],
      },
    ];
  }

  // Market analysis methods

  private calculateCompetitiveness(userProfile: UserProfile): number {
    // Score from 0-10 based on skills, experience, education
    let score = 5; // Base score

    if (userProfile.skills.length > 10) score += 1;
    if (userProfile.experiences.length > 3) score += 1;
    if (
      userProfile.education.some((edu) =>
        edu.degree.toLowerCase().includes('master'),
      )
    )
      score += 1;

    return Math.min(score, 10);
  }

  private async estimateMarketValue(userProfile: UserProfile): Promise<number> {
    // Estimate based on role, skills, and experience
    const baseValue = 75000; // Base salary estimate
    const experienceMultiplier = Math.min(
      this.calculateTotalExperienceYears(userProfile.experiences) * 0.1,
      1,
    );
    const skillsMultiplier = Math.min(userProfile.skills.length * 0.05, 0.5);

    return Math.round(
      baseValue * (1 + experienceMultiplier + skillsMultiplier),
    );
  }

  private async assessDemandLevel(
    role: string,
  ): Promise<'high' | 'medium' | 'low'> {
    // Assess market demand for the role
    const highDemandRoles = [
      'software engineer',
      'data scientist',
      'product manager',
    ];
    const roleLower = role.toLowerCase();

    if (highDemandRoles.some((hdr) => roleLower.includes(hdr))) {
      return 'high';
    }

    return 'medium';
  }

  private calculateGrowthPotential(
    userProfile: UserProfile,
    currentPosition: any,
  ): number {
    // Calculate growth potential score from 0-10
    const experienceYears = this.calculateTotalExperienceYears(
      userProfile.experiences,
    );
    const educationLevel = userProfile.education.length;
    const skillsDiversity = userProfile.skills.length;

    const score = Math.min(
      (10 - experienceYears) * 0.5 + // More potential if less experienced
        educationLevel * 2 + // Education adds potential
        skillsDiversity * 0.3, // Skills add potential
      10,
    );

    return Math.max(score, 3); // Minimum potential of 3
  }

  // Transition analysis methods

  private assessTransitionDifficulty(
    currentRole: string,
    targetRole: string,
  ): 'easy' | 'moderate' | 'challenging' {
    // Simple heuristic - could be more sophisticated
    const similarity = this.calculateRoleSimilarity(currentRole, targetRole);

    if (similarity > 0.7) return 'easy';
    if (similarity > 0.4) return 'moderate';
    return 'challenging';
  }

  private calculateRoleSimilarity(role1: string, role2: string): number {
    // Simple word overlap calculation
    const words1 = role1.toLowerCase().split(' ');
    const words2 = role2.toLowerCase().split(' ');

    const overlap = words1.filter((word) => words2.includes(word)).length;
    return overlap / Math.max(words1.length, words2.length);
  }

  private async getRequiredSkillsForRole(role: string): Promise<string[]> {
    // Return required skills based on role
    const skillsMap: { [key: string]: string[] } = {
      'software engineer': [
        'Programming',
        'Problem Solving',
        'Version Control',
        'Testing',
      ],
      'product manager': [
        'Strategy',
        'Communication',
        'Analytics',
        'User Experience',
      ],
      'data scientist': ['Statistics', 'Machine Learning', 'Python', 'SQL'],
    };

    return (
      skillsMap[role.toLowerCase()] || ['Communication', 'Problem Solving']
    );
  }

  private estimateTransitionTimeframe(
    difficulty: string,
    skillGaps: number,
  ): string {
    const baseMonths =
      difficulty === 'easy' ? 3 : difficulty === 'moderate' ? 6 : 12;
    const additionalMonths = skillGaps * 2;
    const totalMonths = baseMonths + additionalMonths;

    if (totalMonths <= 6) return `${totalMonths} months`;
    return `${Math.round(totalMonths / 12)} years`;
  }

  private calculateSuccessRate(
    currentRole: string,
    targetRole: string,
    userProfile: UserProfile,
  ): number {
    // Calculate probability of successful transition
    const baseProbability = 0.6;
    const experienceBonus = Math.min(
      this.calculateTotalExperienceYears(userProfile.experiences) * 0.05,
      0.3,
    );
    const educationBonus = userProfile.education.length * 0.05;

    return Math.min(baseProbability + experienceBonus + educationBonus, 0.95);
  }

  private async estimateSalaryChange(
    currentRole: string,
    targetRole: string,
  ): Promise<number> {
    // Estimate percentage change in salary
    const roleSalaryMap: { [key: string]: number } = {
      'software engineer': 90000,
      'senior software engineer': 120000,
      'product manager': 110000,
      'engineering manager': 140000,
    };

    const currentSalary = roleSalaryMap[currentRole.toLowerCase()] || 75000;
    const targetSalary = roleSalaryMap[targetRole.toLowerCase()] || 80000;

    return (targetSalary - currentSalary) / currentSalary;
  }

  private generateTransitionStrategies(
    currentRole: string,
    targetRole: string,
    bridgeSkills: string[],
  ): string[] {
    const strategies = [
      'Network with professionals in target role',
      'Take on projects that develop target skills',
      'Find a mentor in the target field',
    ];

    if (bridgeSkills.length > 0) {
      strategies.push(
        `Focus on developing: ${bridgeSkills.slice(0, 3).join(', ')}`,
      );
    }

    return strategies;
  }

  // Salary prediction methods

  private async estimateCurrentSalary(
    userProfile: UserProfile,
  ): Promise<number> {
    // Estimate based on role, experience, and location
    const baseEstimate = 75000;
    const experienceMultiplier =
      this.calculateTotalExperienceYears(userProfile.experiences) * 0.1;
    const locationMultiplier = this.getLocationSalaryMultiplier(
      userProfile.location?.city || '',
    );

    return Math.round(
      baseEstimate * (1 + experienceMultiplier) * locationMultiplier,
    );
  }

  private async calculateSalaryProgression(
    userProfile: UserProfile,
    targetPath: string,
    timeframe: number,
  ): Promise<{
    projectedSalary: number;
    yearlyProjections: { year: number; salary: number; role: string }[];
    factors: string[];
  }> {
    const currentSalary = await this.estimateCurrentSalary(userProfile);
    const annualGrowthRate = 0.07; // 7% annual growth

    const yearlyProjections: { year: number; salary: number; role: string }[] =
      [];
    let projectedSalary = currentSalary;

    for (let year = 1; year <= timeframe; year++) {
      projectedSalary *= 1 + annualGrowthRate;
      yearlyProjections.push({
        year,
        salary: Math.round(projectedSalary),
        role: year <= 2 ? 'Current Role' : 'Advanced Role',
      });
    }

    return {
      projectedSalary: Math.round(projectedSalary),
      yearlyProjections,
      factors: [
        'Industry growth',
        'Skill development',
        'Career advancement',
        'Market demand',
      ],
    };
  }

  private getLocationSalaryMultiplier(city: string): number {
    const cityMultipliers: { [key: string]: number } = {
      'san francisco': 1.4,
      'new york': 1.3,
      seattle: 1.2,
      austin: 1.1,
      denver: 1.0,
      atlanta: 0.95,
    };

    return cityMultipliers[city.toLowerCase()] || 1.0;
  }
}
