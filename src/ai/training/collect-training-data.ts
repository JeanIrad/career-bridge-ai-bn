import { PrismaClient, ApplicationStatus } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface TrainingDataPoint {
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

async function collectTrainingData() {
  try {
    // Get all job applications with their associated data
    const applications = await prisma.jobApplication.findMany({
      include: {
        user: {
          include: {
            skills: true,
            experiences: {
              include: {
                company: true,
              },
            },
            education: true,
          },
        },
        job: {
          include: {
            company: true,
          },
        },
        interviews: true,
      },
    });

    const trainingData: TrainingDataPoint[] = applications.map((app) => ({
      userProfile: {
        skills: app.user.skills.map((s) => s.name),
        experience: app.user.experiences.map((e) => ({
          title: e.title,
          companyName: e.company.name,
          duration: calculateDuration(e.startDate, e.endDate),
          skills: e.skills || [],
        })),
        education: app.user.education.map((e) => ({
          degree: e.degree,
          field: e.field,
          grade: typeof e.grade === 'string' ? parseFloat(e.grade) : e.grade,
        })),
        location: {
          city: app.user.city || '',
          state: app.user.state || '',
          country: app.user.country || '',
        },
      },
      job: {
        title: app.job.title,
        description: app.job.description,
        requirements: app.job.requirements as string[],
        type: app.job.type,
        location: app.job.location,
        industry: app.job.company.industry || '',
      },
      outcome: {
        applied: true,
        interviewed: app.interviews.length > 0,
        hired: app.status === ApplicationStatus.ACCEPTED,
        feedback: app.feedback,
      },
    }));

    // Save to a JSON file
    const outputDir = path.join(__dirname, 'data');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(outputDir, 'training_data.json'),
      JSON.stringify(trainingData, null, 2),
    );

    console.log(`Collected ${trainingData.length} training data points`);
  } catch (error) {
    console.error('Error collecting training data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function calculateDuration(startDate: Date, endDate: Date | null): number {
  const end = endDate || new Date();
  const diffMonths =
    (end.getFullYear() - startDate.getFullYear()) * 12 +
    (end.getMonth() - startDate.getMonth());
  return Math.max(0, diffMonths);
}

// Run the collection script
collectTrainingData();
