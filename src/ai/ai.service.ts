import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as tf from '@tensorflow/tfjs-node';
import * as path from 'path';
import * as fs from 'fs';
import type {
  UserProfile as AIUserProfile,
  JobData as AIJobData,
  RecommendationResult as AIRecommendationResult,
  ModelPrediction,
  FeatureMetadata,
} from './types';

export interface OpportunityData {
  id: string;
  title: string;
  company: string;
  description: string;
  requirements: string[];
  skills: string[];
  location?: string;
  type: string;
  experience?: string;
}
export interface JobData {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  type: string;
  location: string;
  salary: any; // Your salary is Json type
  applicationDeadline: Date;
  company: {
    name: string;
    industry?: string;
    size?: string;
  };
  status: string;
}

// Export types for other modules
export type {
  AIUserProfile as UserProfile,
  AIJobData,
  AIRecommendationResult as RecommendationResult,
};

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly huggingFaceApiUrl =
    'https://api-inference.huggingface.co/models';
  private readonly modelName = 'mistralai/Mistral-7B-Instruct-v0.1';
  private model: tf.LayersModel | null = null;
  private metadata: FeatureMetadata | null = null;

  constructor(private configService: ConfigService) {
    this.initializeModel();
  }

  private async initializeModel() {
    try {
      const modelPath = path.join(
        __dirname,
        'training',
        'models',
        'recommendation-model',
      );
      const metadataPath = path.join(
        __dirname,
        'training',
        'models',
        'metadata.json',
      );

      if (
        fs.existsSync(`${modelPath}/model.json`) &&
        fs.existsSync(metadataPath)
      ) {
        this.model = await tf.loadLayersModel(`file://${modelPath}/model.json`);
        this.metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
        this.logger.log('AI model loaded successfully');
      } else {
        this.logger.warn(
          'AI model not found, falling back to heuristic matching',
        );
      }
    } catch (error) {
      this.logger.error('Error loading AI model:', error);
    }
  }

  async generateRecommendations(
    userProfile: AIUserProfile,
    jobs: JobData[],
  ): Promise<AIRecommendationResult[]> {
    try {
      if (this.model && this.metadata) {
        return await this.generateAIRecommendations(userProfile, jobs);
      } else {
        this.logger.log('Using fallback matching due to missing AI model');
        return this.fallbackMatching(userProfile, jobs);
      }
    } catch (error) {
      this.logger.error('Error generating recommendations:', error);
      return this.fallbackMatching(userProfile, jobs);
    }
  }

  private async generateAIRecommendations(
    userProfile: AIUserProfile,
    jobs: JobData[],
  ): Promise<AIRecommendationResult[]> {
    if (!this.metadata) {
      throw new Error('Model metadata not loaded');
    }

    // Create feature vectors for each job
    const features = jobs.map((job) =>
      this.createFeatureVector(userProfile, job),
    );

    // Get predictions from the model
    const predictions = this.model!.predict(tf.tensor2d(features)) as tf.Tensor;
    const scores = (await predictions.array()) as ModelPrediction[];

    // Convert predictions to recommendations with proper matchDetails
    return jobs.map((job, index) => {
      const [interviewProb, hireProb] = scores[index];
      const score = this.calculateOverallScore(interviewProb, hireProb);
      const skillMatch = this.calculateSkillMatchScore(userProfile, job);
      const experienceMatch = this.calculateExperienceMatchScore(
        userProfile,
        job,
      );
      const educationMatch = this.calculateEducationMatchScore(
        userProfile,
        job,
      );
      const industryMatch = this.calculateIndustryMatchScore(userProfile, job);

      const reasons = this.generateReasons(
        userProfile,
        job,
        score,
        interviewProb,
        hireProb,
      );

      return {
        jobId: job.id,
        score,
        reasons,
        matchDetails: {
          interviewProbability: interviewProb,
          hireProbability: hireProb,
          skillMatch,
          experienceMatch,
          educationMatch,
          industryMatch,
        },
      };
    });
  }

  private createFeatureVector(
    userProfile: AIUserProfile,
    job: JobData,
  ): number[] {
    if (!this.metadata) {
      throw new Error('Model metadata not loaded');
    }

    // Skills matching
    const skillsVector = new Array(this.metadata!.skillsList.length).fill(0);
    userProfile.skills.forEach((skill) => {
      const index = this.metadata!.skillsList.indexOf(skill.name.toLowerCase());
      if (index !== -1) skillsVector[index] = 1;
    });

    // Experience matching
    const experienceVector = new Array(this.metadata!.titlesList.length).fill(
      0,
    );
    userProfile.experiences.forEach((exp) => {
      const index = this.metadata!.titlesList.indexOf(exp.title.toLowerCase());
      if (index !== -1) {
        const duration = this.calculateDuration(
          exp.startDate,
          exp.endDate || null,
        );
        experienceVector[index] = duration / 12; // Normalize to years
      }
    });

    // Education level
    const educationLevel = userProfile.education.reduce((max, edu) => {
      const level = this.getEducationLevel(edu.degree);
      return Math.max(max, level);
    }, 0);

    // Industry matching
    const industryVector = new Array(this.metadata!.industryList.length).fill(
      0,
    );
    const index = this.metadata!.industryList.indexOf(
      job.company.industry?.toLowerCase() || '',
    );
    if (index !== -1) industryVector[index] = 1;

    return [
      ...skillsVector,
      ...experienceVector,
      educationLevel,
      ...industryVector,
    ];
  }

  private calculateOverallScore(
    interviewProb: number,
    hireProb: number,
  ): number {
    // Weighted combination of probabilities
    const weights = {
      interview: 0.4,
      hire: 0.6,
    };
    return interviewProb * weights.interview + hireProb * weights.hire;
  }

  private calculateSkillMatchScore(
    userProfile: AIUserProfile,
    job: JobData,
  ): number {
    if (!this.metadata?.skillsList) return 0;

    const userSkills = userProfile.skills.map((s) => s.name.toLowerCase());
    const jobSkills = job.requirements.map((r) => r.toLowerCase());

    let matchScore = 0;
    for (const skill of userSkills) {
      if (jobSkills.includes(skill)) {
        matchScore += 1;
      }
    }

    return matchScore / Math.max(jobSkills.length, 1);
  }

  private calculateExperienceMatchScore(
    userProfile: AIUserProfile,
    job: JobData,
  ): number {
    if (!this.metadata?.titlesList) return 0;

    let totalRelevance = 0;
    for (const exp of userProfile.experiences) {
      const titleRelevance = this.calculateTitleRelevance(exp.title, job.title);
      const duration = this.calculateDuration(
        exp.startDate,
        exp.endDate || null,
      );
      totalRelevance += titleRelevance * Math.min(duration / 365, 1); // Cap at 1 year
    }

    return Math.min(totalRelevance, 1);
  }

  private calculateEducationMatchScore(
    userProfile: AIUserProfile,
    job: JobData,
  ): number {
    let score = 0;

    for (const edu of userProfile.education) {
      // Higher score for relevant degrees
      if (this.isRelevantDegree(edu.field, job.requirements)) {
        score += 0.5;
      }

      // Bonus for good grades if available
      if (
        edu.grade &&
        (edu.grade.includes('A') || edu.grade.includes('First'))
      ) {
        score += 0.2;
      }
    }

    return Math.min(score, 1);
  }

  private calculateIndustryMatchScore(
    userProfile: AIUserProfile,
    job: JobData,
  ): number {
    if (!userProfile.preferences?.industries || !job.company.industry)
      return 0.5;

    return userProfile.preferences.industries.includes(job.company.industry)
      ? 1
      : 0.5;
  }

  private generateReasons(
    userProfile: AIUserProfile,
    job: JobData,
    score: number,
    interviewProb: number,
    hireProb: number,
  ): string[] {
    const reasons: string[] = [];

    if (score > 0.8) {
      reasons.push('Excellent overall match for your profile');
    } else if (score > 0.6) {
      reasons.push('Good match for your qualifications');
    }

    if (interviewProb > 0.7) {
      reasons.push('High likelihood of getting an interview');
    }

    if (hireProb > 0.7) {
      reasons.push('Strong potential for successful placement');
    }

    // Add skill-based reasons
    const matchingSkills = userProfile.skills.filter((skill) =>
      job.requirements.some((req) =>
        req.toLowerCase().includes(skill.name.toLowerCase()),
      ),
    );

    if (matchingSkills.length > 0) {
      reasons.push(
        `Matching skills: ${matchingSkills
          .slice(0, 3)
          .map((s) => s.name)
          .join(', ')}${matchingSkills.length > 3 ? ' and more' : ''}`,
      );
    }

    // Add experience-based reasons
    const relevantExperience = userProfile.experiences.find((exp) =>
      this.isRelevantExperience(exp, job),
    );

    if (relevantExperience) {
      reasons.push(`Relevant experience: ${relevantExperience.title}`);
    }

    return reasons;
  }

  private isRelevantExperience(
    experience: AIUserProfile['experiences'][0],
    job: JobData,
  ): boolean {
    const expTitle = experience.title.toLowerCase();
    const jobTitle = job.title.toLowerCase();

    return (
      this.calculateStringSimilarity(expTitle, jobTitle) > 0.5 ||
      experience.skills.some((skill) =>
        job.requirements.some(
          (req) =>
            this.calculateStringSimilarity(
              skill.toLowerCase(),
              req.toLowerCase(),
            ) > 0.7,
        ),
      )
    );
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const maxLen = Math.max(len1, len2);
    if (maxLen === 0) return 1;

    const distance = this.levenshteinDistance(str1, str2);
    return 1 - distance / maxLen;
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

  private calculateDuration(startDate: Date, endDate: Date | null): number {
    const end = endDate || new Date();
    const diffTime = Math.abs(end.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Convert to days
  }

  private getEducationLevel(degree: string): number {
    const degreeLevels: { [key: string]: number } = {
      'high school': 1,
      associate: 2,
      bachelor: 3,
      master: 4,
      phd: 5,
    };

    const normalizedDegree = degree.toLowerCase();
    for (const [key, value] of Object.entries(degreeLevels)) {
      if (normalizedDegree.includes(key)) return value;
    }
    return 1;
  }

  private fallbackMatching(
    userProfile: AIUserProfile | null,
    jobs: JobData[],
  ): AIRecommendationResult[] {
    if (!userProfile) {
      // Return random scores if we can't process
      return jobs.map((job) => ({
        jobId: job.id,
        score: Math.random() * 0.5 + 0.3, // Random score between 0.3-0.8
        reasons: ['Fallback matching applied'],
        matchDetails: {
          interviewProbability: 0.3,
          hireProbability: 0.2,
          skillMatch: 0.3,
          experienceMatch: 0.3,
          educationMatch: 0.3,
          industryMatch: 0.3,
        },
      }));
    }

    return jobs.map((job) => {
      const skillMatch = this.calculateSkillMatch(
        userProfile.skills.map((skill) => skill.name),
        job.requirements,
      );
      const experienceMatch = this.calculateExperienceMatch(
        userProfile.experiences,
        job,
      );
      const locationMatch = this.calculateLocationMatch(
        [
          userProfile.location?.city,
          userProfile.location?.state,
          userProfile.location?.country,
        ]
          .filter(Boolean)
          .join(', '),
        job.location,
      );

      // Weighted scoring algorithm
      const totalScore =
        skillMatch * 0.4 + experienceMatch * 0.3 + locationMatch * 0.2;

      const reasons: string[] = [];
      if (skillMatch > 0.6) reasons.push('Strong skills alignment');
      else if (skillMatch > 0.3) reasons.push('Some skills match');

      if (experienceMatch > 0.6) reasons.push('Relevant work experience');
      else if (experienceMatch > 0.3) reasons.push('Related experience');

      if (locationMatch > 0.7) reasons.push('Location match');

      if (reasons.length === 0) reasons.push('Basic profile compatibility');

      return {
        jobId: job.id,
        score: Math.min(totalScore, 1.0),
        reasons,
        matchDetails: {
          interviewProbability: totalScore * 0.8,
          hireProbability: totalScore * 0.6,
          skillMatch: skillMatch,
          experienceMatch: experienceMatch,
          educationMatch: 0.5,
          industryMatch: 0.5,
        },
      };
    });
  }

  private calculateSkillMatch(
    userSkills: string[],
    jobRequirements: string[],
  ): number {
    if (!userSkills.length || !jobRequirements.length) return 0.3;

    const userSkillsLower = userSkills.map((s) => s.toLowerCase());
    const requirementsLower = jobRequirements.map((s) => s.toLowerCase());

    const matches = requirementsLower.filter((req) =>
      userSkillsLower.some(
        (userSkill) =>
          userSkill.includes(req) ||
          req.includes(userSkill) ||
          this.isSimilarSkill(userSkill, req),
      ),
    );

    return Math.min(matches.length / requirementsLower.length, 1.0);
  }

  private calculateExperienceMatch(
    experiences: AIUserProfile['experiences'],
    job: JobData,
  ): number {
    if (!experiences.length) return 0.2;

    let relevantExperience = 0;
    const jobTitleLower = job.title.toLowerCase();
    const jobReqsLower = job.requirements.map((r) => r.toLowerCase());

    experiences.forEach((exp) => {
      const expTitleLower = exp.title.toLowerCase();
      const expSkillsLower = exp.skills.map((s) => s.toLowerCase());

      // Check title similarity
      if (this.isSimilarTitle(expTitleLower, jobTitleLower)) {
        relevantExperience += 0.4;
      }

      // Check skills overlap
      const skillOverlap = expSkillsLower.filter((skill) =>
        jobReqsLower.some((req) => req.includes(skill) || skill.includes(req)),
      ).length;

      if (skillOverlap > 0) {
        relevantExperience += Math.min(skillOverlap * 0.1, 0.3);
      }
    });

    return Math.min(relevantExperience, 1.0);
  }

  private calculateEducationMatch(
    education: AIUserProfile['education'],
    job: JobData,
  ): number {
    if (!education.length) return 0.3;

    let educationScore = 0;
    const jobReqsLower = job.requirements.map((r) => r.toLowerCase());

    education.forEach((edu) => {
      const fieldLower = edu.field.toLowerCase();
      const degreeLower = edu.degree.toLowerCase();

      // Check if field matches job requirements
      if (
        jobReqsLower.some(
          (req) => req.includes(fieldLower) || fieldLower.includes(req),
        )
      ) {
        educationScore += 0.4;
      }

      // Bonus for higher degrees
      if (degreeLower.includes('master') || degreeLower.includes('phd')) {
        educationScore += 0.2;
      } else if (degreeLower.includes('bachelor')) {
        educationScore += 0.1;
      }

      // Grade bonus
      if (
        edu.grade &&
        (edu.grade.includes('A') || edu.grade.includes('First'))
      ) {
        educationScore += 0.1;
      }
    });

    return Math.min(educationScore, 1.0);
  }

  private isSimilarSkill(skill1: string, skill2: string): boolean {
    const similarSkills = {
      javascript: ['js', 'node', 'react', 'vue', 'angular'],
      python: ['django', 'flask', 'fastapi'],
      java: ['spring', 'hibernate'],
      database: ['sql', 'mysql', 'postgresql', 'mongodb'],
      frontend: ['html', 'css', 'javascript', 'react', 'vue'],
      backend: ['api', 'server', 'database'],
    };

    for (const [key, synonyms] of Object.entries(similarSkills)) {
      if (
        (skill1.includes(key) && synonyms.some((s) => skill2.includes(s))) ||
        (skill2.includes(key) && synonyms.some((s) => skill1.includes(s)))
      ) {
        return true;
      }
    }

    return false;
  }

  private isSimilarTitle(title1: string, title2: string): boolean {
    const titleWords1 = title1.split(' ');
    const titleWords2 = title2.split(' ');

    const commonWords = titleWords1.filter((word) =>
      titleWords2.some((w) => w.includes(word) || word.includes(w)),
    );

    return commonWords.length > 0;
  }

  private calculateLocationMatch(
    userLocation?: string,
    jobLocation?: string,
  ): number {
    if (!userLocation || !jobLocation) return 0.5;

    const userLoc = userLocation.toLowerCase();
    const jobLoc = jobLocation.toLowerCase();

    // Exact match
    if (userLoc === jobLoc) return 1.0;

    // City/state match
    if (userLoc.includes(jobLoc) || jobLoc.includes(userLoc)) return 0.8;

    // Remote work bonus
    if (jobLoc.includes('remote') || jobLoc.includes('work from home'))
      return 0.9;

    // Same country/region (basic check)
    const userParts = userLoc.split(' ');
    const jobParts = jobLoc.split(' ');
    const commonParts = userParts.filter((part) => jobParts.includes(part));

    if (commonParts.length > 0) return 0.6;

    return 0.3;
  }

  private calculateTitleRelevance(title1: string, title2: string): number {
    if (!this.metadata?.titlesList) return 0;

    const normalizedTitle1 = title1.toLowerCase();
    const normalizedTitle2 = title2.toLowerCase();

    // Check for exact match
    if (normalizedTitle1 === normalizedTitle2) return 1;

    // Check for partial matches
    const words1 = new Set(normalizedTitle1.split(/\s+/));
    const words2 = new Set(normalizedTitle2.split(/\s+/));

    let matches = 0;
    words1.forEach((word) => {
      if (words2.has(word)) matches++;
    });

    return matches / Math.max(words1.size, words2.size);
  }

  private isRelevantDegree(field: string, requirements: string[]): boolean {
    const normalizedField = field.toLowerCase();
    const normalizedReqs = requirements.map((r) => r.toLowerCase());

    return normalizedReqs.some(
      (req) => normalizedField.includes(req) || req.includes(normalizedField),
    );
  }
}
