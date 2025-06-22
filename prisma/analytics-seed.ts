// import { PrismaClient } from '@prisma/client';
// import * as bcrypt from 'bcrypt';

// const prisma = new PrismaClient();

// async function main() {
//   console.log('🧹 Cleaning existing analytics data...');

//   // Clean existing data
//   await prisma.interview.deleteMany();
//   await prisma.companyReview.deleteMany();
//   await prisma.skillInDemand.deleteMany();
//   await prisma.candidateSource.deleteMany();
//   await prisma.jobApplication.deleteMany();
//   await prisma.job.deleteMany();

//   console.log('📊 Creating analytics data...');

//   const hashedPassword = await bcrypt.hash('password123', 10);

//   // Create Jennifer Smith (the employer from the UI)
//   const jennifer = await prisma.user.upsert({
//     where: { email: 'jennifer.smith@techcorp.com' },
//     update: {},
//     create: {
//       email: 'jennifer.smith@techcorp.com',
//       password: hashedPassword,
//       firstName: 'Jennifer',
//       lastName: 'Smith',
//       role: 'EMPLOYER',
//       university: 'Stanford University',
//       major: 'Computer Science',
//       headline: 'Senior Technical Recruiter at TechCorp',
//       bio: 'Passionate about connecting talented developers with amazing opportunities. 5+ years in tech recruitment.',
//       avatar:
//         'https://images.unsplash.com/photo-1494790108755-2616b2b3e4d8?w=150&h=150&fit=crop&crop=face',
//       phoneNumber: '+1-555-0101',
//       city: 'San Francisco',
//       state: 'CA',
//       country: 'USA',
//       isVerified: true,
//     },
//   });

//   // Create a company for Jennifer
//   const company = await prisma.company.upsert({
//     where: { id: 'techcorp-id' },
//     update: {},
//     create: {
//       id: 'techcorp-id',
//       name: 'TechCorp Solutions',
//       description: 'Leading software development company',
//       industry: 'Technology',
//       size: '500-1000',
//       type: 'Private',
//       foundedYear: 2015,
//       website: 'https://techcorp.com',
//       logo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&h=200&fit=crop',
//       isVerified: true,
//       ownerId: jennifer.id,
//     },
//   });

//   // Create jobs posted by Jennifer
//   const jobs = await Promise.all([
//     prisma.job.create({
//       data: {
//         title: 'Senior Full-Stack Developer',
//         description: 'We are looking for an experienced full-stack developer.',
//         requirements: ['5+ years experience', 'React', 'Node.js'],
//         type: 'Full-time',
//         location: 'San Francisco, CA',
//         salary: { min: 120000, max: 160000, currency: 'USD' },
//         applicationDeadline: new Date('2024-03-30'),
//         status: 'ACTIVE',
//         companyId: company.id,
//         postedById: jennifer.id,
//       },
//     }),
//     prisma.job.create({
//       data: {
//         title: 'Data Scientist',
//         description: 'Join our data science team.',
//         requirements: ['Masters degree', 'Python', 'Machine Learning'],
//         type: 'Full-time',
//         location: 'San Francisco, CA',
//         salary: { min: 130000, max: 170000, currency: 'USD' },
//         applicationDeadline: new Date('2024-04-15'),
//         status: 'ACTIVE',
//         companyId: company.id,
//         postedById: jennifer.id,
//       },
//     }),
//     prisma.job.create({
//       data: {
//         title: 'Frontend Developer',
//         description: 'Build beautiful user interfaces.',
//         requirements: ['3+ years experience', 'React', 'TypeScript'],
//         type: 'Full-time',
//         location: 'San Francisco, CA',
//         salary: { min: 90000, max: 130000, currency: 'USD' },
//         applicationDeadline: new Date('2024-04-01'),
//         status: 'ACTIVE',
//         companyId: company.id,
//         postedById: jennifer.id,
//       },
//     }),
//   ]);

//   // Create candidate sources
//   await Promise.all([
//     prisma.candidateSource.create({
//       data: {
//         name: 'Direct Applications',
//         description: 'Company website applications',
//       },
//     }),
//     prisma.candidateSource.create({
//       data: {
//         name: 'University Career Fair',
//         description: 'Campus recruiting events',
//       },
//     }),
//     prisma.candidateSource.create({
//       data: { name: 'Employee Referral', description: 'Employee referrals' },
//     }),
//     prisma.candidateSource.create({
//       data: { name: 'LinkedIn', description: 'LinkedIn sourcing' },
//     }),
//     prisma.candidateSource.create({
//       data: { name: 'Job Boards', description: 'Indeed, Glassdoor, etc.' },
//     }),
//   ]);

//   // Create skills in demand
//   await Promise.all([
//     prisma.skillInDemand.create({
//       data: { skillName: 'React', demandCount: 45, growthPercent: 23.5 },
//     }),
//     prisma.skillInDemand.create({
//       data: { skillName: 'Python', demandCount: 38, growthPercent: 18.2 },
//     }),
//     prisma.skillInDemand.create({
//       data: { skillName: 'TypeScript', demandCount: 35, growthPercent: 31.7 },
//     }),
//     prisma.skillInDemand.create({
//       data: { skillName: 'Node.js', demandCount: 32, growthPercent: 15.8 },
//     }),
//     prisma.skillInDemand.create({
//       data: { skillName: 'AWS', demandCount: 28, growthPercent: 27.3 },
//     }),
//   ]);

//   // Create students for applications
//   const students = await Promise.all([
//     prisma.user.create({
//       data: {
//         email: 'alex.chen@student.edu',
//         password: hashedPassword,
//         firstName: 'Alex',
//         lastName: 'Chen',
//         role: 'STUDENT',
//         university: 'UC Berkeley',
//         major: 'Computer Science',
//         graduationYear: 2024,
//         gpa: 3.8,
//         headline: 'Full-Stack Developer',
//         isVerified: true,
//       },
//     }),
//     prisma.user.create({
//       data: {
//         email: 'sarah.davis@student.edu',
//         password: hashedPassword,
//         firstName: 'Sarah',
//         lastName: 'Davis',
//         role: 'STUDENT',
//         university: 'Stanford University',
//         major: 'Data Science',
//         graduationYear: 2024,
//         gpa: 3.9,
//         headline: 'Data Scientist',
//         isVerified: true,
//       },
//     }),
//     prisma.user.create({
//       data: {
//         email: 'john.wilson@student.edu',
//         password: hashedPassword,
//         firstName: 'John',
//         lastName: 'Wilson',
//         role: 'STUDENT',
//         university: 'MIT',
//         major: 'Computer Science',
//         graduationYear: 2025,
//         gpa: 3.7,
//         headline: 'Software Engineer',
//         isVerified: true,
//       },
//     }),
//   ]);

//   // Create job applications over the last 90 days
//   const sources = [
//     'Direct Applications',
//     'University Career Fair',
//     'Employee Referral',
//     'LinkedIn',
//     'Job Boards',
//   ];
//   const applications = [];

//   for (let i = 0; i < 324; i++) {
//     // Match the number shown in UI
//     const randomStudent = students[Math.floor(Math.random() * students.length)];
//     const randomJob = jobs[Math.floor(Math.random() * jobs.length)];
//     const randomSource = sources[Math.floor(Math.random() * sources.length)];

//     // Generate applications over the last 90 days
//     const daysAgo = Math.floor(Math.random() * 90);
//     const appliedAt = new Date();
//     appliedAt.setDate(appliedAt.getDate() - daysAgo);

//     // Determine status based on age
//     let status: 'PENDING' | 'REVIEWED' | 'ACCEPTED' | 'REJECTED' = 'PENDING';
//     if (daysAgo > 30) {
//       const statusRand = Math.random();
//       if (statusRand < 0.15) status = 'ACCEPTED';
//       else if (statusRand < 0.45) status = 'REJECTED';
//       else if (statusRand < 0.75) status = 'REVIEWED';
//     } else if (daysAgo > 14) {
//       const statusRand = Math.random();
//       if (statusRand < 0.08) status = 'ACCEPTED';
//       else if (statusRand < 0.25) status = 'REJECTED';
//       else if (statusRand < 0.6) status = 'REVIEWED';
//     } else if (daysAgo > 7) {
//       const statusRand = Math.random();
//       if (statusRand < 0.03) status = 'ACCEPTED';
//       else if (statusRand < 0.12) status = 'REJECTED';
//       else if (statusRand < 0.35) status = 'REVIEWED';
//     }

//     applications.push({
//       resumeUrl: `https://resume-bucket.s3.amazonaws.com/${randomStudent.firstName}-${randomStudent.lastName}-resume.pdf`,
//       coverLetter: `Dear Hiring Manager,\n\nI am excited to apply for the ${randomJob.title} position.`,
//       status,
//       appliedAt,
//       jobId: randomJob.id,
//       userId: randomStudent.id,
//       source: randomSource,
//     });
//   }

//   const createdApplications = await Promise.all(
//     applications.map((app) => prisma.jobApplication.create({ data: app })),
//   );

//   // Create interviews for some reviewed/accepted applications
//   const interviewTypes: Array<
//     'PHONE_SCREENING' | 'TECHNICAL' | 'BEHAVIORAL' | 'PANEL' | 'FINAL'
//   > = ['PHONE_SCREENING', 'TECHNICAL', 'BEHAVIORAL', 'PANEL', 'FINAL'];

//   for (let i = 0; i < 60; i++) {
//     const reviewedApps = createdApplications.filter(
//       (app) => app.status === 'REVIEWED' || app.status === 'ACCEPTED',
//     );
//     if (reviewedApps.length === 0) continue;

//     const randomApplication =
//       reviewedApps[Math.floor(Math.random() * reviewedApps.length)];
//     const randomType =
//       interviewTypes[Math.floor(Math.random() * interviewTypes.length)];

//     const scheduledAt = new Date(randomApplication.appliedAt);
//     scheduledAt.setDate(
//       scheduledAt.getDate() + Math.floor(Math.random() * 30) + 1,
//     );

//     await prisma.interview.create({
//       data: {
//         applicationId: randomApplication.id,
//         interviewType: randomType,
//         scheduledAt,
//         duration: 60,
//         status: 'COMPLETED',
//         rating: Math.floor(Math.random() * 3) + 3, // 3-5 rating
//         interviewerIds: [jennifer.id],
//         completedAt: scheduledAt,
//       },
//     });
//   }

//   console.log('✅ Analytics seed completed successfully!');
//   console.log('📊 Created:');
//   console.log(`- 1 employer (Jennifer Smith)`);
//   console.log(`- 1 company (TechCorp Solutions)`);
//   console.log(`- ${jobs.length} jobs`);
//   console.log(`- ${applications.length} job applications`);
//   console.log(`- 60 interviews`);
//   console.log(`- 5 candidate sources`);
//   console.log(`- 5 skills in demand`);
// }

// main()
//   .catch((e) => {
//     console.error('❌ Analytics seeding failed:', e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
