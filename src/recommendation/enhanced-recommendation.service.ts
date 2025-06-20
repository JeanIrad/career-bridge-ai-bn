import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AiService,
  UserProfile,
  JobData,
  RecommendationResult,
} from '../ai/ai.service';
import { CacheService } from '../cache/cache.service';

export interface EnhancedFilters {
  location?: string;
  jobType?: string[];
  experience?: string[];
  salary?: { min?: number; max?: number };
  skills?: string[];
  company?: string[];
  industry?: string[];
  remoteOnly?: boolean;
  deadline?: Date;
  companySize?: string[];
  benefits?: string[];
  workSchedule?: string[];
}

export interface UserPreferences {
  careerGoals?: string[];
  workEnvironment?: 'remote' | 'onsite' | 'hybrid' | 'any';
  companyCulture?: string[];
  learningOpportunities?: boolean;
  workLifeBalance?: number; // 1-10 scale
  salaryImportance?: number; // 1-10 scale
  growthPotential?: number; // 1-10 scale
  industryPreferences?: string[];
  roleTypes?: string[];
  avoidCompanies?: string[];
  preferredBenefits?: string[];
}

export interface DetailedJobRecommendation {
  id: string;
  jobId: string;
  userId: string;
  overallScore: number;
  matchBreakdown: {
    skillsMatch: number;
    experienceMatch: number;
    educationMatch: number;
    locationMatch: number;
    salaryMatch: number;
    cultureMatch: number;
    careerGrowthMatch: number;
    workLifeBalanceMatch: number;
  };
  reasons: string[];
  concerns: string[];
  opportunities: string[];
  aiInsights: {
    keyStrengths: string[];
    improvementAreas: string[];
    careerAdvice: string[];
    skillGaps: string[];
  };
  jobData: JobData;
  matchPercentage: number;
  confidenceScore: number;
  applicationStrategy: string[];
  estimatedFitness: 'excellent' | 'good' | 'fair' | 'poor';
  createdAt: Date;
  updatedAt: Date;
}

export interface RecommendationInsights {
  totalJobsAnalyzed: number;
  recommendationsGenerated: number;
  averageMatchScore: number;
  topMatchingSkills: { skill: string; frequency: number }[];
  industryDistribution: { industry: string; count: number }[];
  locationDistribution: { location: string; count: number }[];
  salaryInsights: {
    averageSalary: number;
    salaryRange: { min: number; max: number };
    salaryTrends: { range: string; count: number }[];
  };
  marketTrends: {
    demandingSkills: string[];
    emergingRoles: string[];
    growingIndustries: string[];
  };
  personalizedAdvice: string[];
}

@Injectable()
export class EnhancedRecommendationService {
  private readonly logger = new Logger(EnhancedRecommendationService.name);
  private readonly CACHE_TTL = 3600;
  private readonly MIN_RECOMMENDATION_SCORE = 0.4;
  private readonly MAX_BATCH_SIZE = 100;

  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
    private cacheService: CacheService,
  ) {}

  /**
   * Generate comprehensive job recommendations with advanced AI analysis
   */
  async generateAdvancedRecommendations(
    userId: string,
    limit: number = 20,
    filters?: EnhancedFilters,
    preferences?: UserPreferences,
    includeAnalytics: boolean = true,
  ): Promise<{
    recommendations: DetailedJobRecommendation[];
    insights?: RecommendationInsights;
    metadata: {
      totalProcessed: number;
      processingTime: number;
      cacheHit: boolean;
    };
  }> {
    const startTime = Date.now();

    try {
      const cacheKey = this.buildAdvancedCacheKey(userId, {
        limit,
        filters,
        preferences,
      });
      const cached = await this.cacheService.get(cacheKey);

      if (cached) {
        this.logger.log(
          `Returning cached advanced recommendations for user ${userId}`,
        );
        return {
          ...JSON.parse(cached),
          metadata: { ...JSON.parse(cached).metadata, cacheHit: true },
        };
      }

      // Build comprehensive user profile
      const userProfile = await this.buildComprehensiveUserProfile(userId);
      if (!userProfile) {
        throw new Error('Unable to build user profile');
      }

      // Get candidate jobs with advanced filtering
      const candidateJobs = await this.getAdvancedFilteredJobs(userId, filters);

      if (candidateJobs.length === 0) {
        return {
          recommendations: [],
          insights: includeAnalytics
            ? await this.generateEmptyInsights()
            : undefined,
          metadata: {
            totalProcessed: 0,
            processingTime: Date.now() - startTime,
            cacheHit: false,
          },
        };
      }

      // Apply machine learning-enhanced scoring
      const scoredRecommendations = await this.applyAdvancedScoring(
        userProfile,
        candidateJobs,
        preferences,
      );

      // Generate detailed recommendations
      const detailedRecommendations =
        await this.generateDetailedRecommendations(
          userId,
          scoredRecommendations,
          userProfile,
          preferences,
        );

      // Apply intelligent ranking
      const rankedRecommendations = this.applyIntelligentRanking(
        detailedRecommendations,
        preferences,
      ).slice(0, limit);

      // Store recommendations for learning
      await this.storeAdvancedRecommendations(userId, rankedRecommendations);

      // Generate insights if requested
      const insights = includeAnalytics
        ? await this.generateRecommendationInsights(
            userId,
            candidateJobs,
            rankedRecommendations,
          )
        : undefined;

      const result = {
        recommendations: rankedRecommendations,
        insights,
        metadata: {
          totalProcessed: candidateJobs.length,
          processingTime: Date.now() - startTime,
          cacheHit: false,
        },
      };

      // Cache the result
      await this.cacheService.set(
        cacheKey,
        JSON.stringify(result),
        this.CACHE_TTL,
      );

      this.logger.log(
        `Generated ${rankedRecommendations.length} advanced recommendations for user ${userId} in ${result.metadata.processingTime}ms`,
      );

      return result;
    } catch (error) {
      this.logger.error('Error generating advanced recommendations:', error);
      throw error;
    }
  }

  /**
   * Get personalized learning recommendations based on skill gaps
   */
  async getLearningRecommendations(userId: string): Promise<{
    skillGaps: { skill: string; importance: number; resources: string[] }[];
    courseRecommendations: {
      title: string;
      provider: string;
      relevance: number;
    }[];
    certificationSuggestions: {
      name: string;
      value: number;
      timeToComplete: string;
    }[];
  }> {
    try {
      const cacheKey = `learning_recommendations:${userId}`;
      const cached = await this.cacheService.get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      const userProfile = await this.buildComprehensiveUserProfile(userId);
      if (!userProfile) {
        throw new Error('User profile not found');
      }

      // Analyze market demand vs user skills
      const marketSkills = await this.getMarketDemandSkills();
      const userSkills = userProfile.skills.map((s) => s.name.toLowerCase());

      const skillGaps = marketSkills
        .filter(
          (skill) =>
            !userSkills.some(
              (userSkill) =>
                this.calculateStringSimilarity(
                  userSkill,
                  skill.name.toLowerCase(),
                ) > 0.8,
            ),
        )
        .slice(0, 10)
        .map((skill) => ({
          skill: skill.name,
          importance: skill.demandScore,
          resources: this.generateLearningResources(skill.name),
        }));

      const courseRecommendations =
        await this.generateCourseRecommendations(skillGaps);
      const certificationSuggestions =
        await this.generateCertificationSuggestions(skillGaps, userProfile);

      const result = {
        skillGaps,
        courseRecommendations,
        certificationSuggestions,
      };

      await this.cacheService.set(
        cacheKey,
        JSON.stringify(result),
        this.CACHE_TTL,
      );

      return result;
    } catch (error) {
      this.logger.error('Error generating learning recommendations:', error);
      throw error;
    }
  }

  /**
   * Analyze career progression paths
   */
  async getCareerPathAnalysis(userId: string): Promise<{
    currentPosition: string;
    nextRoles: {
      title: string;
      probability: number;
      timeframe: string;
      requirements: string[];
    }[];
    longTermPaths: { path: string[]; probability: number; timeframe: string }[];
    actionPlan: { step: string; timeline: string; resources: string[] }[];
  }> {
    try {
      const cacheKey = `career_path:${userId}`;
      const cached = await this.cacheService.get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      const userProfile = await this.buildComprehensiveUserProfile(userId);
      if (!userProfile) {
        throw new Error('User profile not found');
      }

      // Analyze current position
      const currentPosition = this.inferCurrentPosition(userProfile);

      // Generate next role predictions
      const nextRoles = await this.predictNextRoles(userProfile);

      // Generate long-term career paths
      const longTermPaths = await this.generateCareerPaths(userProfile);

      // Create actionable plan
      const actionPlan = this.generateActionPlan(userProfile, nextRoles);

      const result = {
        currentPosition,
        nextRoles,
        longTermPaths,
        actionPlan,
      };

      await this.cacheService.set(
        cacheKey,
        JSON.stringify(result),
        this.CACHE_TTL,
      );

      return result;
    } catch (error) {
      this.logger.error('Error analyzing career path:', error);
      throw error;
    }
  }

  /**
   * Provide real-time market intelligence
   */
  async getMarketIntelligence(
    skills?: string[],
    location?: string,
    industry?: string,
  ): Promise<{
    marketDemand: {
      skill: string;
      demand: 'high' | 'medium' | 'low';
      trend: 'rising' | 'stable' | 'declining';
    }[];
    salaryTrends: { role: string; averageSalary: number; growth: number }[];
    industryInsights: {
      industry: string;
      growth: number;
      opportunities: number;
    }[];
    locationAnalysis: {
      city: string;
      jobCount: number;
      averageSalary: number;
      competition: string;
    }[];
    recommendations: string[];
  }> {
    try {
      const cacheKey = `market_intelligence:${JSON.stringify({ skills, location, industry })}`;
      const cached = await this.cacheService.get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      // Analyze current market conditions
      const marketDemand = await this.analyzeSkillDemand(skills);
      const salaryTrends = await this.analyzeSalaryTrends(skills, location);
      const industryInsights = await this.analyzeIndustryTrends(industry);
      const locationAnalysis = await this.analyzeLocationMarket(location);

      const recommendations = this.generateMarketRecommendations({
        marketDemand,
        salaryTrends,
        industryInsights,
        locationAnalysis,
      });

      const result = {
        marketDemand,
        salaryTrends,
        industryInsights,
        locationAnalysis,
        recommendations,
      };

      await this.cacheService.set(
        cacheKey,
        JSON.stringify(result),
        this.CACHE_TTL,
      );

      return result;
    } catch (error) {
      this.logger.error('Error getting market intelligence:', error);
      throw error;
    }
  }

  // Private helper methods

  private async buildComprehensiveUserProfile(
    userId: string,
  ): Promise<UserProfile | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        skills: true,
        education: true,
        experiences: true,
        jobApplications: {
          include: {
            job: {
              include: { company: true },
            },
          },
        },
        jobRecommendations: {
          include: {
            job: {
              include: { company: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!user) return null;

    // Enhanced profile with interaction history
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
        company: 'Company', // Placeholder - would need to fetch company details separately
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

  private async getAdvancedFilteredJobs(
    userId: string,
    filters?: EnhancedFilters,
  ): Promise<any[]> {
    const whereClause: any = {
      status: 'ACTIVE',
      applicationDeadline: {
        gte: new Date(),
      },
      jobApplications: {
        none: { userId },
      },
    };

    if (filters) {
      // Apply all filters with advanced logic
      if (filters.location) {
        whereClause.OR = [
          { location: { contains: filters.location, mode: 'insensitive' } },
          { location: { contains: 'remote', mode: 'insensitive' } },
        ];
      }

      if (filters.jobType?.length) {
        whereClause.type = { in: filters.jobType };
      }

      if (filters.experience?.length) {
        whereClause.experience = { in: filters.experience };
      }

      if (filters.salary) {
        whereClause.salary = {};
        if (filters.salary.min) {
          whereClause.salary.gte = filters.salary.min;
        }
        if (filters.salary.max) {
          whereClause.salary.lte = filters.salary.max;
        }
      }

      if (filters.company?.length) {
        whereClause.company = {
          name: { in: filters.company },
        };
      }

      if (filters.industry?.length) {
        whereClause.company = {
          ...whereClause.company,
          industry: { in: filters.industry },
        };
      }

      if (filters.companySize?.length) {
        whereClause.company = {
          ...whereClause.company,
          size: { in: filters.companySize },
        };
      }

      if (filters.remoteOnly) {
        whereClause.OR = [
          { location: { contains: 'remote', mode: 'insensitive' } },
          { type: 'REMOTE' },
        ];
      }
    }

    return await this.prisma.job.findMany({
      where: whereClause,
      include: {
        company: true,
        applications: {
          select: { id: true },
        },
      },
      take: this.MAX_BATCH_SIZE,
      orderBy: [{ createdAt: 'desc' }, { applicationDeadline: 'asc' }],
    });
  }

  private async applyAdvancedScoring(
    userProfile: UserProfile,
    jobs: any[],
    preferences?: UserPreferences,
  ): Promise<RecommendationResult[]> {
    // Convert to JobData format
    const jobData: JobData[] = jobs.map((job) => ({
      id: job.id,
      title: job.title,
      description: job.description,
      requirements: job.requirements as string[],
      type: job.type,
      location: job.location,
      salary: job.salary,
      applicationDeadline: job.applicationDeadline,
      company: {
        name: job.company.name,
        industry: job.company.industry,
        size: job.company.size,
      },
      status: job.status,
    }));

    // Use AI service for base scoring
    const aiRecommendations = await this.aiService.generateRecommendations(
      userProfile,
      jobData,
    );

    // Apply advanced preference-based adjustments
    return aiRecommendations
      .map((rec) => {
        const job = jobData.find((j) => j.id === rec.jobId);
        if (!job) return rec;

        let enhancedScore = rec.score;

        if (preferences) {
          // Apply sophisticated preference weighting
          enhancedScore = this.applyPreferenceWeighting(
            enhancedScore,
            job,
            userProfile,
            preferences,
          );
        }

        // Apply market-based adjustments
        enhancedScore = this.applyMarketAdjustments(enhancedScore, job);

        return {
          ...rec,
          score: Math.min(enhancedScore, 1.0),
        };
      })
      .filter((rec) => rec.score >= this.MIN_RECOMMENDATION_SCORE);
  }

  private applyPreferenceWeighting(
    baseScore: number,
    job: JobData,
    userProfile: UserProfile,
    preferences: UserPreferences,
  ): number {
    let weightedScore = baseScore;
    const weights = {
      workEnvironment: 0.15,
      salaryImportance: 0.1,
      workLifeBalance: 0.15,
      growthPotential: 0.2,
      companyCulture: 0.1,
      careerGoals: 0.2,
      industryPreferences: 0.1,
    };

    // Work environment matching
    if (preferences.workEnvironment && preferences.workEnvironment !== 'any') {
      const environmentMatch = this.calculateEnvironmentMatch(
        preferences.workEnvironment,
        job.type,
      );
      weightedScore += (environmentMatch - 0.5) * weights.workEnvironment;
    }

    // Salary importance weighting
    if (preferences.salaryImportance && job.salary) {
      const salaryScore = this.calculateSalaryScore(
        job.salary,
        preferences.salaryImportance,
      );
      weightedScore += (salaryScore - 0.5) * weights.salaryImportance;
    }

    // Industry preference matching
    if (preferences.industryPreferences?.length && job.company.industry) {
      const industryMatch = preferences.industryPreferences.some((pref) =>
        job.company.industry?.toLowerCase().includes(pref.toLowerCase()),
      )
        ? 1.0
        : 0.3;
      weightedScore += (industryMatch - 0.5) * weights.industryPreferences;
    }

    // Career goals alignment
    if (preferences.careerGoals?.length) {
      const goalAlignment = this.calculateGoalAlignment(
        job,
        preferences.careerGoals,
      );
      weightedScore += (goalAlignment - 0.5) * weights.careerGoals;
    }

    return Math.max(0, Math.min(1, weightedScore));
  }

  private applyMarketAdjustments(score: number, job: JobData): number {
    // Apply adjustments based on market conditions
    let adjustedScore = score;

    // High-demand skills boost
    const highDemandSkills = [
      'AI',
      'Machine Learning',
      'Cloud Computing',
      'Data Science',
      'Cybersecurity',
    ];
    const hasHighDemandSkills = job.requirements.some((req) =>
      highDemandSkills.some((skill) =>
        req.toLowerCase().includes(skill.toLowerCase()),
      ),
    );

    if (hasHighDemandSkills) {
      adjustedScore += 0.05;
    }

    // Remote work preference boost (post-pandemic adjustment)
    if (job.location.toLowerCase().includes('remote')) {
      adjustedScore += 0.03;
    }

    // Application urgency (deadline proximity)
    const daysUntilDeadline = Math.ceil(
      (job.applicationDeadline.getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24),
    );

    if (daysUntilDeadline <= 7) {
      adjustedScore += 0.02; // Slight boost for urgent applications
    }

    return Math.max(0, Math.min(1, adjustedScore));
  }

  private async generateDetailedRecommendations(
    userId: string,
    recommendations: RecommendationResult[],
    userProfile: UserProfile,
    preferences?: UserPreferences,
  ): Promise<DetailedJobRecommendation[]> {
    const jobIds = recommendations.map((rec) => rec.jobId);
    const jobs = await this.prisma.job.findMany({
      where: { id: { in: jobIds } },
      include: { company: true },
    });

    return recommendations
      .map((rec) => {
        const job = jobs.find((j) => j.id === rec.jobId);
        if (!job) return null;

        const jobData: JobData = {
          id: job.id,
          title: job.title,
          description: job.description,
          requirements: job.requirements as string[],
          type: job.type,
          location: job.location,
          salary: job.salary,
          applicationDeadline: job.applicationDeadline,
          company: {
            name: job.company.name,
            industry: job.company.industry,
            size: job.company.size,
          },
          status: job.status,
        };

        // Calculate comprehensive match breakdown
        const matchBreakdown = {
          skillsMatch: this.calculateAdvancedSkillsMatch(
            userProfile.skills,
            jobData,
          ),
          experienceMatch: this.calculateAdvancedExperienceMatch(
            userProfile.experiences,
            jobData,
          ),
          educationMatch: this.calculateAdvancedEducationMatch(
            userProfile.education,
            jobData,
          ),
          locationMatch: this.calculateAdvancedLocationMatch(
            userProfile.location,
            jobData.location,
          ),
          salaryMatch: this.calculateAdvancedSalaryMatch(userProfile, jobData),
          cultureMatch: this.calculateCultureMatch(
            userProfile,
            jobData,
            preferences,
          ),
          careerGrowthMatch: this.calculateCareerGrowthMatch(
            userProfile,
            jobData,
          ),
          workLifeBalanceMatch: this.calculateWorkLifeBalanceMatch(
            jobData,
            preferences,
          ),
        };

        const overallScore = this.calculateWeightedOverallScore(
          matchBreakdown,
          preferences,
        );
        const confidenceScore = this.calculateConfidenceScore(matchBreakdown);
        const estimatedFitness = this.determineEstimatedFitness(
          overallScore,
          confidenceScore,
        );

        // Generate AI insights
        const aiInsights = this.generateAdvancedAIInsights(
          userProfile,
          jobData,
          matchBreakdown,
        );

        // Generate application strategy
        const applicationStrategy = this.generateApplicationStrategy(
          userProfile,
          jobData,
          matchBreakdown,
        );

        return {
          id: `${userId}-${job.id}`,
          jobId: job.id,
          userId,
          overallScore,
          matchBreakdown,
          reasons: rec.reasons,
          concerns: this.generateAdvancedConcerns(matchBreakdown, jobData),
          opportunities: this.generateOpportunities(matchBreakdown, jobData),
          aiInsights,
          jobData,
          matchPercentage: Math.round(overallScore * 100),
          confidenceScore,
          applicationStrategy,
          estimatedFitness,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      })
      .filter(Boolean) as DetailedJobRecommendation[];
  }

  // Additional sophisticated calculation methods

  private calculateAdvancedSkillsMatch(
    userSkills: UserProfile['skills'],
    jobData: JobData,
  ): number {
    if (!userSkills.length || !jobData.requirements.length) return 0;

    const userSkillNames = userSkills.map((s) => s.name.toLowerCase());
    const jobRequirements = jobData.requirements.map((r) => r.toLowerCase());

    // Weighted skill matching
    let totalWeight = 0;
    let matchedWeight = 0;

    jobRequirements.forEach((req) => {
      const weight = this.getSkillWeight(req);
      totalWeight += weight;

      const hasSkill = userSkillNames.some((skill) => {
        const similarity = this.calculateStringSimilarity(skill, req);
        return similarity > 0.7 || skill.includes(req) || req.includes(skill);
      });

      if (hasSkill) {
        matchedWeight += weight;
      }
    });

    return totalWeight > 0 ? matchedWeight / totalWeight : 0;
  }

  private getSkillWeight(skill: string): number {
    // High-value skills get higher weights
    const highValueSkills = [
      'machine learning',
      'ai',
      'data science',
      'cloud',
      'kubernetes',
      'react',
      'node.js',
      'python',
      'java',
      'typescript',
      'go',
      'cybersecurity',
      'devops',
      'blockchain',
      'terraform',
    ];

    const isHighValue = highValueSkills.some((hvs) =>
      skill.toLowerCase().includes(hvs),
    );

    return isHighValue ? 2.0 : 1.0;
  }

  private calculateAdvancedExperienceMatch(
    experiences: UserProfile['experiences'],
    jobData: JobData,
  ): number {
    if (!experiences.length) return 0.2; // Base score for new graduates

    // Calculate total relevant experience months
    let totalRelevantMonths = 0;
    let experienceQualityScore = 0;

    experiences.forEach((exp) => {
      if (this.isRelevantExperience(exp, jobData)) {
        const months = this.calculateExperienceMonths(
          exp.startDate,
          exp.endDate,
        );
        const qualityMultiplier = this.calculateExperienceQuality(exp, jobData);

        totalRelevantMonths += months;
        experienceQualityScore += qualityMultiplier;
      }
    });

    // Experience quantity score (24 months = 1.0)
    const quantityScore = Math.min(totalRelevantMonths / 24, 1.0);

    // Experience quality score (average quality of relevant experiences)
    const qualityScore =
      experiences.length > 0 ? experienceQualityScore / experiences.length : 0;

    // Combine quantity and quality (70% quantity, 30% quality)
    return quantityScore * 0.7 + qualityScore * 0.3;
  }

  private calculateExperienceQuality(
    experience: any,
    jobData: JobData,
  ): number {
    let qualityScore = 0.5; // Base score

    // Title similarity
    const titleSimilarity = this.calculateStringSimilarity(
      experience.title.toLowerCase(),
      jobData.title.toLowerCase(),
    );
    qualityScore += titleSimilarity * 0.3;

    // Company reputation (simplified - could be enhanced with actual data)
    const companyScore = this.estimateCompanyReputation(experience.company);
    qualityScore += companyScore * 0.2;

    return Math.min(qualityScore, 1.0);
  }

  private estimateCompanyReputation(companyName: string): number {
    // Simplified company reputation scoring
    // In real implementation, this could use external APIs or databases
    const bigTechCompanies = [
      'google',
      'microsoft',
      'apple',
      'amazon',
      'meta',
      'netflix',
    ];
    const consultingFirms = ['mckinsey', 'bain', 'bcg', 'deloitte', 'pwc'];
    const unicorns = ['uber', 'airbnb', 'stripe', 'spacex', 'palantir'];

    const company = companyName.toLowerCase();

    if (bigTechCompanies.some((btc) => company.includes(btc))) return 0.9;
    if (consultingFirms.some((cf) => company.includes(cf))) return 0.8;
    if (unicorns.some((u) => company.includes(u))) return 0.7;

    return 0.5; // Average reputation score
  }

  // Utility methods continued...

  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator,
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  private buildAdvancedCacheKey(userId: string, params: any): string {
    const paramStr = JSON.stringify(params);
    const hash = Buffer.from(paramStr).toString('base64');
    return `advanced_recommendations:${userId}:${hash}`;
  }

  // Placeholder methods for complex calculations (would be implemented based on specific requirements)

  private calculateAdvancedEducationMatch(
    education: UserProfile['education'],
    jobData: JobData,
  ): number {
    // Implementation would include degree relevance, institution ranking, GPA consideration, etc.
    return 0.7; // Placeholder
  }

  private calculateAdvancedLocationMatch(
    userLocation: UserProfile['location'],
    jobLocation: string,
  ): number {
    // Implementation would include distance calculation, cost of living, commute analysis, etc.
    return 0.6; // Placeholder
  }

  private calculateAdvancedSalaryMatch(
    userProfile: UserProfile,
    jobData: JobData,
  ): number {
    // Implementation would include salary expectations, market rates, total compensation analysis, etc.
    return 0.7; // Placeholder
  }

  private calculateCultureMatch(
    userProfile: UserProfile,
    jobData: JobData,
    preferences?: UserPreferences,
  ): number {
    // Implementation would analyze company culture fit based on user preferences and company data
    return 0.6; // Placeholder
  }

  private calculateCareerGrowthMatch(
    userProfile: UserProfile,
    jobData: JobData,
  ): number {
    // Implementation would assess career advancement opportunities
    return 0.7; // Placeholder
  }

  private calculateWorkLifeBalanceMatch(
    jobData: JobData,
    preferences?: UserPreferences,
  ): number {
    // Implementation would evaluate work-life balance based on job requirements and user preferences
    return 0.6; // Placeholder
  }

  private calculateWeightedOverallScore(
    matchBreakdown: any,
    preferences?: UserPreferences,
  ): number {
    // Implementation would apply weights based on user preferences
    const scores = Object.values(matchBreakdown) as number[];
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  private calculateConfidenceScore(matchBreakdown: any): number {
    // Implementation would calculate confidence based on data completeness and match consistency
    return 0.8; // Placeholder
  }

  private determineEstimatedFitness(
    overallScore: number,
    confidenceScore: number,
  ): 'excellent' | 'good' | 'fair' | 'poor' {
    const combinedScore = overallScore * confidenceScore;
    if (combinedScore > 0.8) return 'excellent';
    if (combinedScore > 0.6) return 'good';
    if (combinedScore > 0.4) return 'fair';
    return 'poor';
  }

  private generateAdvancedAIInsights(
    userProfile: UserProfile,
    jobData: JobData,
    matchBreakdown: any,
  ): any {
    // Implementation would generate sophisticated AI insights
    return {
      keyStrengths: ['Strong technical background', 'Relevant experience'],
      improvementAreas: ['Consider gaining more experience in X'],
      careerAdvice: ['This role aligns well with your career goals'],
      skillGaps: ['Consider learning Y technology'],
    };
  }

  private generateApplicationStrategy(
    userProfile: UserProfile,
    jobData: JobData,
    matchBreakdown: any,
  ): string[] {
    // Implementation would generate personalized application strategies
    return [
      'Highlight your experience with [specific technology]',
      'Emphasize your [relevant skill] in your cover letter',
      'Consider reaching out to employees at the company',
    ];
  }

  private generateAdvancedConcerns(
    matchBreakdown: any,
    jobData: JobData,
  ): string[] {
    // Implementation would identify potential concerns
    return [];
  }

  private generateOpportunities(
    matchBreakdown: any,
    jobData: JobData,
  ): string[] {
    // Implementation would identify growth opportunities
    return [];
  }

  private applyIntelligentRanking(
    recommendations: DetailedJobRecommendation[],
    preferences?: UserPreferences,
  ): DetailedJobRecommendation[] {
    // Implementation would apply sophisticated ranking algorithms
    return recommendations.sort((a, b) => b.overallScore - a.overallScore);
  }

  private async storeAdvancedRecommendations(
    userId: string,
    recommendations: DetailedJobRecommendation[],
  ): Promise<void> {
    // Implementation would store recommendations with enhanced data
  }

  private async generateRecommendationInsights(
    userId: string,
    jobs: any[],
    recommendations: DetailedJobRecommendation[],
  ): Promise<RecommendationInsights> {
    // Implementation would generate comprehensive insights
    return {
      totalJobsAnalyzed: jobs.length,
      recommendationsGenerated: recommendations.length,
      averageMatchScore: 0.7,
      topMatchingSkills: [],
      industryDistribution: [],
      locationDistribution: [],
      salaryInsights: {
        averageSalary: 75000,
        salaryRange: { min: 50000, max: 120000 },
        salaryTrends: [],
      },
      marketTrends: {
        demandingSkills: [],
        emergingRoles: [],
        growingIndustries: [],
      },
      personalizedAdvice: [],
    };
  }

  private async generateEmptyInsights(): Promise<RecommendationInsights> {
    return {
      totalJobsAnalyzed: 0,
      recommendationsGenerated: 0,
      averageMatchScore: 0,
      topMatchingSkills: [],
      industryDistribution: [],
      locationDistribution: [],
      salaryInsights: {
        averageSalary: 0,
        salaryRange: { min: 0, max: 0 },
        salaryTrends: [],
      },
      marketTrends: {
        demandingSkills: [],
        emergingRoles: [],
        growingIndustries: [],
      },
      personalizedAdvice: [],
    };
  }

  // Additional placeholder methods for advanced features
  private async getMarketDemandSkills(): Promise<
    { name: string; demandScore: number }[]
  > {
    return []; // Implementation would fetch real market data
  }

  private generateLearningResources(skill: string): string[] {
    return []; // Implementation would suggest learning resources
  }

  private async generateCourseRecommendations(
    skillGaps: any[],
  ): Promise<any[]> {
    return []; // Implementation would recommend courses
  }

  private async generateCertificationSuggestions(
    skillGaps: any[],
    userProfile: UserProfile,
  ): Promise<any[]> {
    return []; // Implementation would suggest certifications
  }

  private inferCurrentPosition(userProfile: UserProfile): string {
    return 'Software Developer'; // Implementation would infer current position
  }

  private async predictNextRoles(userProfile: UserProfile): Promise<any[]> {
    return []; // Implementation would predict next career moves
  }

  private async generateCareerPaths(userProfile: UserProfile): Promise<any[]> {
    return []; // Implementation would generate career paths
  }

  private generateActionPlan(
    userProfile: UserProfile,
    nextRoles: any[],
  ): any[] {
    return []; // Implementation would create actionable plans
  }

  private async analyzeSkillDemand(skills?: string[]): Promise<any[]> {
    return []; // Implementation would analyze skill demand
  }

  private async analyzeSalaryTrends(
    skills?: string[],
    location?: string,
  ): Promise<any[]> {
    return []; // Implementation would analyze salary trends
  }

  private async analyzeIndustryTrends(industry?: string): Promise<any[]> {
    return []; // Implementation would analyze industry trends
  }

  private async analyzeLocationMarket(location?: string): Promise<any[]> {
    return []; // Implementation would analyze location-based market data
  }

  private generateMarketRecommendations(data: any): string[] {
    return []; // Implementation would generate market-based recommendations
  }

  private calculateEnvironmentMatch(
    preferred: string,
    jobType: string,
  ): number {
    return 0.5; // Implementation would match work environment preferences
  }

  private calculateSalaryScore(salary: any, importance: number): number {
    return 0.5; // Implementation would score salary based on importance
  }

  private calculateGoalAlignment(job: JobData, goals: string[]): number {
    return 0.5; // Implementation would align job with career goals
  }

  private isRelevantExperience(experience: any, jobData: JobData): boolean {
    return true; // Implementation would determine experience relevance
  }

  private calculateExperienceMonths(startDate: Date, endDate?: Date): number {
    const end = endDate || new Date();
    return Math.max(
      0,
      (end.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30),
    );
  }
}
