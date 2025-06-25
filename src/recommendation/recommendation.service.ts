import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import {
  AiService,
  UserProfile,
  JobData,
  RecommendationResult,
} from '../ai/ai.service';
import {
  UserProfile as TypesUserProfile,
  JobData as TypesJobData,
  RecommendationResult as TypesRecommendationResult,
} from '../ai/types';
import { CacheService } from '../cache/cache.service';

export interface RecommendationFilters {
  location?: string;
  jobType?: string[];
  experience?: string[];
  salary?: {
    min?: number;
    max?: number;
  };
  skills?: string[];
  company?: string[];
  industry?: string[];
  remoteOnly?: boolean;
  deadline?: Date;
}

export interface RecommendationPreferences {
  prioritizeSkillMatch?: boolean;
  prioritizeLocation?: boolean;
  prioritizeSalary?: boolean;
  prioritizeCompanySize?: boolean;
  prioritizeIndustry?: boolean;
  careerGoals?: string[];
  workEnvironment?: 'remote' | 'onsite' | 'hybrid' | 'any';
  cultureFit?: string[];
}

export interface DetailedRecommendation {
  id: string;
  jobId: string;
  userId: string;
  overallScore: number;
  scores: {
    skillsMatch: number;
    experienceMatch: number;
    educationMatch: number;
    locationMatch: number;
    salaryMatch: number;
    companyMatch: number;
    industryMatch: number;
    cultureFit: number;
  };
  reasons: string[];
  concerns: string[];
  aiInsights: string[];
  jobData: JobData;
  matchPercentage: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  createdAt: Date;
  updatedAt: Date;
}

export interface RecommendationAnalytics {
  totalRecommendations: number;
  averageScore: number;
  topMatchingSkills: string[];
  topCompanies: string[];
  topIndustries: string[];
  recommendationTrends: {
    date: Date;
    count: number;
    averageScore: number;
  }[];
  userEngagement: {
    viewedCount: number;
    appliedCount: number;
    savedCount: number;
    rejectedCount: number;
  };
}

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);
  private readonly CACHE_TTL = 3600; // 1 hour
  private readonly RECOMMENDATION_THRESHOLD = 0.3; // Minimum score threshold
  private readonly MAX_RECOMMENDATIONS = 50;

  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
    private cacheService: CacheService,
  ) {}

  /**
   * Get comprehensive job recommendations for a user
   */
  async getJobRecommendationsForUser(
    userId: string,
    limit: number = 10,
    filters?: RecommendationFilters,
    preferences?: RecommendationPreferences,
    refresh: boolean = false,
  ): Promise<DetailedRecommendation[]> {
    try {
      const cacheKey = this.buildCacheKey('job_recommendations', userId, {
        limit,
        filters,
        preferences,
      });

      if (!refresh) {
        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
          this.logger.log(
            `Returning cached job recommendations for user ${userId}`,
          );
          return JSON.parse(cached);
        }
      }

      // Build comprehensive user profile
      const userProfile = await this.buildEnhancedUserProfile(userId);
      if (!userProfile) {
        throw new Error('User profile not found');
      }

      // Get available jobs with filters
      const jobs = await this.getFilteredJobs(userId, filters);

      if (jobs.length === 0) {
        return [];
      }

      // Generate AI-powered recommendations
      const aiRecommendations = await this.generateEnhancedRecommendations(
        userProfile,
        jobs,
        preferences,
      );

      // Create detailed recommendations
      const detailedRecommendations = await this.createDetailedRecommendations(
        userId,
        aiRecommendations,
        userProfile,
        preferences,
      );

      // Store recommendations in database
      await this.storeRecommendations(userId, detailedRecommendations);

      // Apply final ranking and limit
      const finalRecommendations = this.applyFinalRanking(
        detailedRecommendations,
        preferences,
      ).slice(0, limit);

      // Cache results
      await this.cacheService.set(
        cacheKey,
        JSON.stringify(finalRecommendations),
        this.CACHE_TTL,
      );

      this.logger.log(
        `Generated ${finalRecommendations.length} recommendations for user ${userId}`,
      );
      return finalRecommendations;
    } catch (error) {
      this.logger.error('Error getting job recommendations:', error);
      throw error;
    }
  }

  /**
   * Get recommendation analytics for a user
   */
  async getRecommendationAnalytics(
    userId: string,
  ): Promise<RecommendationAnalytics> {
    try {
      const cacheKey = `analytics:${userId}`;
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const recommendations = await this.prisma.jobRecommendation.findMany({
        where: { userId },
        include: {
          job: {
            include: {
              company: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const analytics: RecommendationAnalytics = {
        totalRecommendations: recommendations.length,
        averageScore:
          recommendations.reduce((sum, rec) => sum + rec.score, 0) /
            recommendations.length || 0,
        topMatchingSkills: this.extractTopSkills(recommendations),
        topCompanies: this.extractTopCompanies(recommendations),
        topIndustries: this.extractTopIndustries(recommendations),
        recommendationTrends: await this.getRecommendationTrends(userId),
        userEngagement: await this.getUserEngagement(userId),
      };

      await this.cacheService.set(
        cacheKey,
        JSON.stringify(analytics),
        this.CACHE_TTL,
      );
      return analytics;
    } catch (error) {
      this.logger.error('Error getting recommendation analytics:', error);
      throw error;
    }
  }

  /**
   * Update user preferences based on feedback
   */
  async updateRecommendationFeedback(
    userId: string,
    jobId: string,
    feedback: 'liked' | 'disliked' | 'applied' | 'saved' | 'rejected',
    reasons?: string[],
  ): Promise<void> {
    try {
      // Store feedback
      await this.prisma.jobRecommendation.update({
        where: {
          userId_jobId: {
            userId,
            jobId,
          },
        },
        data: {
          reasons: {
            ...(((
              await this.prisma.jobRecommendation.findUnique({
                where: { userId_jobId: { userId, jobId } },
              })
            )?.reasons as any) || {}),
            feedback,
            feedbackReasons: reasons || [],
          },
        },
      });

      // Clear cache to force refresh
      await this.clearUserRecommendationCache(userId);

      this.logger.log(
        `Updated feedback for user ${userId} on job ${jobId}: ${feedback}`,
      );
    } catch (error) {
      this.logger.error('Error updating recommendation feedback:', error);
      throw error;
    }
  }

  /**
   * Refresh recommendations for a user
   */
  async refreshUserRecommendations(userId: string): Promise<void> {
    try {
      await this.clearUserRecommendationCache(userId);

      // Delete old recommendations
      await this.prisma.jobRecommendation.deleteMany({
        where: { userId },
      });

      this.logger.log(`Refreshed recommendations for user ${userId}`);
    } catch (error) {
      this.logger.error('Error refreshing user recommendations:', error);
      throw error;
    }
  }

  /**
   * Get similar jobs based on a specific job
   */
  async getSimilarJobs(
    jobId: string,
    userId: string,
    limit: number = 5,
  ): Promise<DetailedRecommendation[]> {
    try {
      const cacheKey = `similar_jobs:${jobId}:${userId}:${limit}`;
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const targetJob = await this.prisma.job.findUnique({
        where: { id: jobId },
        include: { company: true },
      });

      if (!targetJob) {
        throw new Error('Job not found');
      }

      const userProfile = await this.buildEnhancedUserProfile(userId);
      if (!userProfile) {
        throw new Error('User profile not found');
      }

      const similarJobs = await this.findSimilarJobs(targetJob, userId);
      const jobFormat = this.convertJobsToJobFormat(similarJobs);

      const recommendations = await this.generateEnhancedRecommendations(
        userProfile,
        jobFormat,
      );

      const detailedRecommendations = await this.createDetailedRecommendations(
        userId,
        recommendations,
        userProfile,
      );

      const result = detailedRecommendations.slice(0, limit);
      await this.cacheService.set(
        cacheKey,
        JSON.stringify(result),
        this.CACHE_TTL,
      );

      return result;
    } catch (error) {
      this.logger.error('Error getting similar jobs:', error);
      throw error;
    }
  }

  // Private helper methods

  private async buildEnhancedUserProfile(
    userId: string,
  ): Promise<UserProfile | null> {
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
              include: {
                company: true,
              },
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

  private async getFilteredJobs(
    userId: string,
    filters?: RecommendationFilters,
  ): Promise<any[]> {
    const whereClause: any = {
      status: 'ACTIVE',
      jobApplications: {
        none: {
          userId: userId,
        },
      },
    };

    if (filters) {
      if (filters.location) {
        whereClause.location = {
          contains: filters.location,
          mode: 'insensitive',
        };
      }

      if (filters.jobType && filters.jobType.length > 0) {
        whereClause.type = {
          in: filters.jobType,
        };
      }

      if (filters.experience && filters.experience.length > 0) {
        whereClause.experience = {
          in: filters.experience,
        };
      }

      if (filters.company && filters.company.length > 0) {
        whereClause.company = {
          name: {
            in: filters.company,
          },
        };
      }

      if (filters.deadline) {
        whereClause.applicationDeadline = {
          gte: filters.deadline,
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
      },
      take: this.MAX_RECOMMENDATIONS,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  private async generateEnhancedRecommendations(
    userProfile: UserProfile,
    jobs: JobData[],
    preferences?: RecommendationPreferences,
  ): Promise<RecommendationResult[]> {
    try {
      // Use AI service for initial recommendations
      const aiRecommendations = await this.aiService.generateRecommendations(
        userProfile,
        jobs,
      );

      // Enhance with preference-based scoring
      const enhancedRecommendations = aiRecommendations.map((rec) => {
        const job = jobs.find((j) => j.id === rec.jobId);
        if (!job) return rec;

        let adjustedScore = rec.score;

        if (preferences) {
          // Apply preference-based adjustments
          if (preferences.prioritizeSkillMatch) {
            const skillMatch = this.calculateSkillMatch(
              userProfile.skills,
              job,
            );
            adjustedScore = adjustedScore * 0.7 + skillMatch * 0.3;
          }

          if (preferences.prioritizeLocation) {
            const locationMatch = this.calculateLocationMatch(
              userProfile.location,
              job.location,
            );
            adjustedScore = adjustedScore * 0.8 + locationMatch * 0.2;
          }

          if (
            preferences.workEnvironment &&
            preferences.workEnvironment !== 'any'
          ) {
            const environmentMatch = this.calculateEnvironmentMatch(
              preferences.workEnvironment,
              job.type,
            );
            adjustedScore = adjustedScore * 0.9 + environmentMatch * 0.1;
          }
        }

        return {
          ...rec,
          score: Math.min(adjustedScore, 1.0), // Ensure score doesn't exceed 1.0
        };
      });

      return enhancedRecommendations.filter(
        (rec) => rec.score >= this.RECOMMENDATION_THRESHOLD,
      );
    } catch (error) {
      this.logger.error('Error generating enhanced recommendations:', error);
      throw error;
    }
  }

  private async createDetailedRecommendations(
    userId: string,
    recommendations: RecommendationResult[],
    userProfile: UserProfile,
    preferences?: RecommendationPreferences,
  ): Promise<DetailedRecommendation[]> {
    const jobIds = recommendations.map((rec) => rec.jobId);
    const jobs = await this.prisma.job.findMany({
      where: {
        id: { in: jobIds },
      },
      include: {
        company: true,
      },
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

        // Calculate detailed scores
        const scores = {
          skillsMatch: this.calculateSkillMatch(userProfile.skills, jobData),
          experienceMatch: this.calculateExperienceMatch(
            userProfile.experiences,
            jobData,
          ),
          educationMatch: this.calculateEducationMatch(
            userProfile.education,
            jobData,
          ),
          locationMatch: this.calculateLocationMatch(
            userProfile.location,
            jobData.location,
          ),
          salaryMatch: this.calculateSalaryMatch(userProfile, jobData),
          companyMatch: this.calculateCompanyMatch(userProfile, jobData),
          industryMatch: this.calculateIndustryMatch(userProfile, jobData),
          cultureFit: this.calculateCultureFit(userProfile, jobData),
        };

        const overallScore =
          Object.values(scores).reduce((sum, score) => sum + score, 0) /
          Object.keys(scores).length;
        const matchPercentage = Math.round(overallScore * 100);
        const confidenceLevel = this.determineConfidenceLevel(
          overallScore,
          scores,
        );

        return {
          id: `${userId}-${job.id}`,
          jobId: job.id,
          userId,
          overallScore,
          scores,
          reasons: rec.reasons,
          concerns: this.generateConcerns(scores, jobData),
          aiInsights: this.generateAIInsights(userProfile, jobData, scores),
          jobData,
          matchPercentage,
          confidenceLevel,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      })
      .filter(Boolean) as DetailedRecommendation[];
  }

  private calculateSkillMatch(
    userSkills: UserProfile['skills'],
    jobData: JobData,
  ): number {
    if (!userSkills.length || !jobData.requirements.length) return 0;

    const userSkillNames = userSkills.map((s) => s.name.toLowerCase());
    const jobRequirements = jobData.requirements.map((r) => r.toLowerCase());

    const matches = jobRequirements.filter((req) =>
      userSkillNames.some(
        (skill) =>
          skill.includes(req) ||
          req.includes(skill) ||
          this.calculateStringSimilarity(skill, req) > 0.8,
      ),
    );

    return matches.length / jobRequirements.length;
  }

  private calculateExperienceMatch(
    experiences: UserProfile['experiences'],
    jobData: JobData,
  ): number {
    if (!experiences.length) return 0.3; // Base score for fresh graduates

    const relevantExperiences = experiences.filter((exp) =>
      this.isRelevantExperience(exp, jobData),
    );

    if (relevantExperiences.length === 0) return 0.3;

    const totalExperience = relevantExperiences.reduce((total, exp) => {
      const months = this.calculateExperienceMonths(
        exp.startDate,
        exp?.endDate ?? new Date(),
      );
      return total + months;
    }, 0);

    // Normalize based on typical job requirements (24 months = 1.0 score)
    return Math.min(totalExperience / 24, 1.0);
  }

  private calculateEducationMatch(
    education: UserProfile['education'],
    jobData: JobData,
  ): number {
    if (!education.length) return 0.5;

    const relevantEducation = education.filter((edu) =>
      this.isRelevantEducation(edu, jobData),
    );

    if (relevantEducation.length === 0) return 0.5;

    // Higher education levels get better scores
    const educationScores = relevantEducation.map((edu) => {
      const degreeScore = this.getDegreeScore(edu.degree);
      const fieldScore = this.getFieldRelevanceScore(edu.field, jobData);
      const gradeScore = this.getGradeScore(edu.grade);

      return (degreeScore + fieldScore + gradeScore) / 3;
    });

    return Math.max(...educationScores);
  }

  private calculateLocationMatch(
    userLocation: UserProfile['location'],
    jobLocation: string,
  ): number {
    if (!userLocation?.city && !userLocation?.state && !userLocation?.country)
      return 0.5;
    if (!jobLocation) return 0.5;

    const jobLoc = jobLocation.toLowerCase();

    // Check for remote work
    if (jobLoc.includes('remote') || jobLoc.includes('anywhere')) return 1.0;

    // Check city match
    if (userLocation?.city && jobLoc.includes(userLocation.city.toLowerCase()))
      return 1.0;

    // Check state match
    if (
      userLocation?.state &&
      jobLoc.includes(userLocation.state.toLowerCase())
    )
      return 0.8;

    // Check country match
    if (
      userLocation?.country &&
      jobLoc.includes(userLocation.country.toLowerCase())
    )
      return 0.6;

    return 0.3;
  }

  private calculateSalaryMatch(
    userProfile: UserProfile,
    jobData: JobData,
  ): number {
    if (!jobData.salary) return 0.5;
    // This would need to be enhanced based on user's salary expectations
    return 0.7;
  }

  private calculateCompanyMatch(
    userProfile: UserProfile,
    jobData: JobData,
  ): number {
    // This could be enhanced with user's company preferences
    return 0.6;
  }

  private calculateIndustryMatch(
    userProfile: UserProfile,
    jobData: JobData,
  ): number {
    if (!jobData.company.industry) return 0.5;

    // Check if user has experience in the same industry
    const hasIndustryExperience = userProfile.experiences.some((exp) =>
      exp.company
        .toLowerCase()
        .includes(jobData.company.industry?.toLowerCase() || ''),
    );

    if (hasIndustryExperience) return 0.9;

    // Check if user's education is relevant to the industry
    const hasRelevantEducation = userProfile.education.some((edu) =>
      this.isEducationRelevantToIndustry(
        edu.field,
        jobData.company.industry || '',
      ),
    );

    if (hasRelevantEducation) return 0.7;

    return 0.5;
  }

  private calculateCultureFit(
    userProfile: UserProfile,
    jobData: JobData,
  ): number {
    // This would need to be enhanced with company culture data and user preferences
    return 0.6;
  }

  private calculateEnvironmentMatch(
    preferredEnvironment: string,
    jobType: string,
  ): number {
    const jobTypeMapping: Record<string, string> = {
      REMOTE: 'remote',
      ONSITE: 'onsite',
      HYBRID: 'hybrid',
      FULL_TIME: 'onsite', // Default assumption
      PART_TIME: 'hybrid',
      CONTRACT: 'remote',
    };

    const jobEnvironment = jobTypeMapping[jobType] || 'onsite';
    return jobEnvironment === preferredEnvironment ? 1.0 : 0.3;
  }

  private generateConcerns(scores: any, jobData: JobData): string[] {
    const concerns: string[] = [];

    if (scores.skillsMatch < 0.5) {
      concerns.push('Limited skill match with job requirements');
    }

    if (scores.experienceMatch < 0.4) {
      concerns.push('May require more relevant experience');
    }

    if (scores.locationMatch < 0.5) {
      concerns.push('Location may not be ideal');
    }

    if (scores.educationMatch < 0.5) {
      concerns.push('Educational background may not fully align');
    }

    return concerns;
  }

  private generateAIInsights(
    userProfile: UserProfile,
    jobData: JobData,
    scores: any,
  ): string[] {
    const insights: string[] = [];

    if (scores.skillsMatch > 0.8) {
      insights.push('Strong technical skill alignment with job requirements');
    }

    if (scores.experienceMatch > 0.7) {
      insights.push('Relevant work experience matches job expectations');
    }

    if (scores.educationMatch > 0.8) {
      insights.push('Educational background strongly supports this role');
    }

    if (scores.locationMatch === 1.0) {
      insights.push('Perfect location match or remote work opportunity');
    }

    return insights;
  }

  private determineConfidenceLevel(
    overallScore: number,
    scores: any,
  ): 'high' | 'medium' | 'low' {
    if (overallScore > 0.8) return 'high';
    if (overallScore > 0.6) return 'medium';
    return 'low';
  }

  private applyFinalRanking(
    recommendations: DetailedRecommendation[],
    preferences?: RecommendationPreferences,
  ): DetailedRecommendation[] {
    return recommendations.sort((a, b) => {
      // Primary sort by overall score
      if (b.overallScore !== a.overallScore) {
        return b.overallScore - a.overallScore;
      }

      // Secondary sort by confidence level
      const confidenceOrder = { high: 3, medium: 2, low: 1 };
      return (
        confidenceOrder[b.confidenceLevel] - confidenceOrder[a.confidenceLevel]
      );
    });
  }

  private async storeRecommendations(
    userId: string,
    recommendations: DetailedRecommendation[],
  ): Promise<void> {
    // Clear existing recommendations
    await this.prisma.jobRecommendation.deleteMany({
      where: { userId },
    });

    // Store new recommendations
    const recommendationData = recommendations.map((rec) => ({
      userId,
      jobId: rec.jobId,
      score: rec.overallScore,
      reasons: rec.reasons,
    }));

    await this.prisma.jobRecommendation.createMany({
      data: recommendationData,
      skipDuplicates: true,
    });
  }

  // Helper methods for analytics and utilities

  private extractTopSkills(recommendations: any[]): string[] {
    const skillCounts: Record<string, number> = {};

    recommendations.forEach((rec) => {
      if (rec.reasons && Array.isArray(rec.reasons)) {
        rec.reasons.forEach((reason: string) => {
          if (reason.toLowerCase().includes('skill')) {
            const words = reason.split(' ');
            words.forEach((word) => {
              if (word.length > 3) {
                skillCounts[word] = (skillCounts[word] || 0) + 1;
              }
            });
          }
        });
      }
    });

    return Object.entries(skillCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([skill]) => skill);
  }

  private extractTopCompanies(recommendations: any[]): string[] {
    const companyCounts: Record<string, number> = {};

    recommendations.forEach((rec) => {
      if (rec.job?.company?.name) {
        companyCounts[rec.job.company.name] =
          (companyCounts[rec.job.company.name] || 0) + 1;
      }
    });

    return Object.entries(companyCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([company]) => company);
  }

  private extractTopIndustries(recommendations: any[]): string[] {
    const industryCounts: Record<string, number> = {};

    recommendations.forEach((rec) => {
      if (rec.job?.company?.industry) {
        industryCounts[rec.job.company.industry] =
          (industryCounts[rec.job.company.industry] || 0) + 1;
      }
    });

    return Object.entries(industryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([industry]) => industry);
  }

  private async getRecommendationTrends(userId: string): Promise<any[]> {
    const trends = await this.prisma.jobRecommendation.groupBy({
      by: ['createdAt'],
      where: { userId },
      _count: true,
      _avg: { score: true },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    return trends.map((trend) => ({
      date: trend.createdAt,
      count: trend._count,
      averageScore: trend._avg.score || 0,
    }));
  }

  private async getUserEngagement(userId: string): Promise<any> {
    const applications = await this.prisma.jobApplication.count({
      where: { userId },
    });

    return {
      viewedCount: 0, // Would need to track views
      appliedCount: applications,
      savedCount: 0, // Would need to track saves
      rejectedCount: 0, // Would need to track rejections
    };
  }

  private buildCacheKey(prefix: string, userId: string, params: any): string {
    const paramStr = JSON.stringify(params);
    return `${prefix}:${userId}:${Buffer.from(paramStr).toString('base64')}`;
  }

  private async clearUserRecommendationCache(userId: string): Promise<void> {
    await this.cacheService.del(`*:${userId}:*`);
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.getEditDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private getEditDistance(str1: string, str2: string): number {
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

  private isRelevantExperience(experience: any, jobData: JobData): boolean {
    const expTitle = experience.title.toLowerCase();
    const jobTitle = jobData.title.toLowerCase();

    return (
      this.calculateStringSimilarity(expTitle, jobTitle) > 0.5 ||
      experience.skills.some((skill: string) =>
        jobData.requirements.some(
          (req) =>
            this.calculateStringSimilarity(
              skill.toLowerCase(),
              req.toLowerCase(),
            ) > 0.7,
        ),
      )
    );
  }

  private isRelevantEducation(education: any, jobData: JobData): boolean {
    return jobData.requirements.some(
      (req) =>
        req.toLowerCase().includes(education.field.toLowerCase()) ||
        req.toLowerCase().includes(education.degree.toLowerCase()),
    );
  }

  private calculateExperienceMonths(startDate: Date, endDate?: Date): number {
    const end = endDate || new Date();
    const start = new Date(startDate);
    return Math.max(
      0,
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30),
    );
  }

  private getDegreeScore(degree: string): number {
    const degreeScores: Record<string, number> = {
      phd: 1.0,
      doctorate: 1.0,
      master: 0.9,
      mba: 0.9,
      bachelor: 0.8,
      associate: 0.6,
      certificate: 0.5,
      diploma: 0.5,
    };

    const degreeKey = Object.keys(degreeScores).find((key) =>
      degree.toLowerCase().includes(key),
    );

    return degreeKey ? degreeScores[degreeKey] : 0.7;
  }

  private getFieldRelevanceScore(field: string, jobData: JobData): number {
    return jobData.requirements.some(
      (req) =>
        req.toLowerCase().includes(field.toLowerCase()) ||
        field.toLowerCase().includes(req.toLowerCase()),
    )
      ? 1.0
      : 0.5;
  }

  private getGradeScore(grade?: string): number {
    if (!grade) return 0.7;

    const gradeValue = parseFloat(grade);
    if (isNaN(gradeValue)) return 0.7;

    return Math.min(gradeValue / 4.0, 1.0);
  }

  private isEducationRelevantToIndustry(
    field: string,
    industry: string,
  ): boolean {
    const fieldIndustryMap: Record<string, string[]> = {
      'computer science': ['technology', 'software', 'it'],
      business: ['finance', 'consulting', 'management'],
      engineering: ['manufacturing', 'automotive', 'aerospace'],
      marketing: ['advertising', 'media', 'retail'],
      finance: ['banking', 'investment', 'insurance'],
    };

    const fieldKey = Object.keys(fieldIndustryMap).find((key) =>
      field.toLowerCase().includes(key),
    );

    if (!fieldKey) return false;

    return fieldIndustryMap[fieldKey].some((ind) =>
      industry.toLowerCase().includes(ind),
    );
  }

  private async findSimilarJobs(
    targetJob: any,
    userId: string,
  ): Promise<any[]> {
    return await this.prisma.job.findMany({
      where: {
        id: { not: targetJob.id },
        OR: [
          { title: { contains: targetJob.title, mode: 'insensitive' } },
          { company: { name: targetJob.company.name } },
          { type: targetJob.type },
        ],
        applications: {
          none: { userId },
        },
      },
      include: { company: true },
      take: 20,
    });
  }

  private convertJobsToJobFormat(jobs: any[]): JobData[] {
    return jobs.map((job) => ({
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
  }
}
