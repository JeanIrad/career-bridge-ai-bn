export interface TrainingDataPoint {
  userProfile: {
    skills: string[];
    experience: {
      title: string;
      companyName: string;
      duration: number;
      skills: string[];
    }[];
    education: {
      degree: string;
      field: string;
      grade: number | null;
    }[];
    location: {
      city: string;
      state: string;
      country: string;
    };
  };
  job: {
    title: string;
    description: string;
    requirements: string[];
    type: string;
    location: string;
    industry: string;
  };
  outcome: {
    applied: boolean;
    interviewed: boolean;
    hired: boolean;
    feedback: string | null;
  };
}
