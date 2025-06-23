const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Cleaning existing analytics data...');
  // await seedUniversities();
  // Clean existing data in correct order
  await prisma.interview.deleteMany();
  await prisma.companyReview.deleteMany();
  await prisma.skillInDemand.deleteMany();
  await prisma.candidateSource.deleteMany();
  await prisma.jobApplication.deleteMany();
  await prisma.jobRecommendation.deleteMany();
  await prisma.job.deleteMany();

  console.log('📊 Creating analytics data...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create Jennifer Smith (the employer from the UI)
  const jennifer = await prisma.user.upsert({
    where: { email: 'jennifer.smith@techcorp.com' },
    update: {},
    create: {
      email: 'jennifer.smith@techcorp.com',
      password: hashedPassword,
      firstName: 'Jennifer',
      lastName: 'Smith',
      role: 'EMPLOYER',
      university: 'Stanford University',
      major: 'Computer Science',
      headline: 'Senior Technical Recruiter at TechCorp',
      bio: 'Passionate about connecting talented developers with amazing opportunities. 5+ years in tech recruitment.',
      avatar:
        'https://images.unsplash.com/photo-1494790108755-2616b2b3e4d8?w=150&h=150&fit=crop&crop=face',
      phoneNumber: '+1-555-0101',
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
      isVerified: true,
    },
  });

  // Create a company for Jennifer
  const company = await prisma.company.upsert({
    where: { id: 'techcorp-id' },
    update: {},
    create: {
      id: 'techcorp-id',
      name: 'TechCorp Solutions',
      description: 'Leading software development company',
      industry: 'Technology',
      size: '500-1000',
      type: 'Private',
      foundedYear: 2015,
      website: 'https://techcorp.com',
      logo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&h=200&fit=crop',
      isVerified: true,
      ownerId: jennifer.id,
    },
  });

  // Create jobs posted by Jennifer
  const jobs = await Promise.all([
    prisma.job.create({
      data: {
        title: 'Senior Full-Stack Developer',
        description: 'We are looking for an experienced full-stack developer.',
        requirements: ['5+ years experience', 'React', 'Node.js'],
        type: 'Full-time',
        location: 'San Francisco, CA',
        salary: { min: 120000, max: 160000, currency: 'USD' },
        applicationDeadline: new Date('2024-03-30'),
        status: 'ACTIVE',
        companyId: company.id,
        postedById: jennifer.id,
      },
    }),
    prisma.job.create({
      data: {
        title: 'Data Scientist',
        description: 'Join our data science team.',
        requirements: ['Masters degree', 'Python', 'Machine Learning'],
        type: 'Full-time',
        location: 'San Francisco, CA',
        salary: { min: 130000, max: 170000, currency: 'USD' },
        applicationDeadline: new Date('2024-04-15'),
        status: 'ACTIVE',
        companyId: company.id,
        postedById: jennifer.id,
      },
    }),
    prisma.job.create({
      data: {
        title: 'Frontend Developer',
        description: 'Build beautiful user interfaces.',
        requirements: ['3+ years experience', 'React', 'TypeScript'],
        type: 'Full-time',
        location: 'San Francisco, CA',
        salary: { min: 90000, max: 130000, currency: 'USD' },
        applicationDeadline: new Date('2024-04-01'),
        status: 'ACTIVE',
        companyId: company.id,
        postedById: jennifer.id,
      },
    }),
    prisma.job.create({
      data: {
        title: 'Backend Engineer',
        description: 'Design scalable backend systems.',
        requirements: ['4+ years experience', 'Java', 'Spring Boot'],
        type: 'Full-time',
        location: 'San Francisco, CA',
        salary: { min: 110000, max: 150000, currency: 'USD' },
        applicationDeadline: new Date('2024-03-25'),
        status: 'ACTIVE',
        companyId: company.id,
        postedById: jennifer.id,
      },
    }),
    prisma.job.create({
      data: {
        title: 'Mobile Developer',
        description: 'Develop native iOS applications.',
        requirements: ['3+ years iOS experience', 'Swift', 'UIKit'],
        type: 'Full-time',
        location: 'San Francisco, CA',
        salary: { min: 100000, max: 140000, currency: 'USD' },
        applicationDeadline: new Date('2024-04-10'),
        status: 'ACTIVE',
        companyId: company.id,
        postedById: jennifer.id,
      },
    }),
    prisma.job.create({
      data: {
        title: 'DevOps Engineer',
        description: 'Manage cloud infrastructure and deployments.',
        requirements: ['AWS experience', 'Docker', 'Kubernetes'],
        type: 'Full-time',
        location: 'San Francisco, CA',
        salary: { min: 115000, max: 155000, currency: 'USD' },
        applicationDeadline: new Date('2024-04-05'),
        status: 'ACTIVE',
        companyId: company.id,
        postedById: jennifer.id,
      },
    }),
    prisma.job.create({
      data: {
        title: 'Product Designer',
        description: 'Design user-centered digital experiences.',
        requirements: ['5+ years design experience', 'Figma', 'User Research'],
        type: 'Full-time',
        location: 'San Francisco, CA',
        salary: { min: 105000, max: 145000, currency: 'USD' },
        applicationDeadline: new Date('2024-04-12'),
        status: 'ACTIVE',
        companyId: company.id,
        postedById: jennifer.id,
      },
    }),
    prisma.job.create({
      data: {
        title: 'QA Engineer',
        description: 'Ensure software quality through testing.',
        requirements: ['3+ years QA experience', 'Automation', 'Selenium'],
        type: 'Full-time',
        location: 'San Francisco, CA',
        salary: { min: 85000, max: 120000, currency: 'USD' },
        applicationDeadline: new Date('2024-04-08'),
        status: 'ACTIVE',
        companyId: company.id,
        postedById: jennifer.id,
      },
    }),
  ]);

  console.log(`✅ Created ${jobs.length} jobs`);

  // Create candidate sources
  await Promise.all([
    prisma.candidateSource.create({
      data: {
        name: 'Direct Applications',
        description: 'Company website applications',
      },
    }),
    prisma.candidateSource.create({
      data: {
        name: 'University Career Fair',
        description: 'Campus recruiting events',
      },
    }),
    prisma.candidateSource.create({
      data: { name: 'Employee Referral', description: 'Employee referrals' },
    }),
    prisma.candidateSource.create({
      data: { name: 'LinkedIn', description: 'LinkedIn sourcing' },
    }),
    prisma.candidateSource.create({
      data: { name: 'Job Boards', description: 'Indeed, Glassdoor, etc.' },
    }),
  ]);

  console.log('✅ Created candidate sources');

  // Create skills in demand
  await Promise.all([
    prisma.skillInDemand.create({
      data: { skillName: 'React', demandCount: 45, growthPercent: 23.5 },
    }),
    prisma.skillInDemand.create({
      data: { skillName: 'Python', demandCount: 38, growthPercent: 18.2 },
    }),
    prisma.skillInDemand.create({
      data: { skillName: 'TypeScript', demandCount: 35, growthPercent: 31.7 },
    }),
    prisma.skillInDemand.create({
      data: { skillName: 'Node.js', demandCount: 32, growthPercent: 15.8 },
    }),
    prisma.skillInDemand.create({
      data: { skillName: 'AWS', demandCount: 28, growthPercent: 27.3 },
    }),
    prisma.skillInDemand.create({
      data: { skillName: 'Java', demandCount: 30, growthPercent: 12.4 },
    }),
    prisma.skillInDemand.create({
      data: { skillName: 'Swift', demandCount: 22, growthPercent: 19.8 },
    }),
    prisma.skillInDemand.create({
      data: { skillName: 'Docker', demandCount: 25, growthPercent: 22.1 },
    }),
  ]);

  console.log('✅ Created skills in demand');

  // Create students for applications
  const universities = [
    'UC Berkeley',
    'Stanford University',
    'MIT',
    'Carnegie Mellon University',
    'University of Washington',
    'Georgia Tech',
    'Caltech',
    'UCLA',
    'USC',
    'University of Texas at Austin',
    'Harvard University',
    'Princeton University',
  ];

  const majors = [
    'Computer Science',
    'Data Science',
    'Software Engineering',
    'Computer Engineering',
    'Information Systems',
    'Electrical Engineering',
    'Mathematics',
    'Statistics',
  ];

  const students = [];
  for (let i = 0; i < 50; i++) {
    const student = await prisma.user.create({
      data: {
        email: `student${i}@university.edu`,
        password: hashedPassword,
        firstName: `Student${i}`,
        lastName: `LastName${i}`,
        role: 'STUDENT',
        university:
          universities[Math.floor(Math.random() * universities.length)],
        major: majors[Math.floor(Math.random() * majors.length)],
        graduationYear: 2024 + Math.floor(Math.random() * 2), // 2024 or 2025
        gpa: 3.0 + Math.random() * 1.0, // 3.0 to 4.0
        headline: 'Software Developer',
        isVerified: true,
      },
    });
    students.push(student);
  }

  console.log(`✅ Created ${students.length} students`);

  // Create job applications over the last 90 days
  const sources = [
    'Direct Applications',
    'University Career Fair',
    'Employee Referral',
    'LinkedIn',
    'Job Boards',
  ];

  for (let i = 0; i < 324; i++) {
    // Match the number shown in UI
    const randomStudent = students[Math.floor(Math.random() * students.length)];
    const randomJob = jobs[Math.floor(Math.random() * jobs.length)];
    const randomSource = sources[Math.floor(Math.random() * sources.length)];

    // Generate applications over the last 90 days
    const daysAgo = Math.floor(Math.random() * 90);
    const appliedAt = new Date();
    appliedAt.setDate(appliedAt.getDate() - daysAgo);

    // Determine status based on age
    let status = 'PENDING';
    if (daysAgo > 30) {
      const statusRand = Math.random();
      if (statusRand < 0.15) status = 'ACCEPTED';
      else if (statusRand < 0.45) status = 'REJECTED';
      else if (statusRand < 0.75) status = 'REVIEWED';
    } else if (daysAgo > 14) {
      const statusRand = Math.random();
      if (statusRand < 0.08) status = 'ACCEPTED';
      else if (statusRand < 0.25) status = 'REJECTED';
      else if (statusRand < 0.6) status = 'REVIEWED';
    } else if (daysAgo > 7) {
      const statusRand = Math.random();
      if (statusRand < 0.03) status = 'ACCEPTED';
      else if (statusRand < 0.12) status = 'REJECTED';
      else if (statusRand < 0.35) status = 'REVIEWED';
    }

    await prisma.jobApplication.create({
      data: {
        resumeUrl: `https://resume-bucket.s3.amazonaws.com/${randomStudent.firstName}-${randomStudent.lastName}-resume.pdf`,
        coverLetter: `Dear Hiring Manager,\n\nI am excited to apply for the ${randomJob.title} position at TechCorp Solutions.`,
        status,
        appliedAt,
        jobId: randomJob.id,
        userId: randomStudent.id,
        source: randomSource,
      },
    });
  }

  console.log('✅ Created 324 job applications');

  // Get all applications for creating interviews
  const allApplications = await prisma.jobApplication.findMany({
    where: {
      OR: [{ status: 'REVIEWED' }, { status: 'ACCEPTED' }],
    },
  });

  // Create interviews for reviewed/accepted applications
  const interviewTypes = [
    'PHONE_SCREENING',
    'TECHNICAL',
    'BEHAVIORAL',
    'PANEL',
    'FINAL',
    'HR',
  ];

  for (let i = 0; i < Math.min(60, allApplications.length); i++) {
    const application = allApplications[i];
    const randomType =
      interviewTypes[Math.floor(Math.random() * interviewTypes.length)];

    const scheduledAt = new Date(application.appliedAt);
    scheduledAt.setDate(
      scheduledAt.getDate() + Math.floor(Math.random() * 30) + 1,
    );

    await prisma.interview.create({
      data: {
        applicationId: application.id,
        interviewType: randomType,
        scheduledAt,
        duration: 60,
        status: 'COMPLETED',
        rating: Math.floor(Math.random() * 3) + 3, // 3-5 rating
        interviewerIds: [jennifer.id],
        completedAt: scheduledAt,
        notes: 'Good candidate with strong technical skills.',
      },
    });
  }

  console.log('✅ Created interviews');

  console.log('🎉 Analytics seed completed successfully!');
  console.log('📊 Summary:');
  console.log(`- 1 employer (Jennifer Smith)`);
  console.log(`- 1 company (TechCorp Solutions)`);
  console.log(`- ${jobs.length} jobs`);
  console.log(`- ${students.length} students`);
  console.log(`- 324 job applications`);
  console.log(`- Up to 60 interviews`);
  console.log(`- 5 candidate sources`);
  console.log(`- 8 skills in demand`);
}

main()
  .catch((e) => {
    console.error('❌ Analytics seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
