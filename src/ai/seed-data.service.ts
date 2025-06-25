import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { faker } from '@faker-js/faker';
import { ApplicationStatus, UserRole } from '@prisma/client';

export interface SeedConfig {
  users: number;
  companies: number;
  jobs: number;
  applications: number;
  savedJobs: number;
}

@Injectable()
export class SeedDataService {
  private readonly logger = new Logger(SeedDataService.name);

  // Predefined data for realistic generation
  private readonly skills = [
    'JavaScript',
    'TypeScript',
    'React',
    'Node.js',
    'Python',
    'Java',
    'Spring Boot',
    'Docker',
    'Kubernetes',
    'AWS',
    'Azure',
    'GCP',
    'SQL',
    'PostgreSQL',
    'MongoDB',
    'Redis',
    'GraphQL',
    'REST API',
    'Machine Learning',
    'Data Science',
    'TensorFlow',
    'PyTorch',
    'Angular',
    'Vue.js',
    'Laravel',
    'Django',
    'Flask',
    'Express.js',
    'Git',
    'CI/CD',
    'Jenkins',
    'Linux',
    'Agile',
    'Scrum',
    'HTML',
    'CSS',
    'SASS',
    'Webpack',
    'Babel',
    'Jest',
  ];

  private readonly jobTitles = [
    'Software Engineer',
    'Senior Software Engineer',
    'Full Stack Developer',
    'Frontend Developer',
    'Backend Developer',
    'DevOps Engineer',
    'Data Scientist',
    'Machine Learning Engineer',
    'Product Manager',
    'UI/UX Designer',
    'QA Engineer',
    'Technical Lead',
    'Staff Engineer',
    'Principal Engineer',
    'Engineering Manager',
    'Data Analyst',
    'Cloud Architect',
    'Security Engineer',
  ];

  private readonly industries = [
    'Technology',
    'Finance',
    'Healthcare',
    'E-commerce',
    'Education',
    'Gaming',
    'Media',
    'Telecommunications',
    'Automotive',
    'Aerospace',
    'Real Estate',
    'Insurance',
    'Consulting',
    'Manufacturing',
  ];

  private readonly degrees = [
    'Bachelor of Science in Computer Science',
    'Bachelor of Engineering in Software Engineering',
    'Master of Science in Computer Science',
    'Bachelor of Science in Information Technology',
    'Master of Engineering in Software Systems',
    'Bachelor of Science in Mathematics',
    'Master of Business Administration',
    'Bachelor of Engineering in Electronics',
  ];

  private readonly universities = [
    'MIT',
    'Stanford University',
    'UC Berkeley',
    'Harvard University',
    'Carnegie Mellon University',
    'University of Washington',
    'Georgia Tech',
    'University of Texas at Austin',
    'Caltech',
    'Princeton University',
    'Cornell University',
    'UCLA',
  ];

  constructor(private readonly prisma: PrismaService) {}

  async generateSeedData(
    config: SeedConfig = {
      users: 100,
      companies: 20,
      jobs: 100,
      applications: 200,
      savedJobs: 150,
    },
  ): Promise<void> {
    this.logger.log('🌱 Starting seed data generation...');

    try {
      // Generate in order of dependencies
      const companyOwner = await this.createCompanyOwner();
      const companies = await this.generateCompanies(
        config.companies,
        companyOwner.id,
      );
      this.logger.log(`✅ Generated ${companies.length} companies`);

      const users = await this.generateUsers(config.users);
      this.logger.log(`✅ Generated ${users.length} users`);

      const jobs = await this.generateJobs(config.jobs, companies);
      this.logger.log(`✅ Generated ${jobs.length} jobs`);

      const applications = await this.generateApplications(
        config.applications,
        users,
        jobs,
      );
      this.logger.log(`✅ Generated ${applications.length} applications`);

      const savedJobs = await this.generateSavedJobs(
        config.savedJobs,
        users,
        jobs,
      );
      this.logger.log(`✅ Generated ${savedJobs.length} saved jobs`);

      this.logger.log('🎉 Seed data generation completed successfully!');
    } catch (error) {
      this.logger.error('❌ Error generating seed data:', error);
      throw error;
    }
  }

  private async createCompanyOwner() {
    return await this.prisma.user.create({
      data: {
        email: 'company.owner@system.com',
        password: 'temp-password',
        firstName: 'Company',
        lastName: 'Owner',
        role: UserRole.EMPLOYER,
      },
    });
  }

  private async generateCompanies(count: number, ownerId: string) {
    const companies: any[] = [];

    for (let i = 0; i < count; i++) {
      const company = await this.prisma.company.create({
        data: {
          name: faker.company.name(),
          description:
            faker.company.catchPhrase() + '. ' + faker.lorem.sentences(2),
          industry: faker.helpers.arrayElement(this.industries),
          size: faker.helpers.arrayElement([
            '1-10',
            '11-50',
            '51-200',
            '201-500',
            '500+',
          ]),
          website: faker.internet.url(),
          phone: faker.phone.number(),
          logo: faker.image.avatar(),
          isVerified: faker.datatype.boolean({ probability: 0.8 }),
          ownerId,
        },
      });
      companies.push(company);
    }

    return companies;
  }

  private async generateUsers(count: number) {
    const users: any[] = [];

    for (let i = 0; i < count; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const email = faker.internet.email({ firstName, lastName }).toLowerCase();

      const user = await this.prisma.user.create({
        data: {
          email,
          password: faker.internet.password(),
          firstName,
          lastName,
          role: UserRole.STUDENT,
          university: faker.helpers.arrayElement(this.universities),
          major: faker.helpers.arrayElement([
            'Computer Science',
            'Software Engineering',
            'Information Technology',
            'Data Science',
            'Computer Engineering',
            'Mathematics',
          ]),
          graduationYear: faker.date.future({ years: 3 }).getFullYear(),
          gpa: parseFloat(
            faker.number
              .float({ min: 2.5, max: 4.0, fractionDigits: 2 })
              .toString(),
          ),
          bio: faker.lorem.paragraph(),
          headline: faker.person.jobTitle(),
          city: faker.location.city(),
          state: faker.location.state(),
          country: 'United States',
          avatar: faker.image.avatar(),
          isVerified: faker.datatype.boolean({ probability: 0.7 }),
        },
      });

      // Add skills
      const userSkills = faker.helpers.arrayElements(this.skills, {
        min: 3,
        max: 8,
      });
      for (const skillName of userSkills) {
        await this.prisma.skill.create({
          data: {
            name: skillName,
            endorsements: faker.number.int({ min: 0, max: 50 }),
            userId: user.id,
          },
        });
      }

      // Add experiences
      const experienceCount = faker.number.int({ min: 0, max: 3 });
      for (let j = 0; j < experienceCount; j++) {
        const startDate = faker.date.past({ years: 3 });
        const isCurrent =
          j === 0 && faker.datatype.boolean({ probability: 0.4 });

        // Create a company for the experience
        const experienceCompany = await this.prisma.company.create({
          data: {
            name: faker.company.name(),
            description: faker.company.catchPhrase(),
            industry: faker.helpers.arrayElement(this.industries),
            size: faker.helpers.arrayElement([
              '1-10',
              '11-50',
              '51-200',
              '201-500',
              '500+',
            ]),
            ownerId: user.id,
          },
        });

        await this.prisma.experience.create({
          data: {
            title: faker.helpers.arrayElement(this.jobTitles),
            description: faker.lorem.paragraph(),
            location: `${faker.location.city()}, ${faker.location.state()}`,
            startDate,
            endDate: isCurrent
              ? null
              : faker.date.between({ from: startDate, to: new Date() }),
            isCurrent,
            userId: user.id,
            companyId: experienceCompany.id,
          },
        });
      }

      // Add education
      const educationCount = faker.number.int({ min: 1, max: 2 });
      for (let j = 0; j < educationCount; j++) {
        const startDate = faker.date.past({ years: 6 });
        const endDate = faker.date.between({ from: startDate, to: new Date() });

        await this.prisma.education.create({
          data: {
            institution: faker.helpers.arrayElement(this.universities),
            degree: faker.helpers.arrayElement(this.degrees),
            field: faker.helpers.arrayElement([
              'Computer Science',
              'Software Engineering',
              'Information Technology',
              'Data Science',
              'Computer Engineering',
            ]),
            grade: faker.helpers.arrayElement([
              'A',
              'A-',
              'B+',
              'B',
              'B-',
              'C+',
            ]),
            startDate,
            endDate,
            userId: user.id,
          },
        });
      }

      users.push(user);
    }

    return users;
  }

  private async generateJobs(count: number, companies: any[]) {
    const jobs: any[] = [];

    for (let i = 0; i < count; i++) {
      const company = faker.helpers.arrayElement(companies);
      const jobTitle = faker.helpers.arrayElement(this.jobTitles);
      const requiredSkills = faker.helpers.arrayElements(this.skills, {
        min: 3,
        max: 7,
      });

      const job = await this.prisma.job.create({
        data: {
          title: jobTitle,
          description: this.generateJobDescription(jobTitle, requiredSkills),
          requirements: requiredSkills,
          type: faker.helpers.arrayElement([
            'Full-time',
            'Part-time',
            'Contract',
            'Internship',
          ]),
          location: `${faker.location.city()}, ${faker.location.state()}`,
          salary: {
            min: faker.number.int({ min: 50000, max: 80000 }),
            max: faker.number.int({ min: 80000, max: 150000 }),
            currency: 'USD',
            period: 'yearly',
          },
          applicationDeadline: faker.date.future({ years: 1 }),
          status: 'ACTIVE',
          companyId: company.id,
          postedById: company.ownerId,
        },
      });

      jobs.push(job);
    }

    return jobs;
  }

  private async generateApplications(count: number, users: any[], jobs: any[]) {
    const applications: any[] = [];
    const appliedPairs = new Set<string>(); // Track user-job pairs to avoid duplicates

    for (let i = 0; i < count; i++) {
      let user, job, pairKey;

      // Find a unique user-job pair
      do {
        user = faker.helpers.arrayElement(users);
        job = faker.helpers.arrayElement(jobs);
        pairKey = `${user.id}-${job.id}`;
      } while (appliedPairs.has(pairKey));

      appliedPairs.add(pairKey);

      const appliedAt = faker.date.recent({ days: 30 });
      const status = faker.helpers.weightedArrayElement([
        { weight: 50, value: ApplicationStatus.PENDING },
        { weight: 20, value: ApplicationStatus.REVIEWED },
        { weight: 15, value: ApplicationStatus.INTERVIEWED },
        { weight: 10, value: ApplicationStatus.ACCEPTED },
        { weight: 25, value: ApplicationStatus.REJECTED },
      ]);

      const application = await this.prisma.jobApplication.create({
        data: {
          appliedAt,
          status,
          coverLetter: faker.lorem.paragraphs(2),
          resumeUrl: faker.internet.url(),
          userId: user.id,
          jobId: job.id,
        },
      });

      // Create interviews for some applications
      if (
        status === ApplicationStatus.INTERVIEWED ||
        status === ApplicationStatus.ACCEPTED
      ) {
        await this.prisma.interview.create({
          data: {
            scheduledAt: faker.date.future({ years: 1 }),
            interviewType: faker.helpers.arrayElement([
              'PHONE',
              'VIDEO',
              'IN_PERSON',
            ]),
            duration: faker.number.int({ min: 30, max: 120 }),
            notes: faker.lorem.paragraph(),
            applicationId: application.id,
          },
        });
      }

      applications.push(application);
    }

    return applications;
  }

  private async generateSavedJobs(count: number, users: any[], jobs: any[]) {
    const savedJobs: any[] = [];
    const savedPairs = new Set<string>(); // Track user-job pairs to avoid duplicates

    for (let i = 0; i < count; i++) {
      let user, job, pairKey;

      // Find a unique user-job pair
      do {
        user = faker.helpers.arrayElement(users);
        job = faker.helpers.arrayElement(jobs);
        pairKey = `${user.id}-${job.id}`;
      } while (savedPairs.has(pairKey));

      savedPairs.add(pairKey);

      const savedJob = await this.prisma.savedJob.create({
        data: {
          userId: user.id,
          jobId: job.id,
        },
      });

      savedJobs.push(savedJob);
    }

    return savedJobs;
  }

  private generateJobDescription(title: string, skills: string[]): string {
    const intro = `We are seeking a talented ${title} to join our dynamic team.`;
    const responsibilities = [
      'Develop and maintain high-quality software applications',
      'Collaborate with cross-functional teams to define and ship new features',
      'Write clean, maintainable, and efficient code',
      'Participate in code reviews and contribute to team knowledge sharing',
      'Debug and troubleshoot issues in existing applications',
    ];

    const requirements = skills.map((skill) => `Experience with ${skill}`);

    return `${intro}\n\nResponsibilities:\n${responsibilities.map((r) => `• ${r}`).join('\n')}\n\nRequirements:\n${requirements.map((r) => `• ${r}`).join('\n')}\n\n${faker.lorem.paragraph()}`;
  }

  async clearSeedData(): Promise<void> {
    this.logger.log('🗑️ Clearing existing seed data...');

    // Delete in reverse order of dependencies
    await this.prisma.interview.deleteMany();
    await this.prisma.savedJob.deleteMany();
    await this.prisma.jobApplication.deleteMany();
    await this.prisma.job.deleteMany();
    await this.prisma.skill.deleteMany();
    await this.prisma.experience.deleteMany();
    await this.prisma.education.deleteMany();
    await this.prisma.company.deleteMany();
    await this.prisma.user.deleteMany({
      where: {
        OR: [
          { role: UserRole.STUDENT },
          { role: UserRole.EMPLOYER },
          { email: 'company.owner@system.com' },
        ],
      },
    });

    this.logger.log('✅ Seed data cleared successfully');
  }
}
