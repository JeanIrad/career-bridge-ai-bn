import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  university?: string;
  major?: string;
  graduationYear?: number;
  gpa?: number;
  bio?: string;
  headline?: string;
  location: {
    city?: string;
    state?: string;
    country?: string;
  };
  skills: Array<{
    name: string;
    endorsements?: number;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    grade?: string;
    startDate: Date;
    endDate?: Date;
  }>;
  experiences: Array<{
    title: string;
    company: string;
    description: string;
    location: string;
    startDate: Date;
    endDate?: Date;
    isCurrent: boolean;
    skills: string[];
  }>;
  languages: string[];
  interests: string[];
  availability?: string;
}
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

export interface RecommendationResult {
  jobId: string;
  score: number;
  reasons: string[];
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly huggingFaceApiUrl =
    'https://api-inference.huggingface.co/models';
  private readonly modelName = 'mistralai/Mistral-7B-Instruct-v0.1'; // Free model

  constructor(private configService: ConfigService) {}

  async generateRecommendations(
    userProfile: UserProfile,
    jobs: JobData[],
  ): Promise<RecommendationResult[]> {
    try {
      const recommendations: RecommendationResult[] = [];

      // Process jobs in batches to avoid API limits
      const batchSize = 5;
      for (let i = 0; i < jobs.length; i += batchSize) {
        const batch = jobs.slice(i, i + batchSize);
        const batchResults = await this.processBatch(userProfile, batch);
        recommendations.push(...batchResults);
      }

      // Sort by score descending
      return recommendations.sort((a, b) => b.score - a.score);
    } catch (error) {
      this.logger.error('Error generating recommendations:', error);
      throw new Error('Failed to generate AI recommendations');
    }
  }

  private async processBatch(
    userProfile: UserProfile,
    jobs: JobData[],
  ): Promise<RecommendationResult[]> {
    const prompt = this.buildPrompt(userProfile, jobs);

    try {
      const response = await axios.post(
        `${this.huggingFaceApiUrl}/${this.modelName}`,
        {
          inputs: prompt,
          parameters: {
            max_new_tokens: 1000,
            temperature: 0.1,
            return_full_text: false,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.configService.get('HUGGINGFACE_API_KEY')}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      return this.parseResponse(response.data[0]?.generated_text || '', jobs);
    } catch (error) {
      this.logger.error('Hugging Face API error:', error);
      // Fallback to rule-based matching
      return this.fallbackMatching(userProfile, jobs);
    }
  }

  private buildPrompt(userProfile: UserProfile, jobs: JobData[]): string {
    const userSkills = userProfile.skills.map((s) => s.name).join(', ');
    const userExperiences = userProfile.experiences
      .map((exp) => `${exp.title} at ${exp.company} (${exp.skills.join(', ')})`)
      .join('; ');
    const userEducation = userProfile.education
      .map(
        (edu) =>
          `${edu.degree} in ${edu.field} from ${edu.institution} (${edu.grade || 'N/A'})`,
      )
      .join('; ');

    let prompt = `You are a career matching AI. Analyze the user profile and rate each job from 0.0 to 1.0 based on how well they match.

User Profile:
- Name: ${userProfile.firstName} ${userProfile.lastName}
- University: ${userProfile.university || 'Not specified'}
- Major: ${userProfile.major || 'Not specified'}
- Graduation Year: ${userProfile.graduationYear || 'Not specified'}
- GPA: ${userProfile.gpa || 'Not specified'}
- Current Location: ${userProfile.location.city || ''} ${userProfile.location.state || ''} ${userProfile.location.country || ''}
- Bio: ${userProfile.bio || 'Not provided'}
- Headline: ${userProfile.headline || 'Not provided'}
- Skills: ${userSkills}
- Languages: ${userProfile.languages.join(', ')}
- Interests: ${userProfile.interests.join(', ')}
- Work Experience: ${userExperiences}
- Education: ${userEducation}
- Availability: ${userProfile.availability || 'Not specified'}

Jobs to evaluate:
`;

    jobs.forEach((job, index) => {
      const salaryInfo =
        typeof job.salary === 'object'
          ? JSON.stringify(job.salary)
          : job.salary;
      prompt += `
${index + 1}. ID: ${job.id}
   Title: ${job.title}
   Company: ${job.company.name}
   Type: ${job.type}
   Location: ${job.location}
   Salary: ${salaryInfo}
   Requirements: ${job.requirements.join('; ')}
   Description: ${job.description.substring(0, 200)}...
   Deadline: ${job.applicationDeadline.toISOString().split('T')[0]}
`;
    });

    prompt += `
Rate each job based on:
1. Skills match (user skills vs job requirements)
2. Experience relevance (user experience vs job requirements)
3. Education compatibility (user education vs job requirements)
4. Location preference (if specified)
5. Career progression potential
6. Interest alignment

For each job, provide a score (0.0-1.0) and 2-3 brief reasons for the match. Format your response as JSON:
{
  "recommendations": [
    {
      "jobId": "job_id",
      "score": 0.85,
      "reasons": ["Strong skills match", "Relevant experience", "Good career progression"]
    }
  ]
}

Response:`;

    return prompt;
  }

  private parseResponse(
    response: string,
    jobs: JobData[],
  ): RecommendationResult[] {
    try {
      // Clean up the response
      const cleanResponse = response.trim();
      let jsonStart = cleanResponse.indexOf('{');
      let jsonEnd = cleanResponse.lastIndexOf('}') + 1;

      if (jsonStart === -1 || jsonEnd === 0) {
        throw new Error('No valid JSON found in response');
      }

      const jsonString = cleanResponse.substring(jsonStart, jsonEnd);
      const parsed = JSON.parse(jsonString);

      return parsed.recommendations || [];
    } catch (error) {
      this.logger.warn('Failed to parse AI response, using fallback matching');
      return this.fallbackMatching(null, jobs);
    }
  }

  private fallbackMatching(
    userProfile: UserProfile | null,
    jobs: JobData[],
  ): RecommendationResult[] {
    if (!userProfile) {
      // Return random scores if we can't process
      return jobs.map((job) => ({
        jobId: job.id,
        score: Math.random() * 0.5 + 0.3, // Random score between 0.3-0.8
        reasons: ['Fallback matching applied'],
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
          userProfile.location.city,
          userProfile.location.state,
          userProfile.location.country,
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
    experiences: UserProfile['experiences'],
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
    education: UserProfile['education'],
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
}
