export interface UserProfile {
  id: string;
  status: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  university?: string;
  major?: string;
  graduationYear?: number;
  gpa?: number;
  bio?: string;
  headline?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  skills: Array<{
    name: string;
    level?: string;
    endorsements?: number;
  }>;
  experiences: Array<{
    title: string;
    company: string;
    description?: string;
    location?: string;
    startDate: Date;
    endDate?: Date | null;
    isCurrent?: boolean;
    skills: string[];
  }>;
  education: Array<{
    degree: string;
    field: string;
    institution: string;
    grade?: string;
    graduationDate?: Date;
    startDate?: Date;
    endDate?: Date;
  }>;
  preferences?: {
    industries?: string[];
    jobTypes?: string[];
    locations?: string[];
    workEnvironment?: string;
  };
  languages?: string[];
  interests?: string[];
  availability?: string;
}

export interface JobData {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  type: string;
  location: {
    city?: string;
    state?: string;
    country?: string;
  };
  salary?: JobSalary;
  postedDate: Date;
  applicationDeadline: Date;
  company: {
    name: string;
    industry: string;
    size: string;
  };
  status: string;
}

export interface JobSalary {
  min?: number;
  max?: number;
  currency?: string;
  period?: 'hourly' | 'monthly' | 'yearly';
}

export interface RecommendationResult {
  jobId: string;
  score: number;
  reasons: string[];
  matchDetails: {
    interviewProbability: number;
    hireProbability: number;
    skillMatch: number;
    experienceMatch: number;
    educationMatch: number;
    industryMatch: number;
  };
}

export type ModelPrediction = [number, number]; // [interviewProbability, hireProbability]

export interface FeatureMetadata {
  skillsList: string[];
  titlesList: string[];
  industriesList: string[];
  industryList: string[];
  locationList: string[];
  maxSkills: number;
  maxExperience: number;
  maxEducation: number;
}
