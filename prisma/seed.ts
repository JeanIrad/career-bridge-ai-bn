// import { PrismaClient } from '@prisma/client';
// import * as bcrypt from 'bcrypt';

// const prisma = new PrismaClient();

// async function main() {
//   // Clean existing data in reverse dependency order
//   await prisma.interview.deleteMany();
//   await prisma.companyReview.deleteMany();
//   await prisma.skillInDemand.deleteMany();
//   await prisma.candidateSource.deleteMany();
//   await prisma.jobApplication.deleteMany();
//   await prisma.job.deleteMany();
//   await prisma.companyLocation.deleteMany();
//   await prisma.company.deleteMany();
//   await prisma.user.deleteMany();

//   console.log('🧹 Cleaned existing data');

//   // Create users with various roles
//   const hashedPassword = await bcrypt.hash('password123', 10);

//   // Create employers
//   const employers = await Promise.all([
//     prisma.user.create({
//       data: {
//         email: 'jennifer.smith@techcorp.com',
//         password: hashedPassword,
//         firstName: 'Jennifer',
//         lastName: 'Smith',
//         role: 'EMPLOYER',
//         university: 'Stanford University',
//         major: 'Computer Science',
//         headline: 'Senior Technical Recruiter at TechCorp',
//         bio: 'Passionate about connecting talented developers with amazing opportunities. 5+ years in tech recruitment.',
//         avatar:
//           'https://images.unsplash.com/photo-1494790108755-2616b2b3e4d8?w=150&h=150&fit=crop&crop=face',
//         phoneNumber: '+1-555-0101',
//         city: 'San Francisco',
//         state: 'CA',
//         country: 'USA',
//         isVerified: true,
//       },
//     }),
//     prisma.user.create({
//       data: {
//         email: 'mike.johnson@innovate.com',
//         password: hashedPassword,
//         firstName: 'Mike',
//         lastName: 'Johnson',
//         role: 'EMPLOYER',
//         university: 'MIT',
//         major: 'Engineering Management',
//         headline: 'Head of Talent Acquisition at InnovateCorp',
//         bio: 'Building diverse and inclusive engineering teams. Former software engineer turned recruiter.',
//         avatar:
//           'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
//         phoneNumber: '+1-555-0102',
//         city: 'Boston',
//         state: 'MA',
//         country: 'USA',
//         isVerified: true,
//       },
//     }),
//   ]);

//   // Create students
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
//         headline: 'Full-Stack Developer | React & Node.js',
//         bio: 'Passionate about building scalable web applications. Looking for full-time opportunities in software engineering.',
//         avatar:
//           'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
//         phoneNumber: '+1-555-0201',
//         city: 'Berkeley',
//         state: 'CA',
//         country: 'USA',
//         isVerified: true,
//         // skills: ['JavaScript', 'React', 'Node.js', 'Python', 'SQL'],
//         interests: [
//           'Software Engineering',
//           'Machine Learning',
//           'Web Development',
//         ],
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
//         headline: 'Data Scientist | Python & Machine Learning',
//         bio: 'Experienced in data analysis, machine learning, and statistical modeling. Seeking opportunities in data science.',
//         avatar:
//           'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
//         phoneNumber: '+1-555-0202',
//         city: 'Palo Alto',
//         state: 'CA',
//         country: 'USA',
//         isVerified: true,
//         // skills: ['Python', 'R', 'SQL', 'TensorFlow', 'Pandas'],
//         interests: ['Data Science', 'Machine Learning', 'Analytics'],
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
//         headline: 'Software Engineer | Backend Development',
//         bio: 'Focused on backend systems and distributed architecture. Experienced with cloud technologies.',
//         avatar:
//           'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
//         phoneNumber: '+1-555-0203',
//         city: 'Cambridge',
//         state: 'MA',
//         country: 'USA',
//         isVerified: true,
//         // skills: ['Java', 'Spring Boot', 'AWS', 'Docker', 'Kubernetes'],
//         interests: ['Backend Development', 'Cloud Computing', 'DevOps'],
//       },
//     }),
//     prisma.user.create({
//       data: {
//         email: 'emma.martinez@student.edu',
//         password: hashedPassword,
//         firstName: 'Emma',
//         lastName: 'Martinez',
//         role: 'STUDENT',
//         university: 'Carnegie Mellon University',
//         major: 'Software Engineering',
//         graduationYear: 2024,
//         gpa: 3.85,
//         headline: 'Frontend Developer | React & TypeScript',
//         bio: 'Passionate about creating beautiful and intuitive user interfaces. Strong background in modern web technologies.',
//         avatar:
//           'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
//         phoneNumber: '+1-555-0204',
//         city: 'Pittsburgh',
//         state: 'PA',
//         country: 'USA',
//         isVerified: true,
//         skills: ['React', 'TypeScript', 'CSS', 'JavaScript', 'Vue.js'],
//         interests: ['Frontend Development', 'UI/UX Design', 'Web Technologies'],
//       },
//     }),
//     prisma.user.create({
//       data: {
//         email: 'david.kim@student.edu',
//         password: hashedPassword,
//         firstName: 'David',
//         lastName: 'Kim',
//         role: 'STUDENT',
//         university: 'University of Washington',
//         major: 'Computer Science',
//         graduationYear: 2024,
//         gpa: 3.6,
//         headline: 'Mobile Developer | iOS & Android',
//         bio: 'Experienced in mobile app development with focus on native iOS and cross-platform solutions.',
//         avatar:
//           'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
//         phoneNumber: '+1-555-0205',
//         city: 'Seattle',
//         state: 'WA',
//         country: 'USA',
//         isVerified: true,
//         skills: ['Swift', 'Kotlin', 'React Native', 'Flutter', 'iOS'],
//         interests: ['Mobile Development', 'iOS Development', 'Cross-Platform'],
//       },
//     }),
//   ]);

//   console.log('👥 Created users');

//   // Create companies
//   const companies = await Promise.all([
//     prisma.company.create({
//       data: {
//         name: 'TechCorp Solutions',
//         description:
//           'Leading software development company specializing in enterprise solutions and cloud technologies.',
//         industry: 'Technology',
//         size: '500-1000',
//         type: 'Private',
//         foundedYear: 2015,
//         website: 'https://techcorp.com',
//         logo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&h=200&fit=crop',
//         phone: '+1-555-1000',
//         email: 'careers@techcorp.com',
//         linkedIn: 'https://linkedin.com/company/techcorp',
//         specializations: ['Cloud Computing', 'Enterprise Software', 'AI/ML'],
//         isVerified: true,
//         ownerId: employers[0].id,
//       },
//     }),
//     prisma.company.create({
//       data: {
//         name: 'InnovateCorp',
//         description:
//           'Innovative startup focused on cutting-edge technology solutions and digital transformation.',
//         industry: 'Technology',
//         size: '100-500',
//         type: 'Private',
//         foundedYear: 2018,
//         website: 'https://innovatecorp.com',
//         logo: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=200&fit=crop',
//         phone: '+1-555-2000',
//         email: 'jobs@innovatecorp.com',
//         linkedIn: 'https://linkedin.com/company/innovatecorp',
//         specializations: ['Fintech', 'Blockchain', 'Mobile Development'],
//         isVerified: true,
//         ownerId: employers[1].id,
//       },
//     }),
//   ]);

//   console.log('🏢 Created companies');

//   // Create company locations
//   await Promise.all([
//     prisma.companyLocation.create({
//       data: {
//         companyId: companies[0].id,
//         address: '123 Tech Street, Suite 100',
//         city: 'San Francisco',
//         state: 'CA',
//         country: 'USA',
//         zipCode: '94102',
//         countryCode: 'US',
//         isHeadquarters: true,
//         locationType: 'headquarters',
//         timezone: 'America/Los_Angeles',
//       },
//     }),
//     prisma.companyLocation.create({
//       data: {
//         companyId: companies[1].id,
//         address: '456 Innovation Ave',
//         city: 'Boston',
//         state: 'MA',
//         country: 'USA',
//         zipCode: '02101',
//         countryCode: 'US',
//         isHeadquarters: true,
//         locationType: 'headquarters',
//         timezone: 'America/New_York',
//       },
//     }),
//   ]);

//   console.log('📍 Created company locations');

//   // Create jobs
//   const jobs = await Promise.all([
//     prisma.job.create({
//       data: {
//         title: 'Senior Full-Stack Developer',
//         description:
//           'We are looking for an experienced full-stack developer to join our growing team. You will work on building scalable web applications using modern technologies.',
//         requirements: [
//           '5+ years of experience in full-stack development',
//           'Proficiency in React, Node.js, and TypeScript',
//           'Experience with cloud platforms (AWS, Azure, or GCP)',
//           'Strong understanding of database design and optimization',
//           'Experience with CI/CD pipelines',
//         ],
//         type: 'Full-time',
//         location: 'San Francisco, CA (Hybrid)',
//         salary: {
//           min: 120000,
//           max: 160000,
//           currency: 'USD',
//           period: 'annually',
//         },
//         applicationDeadline: new Date('2024-03-30'),
//         status: 'ACTIVE',
//         companyId: companies[0].id,
//         postedById: employers[0].id,
//       },
//     }),
//     prisma.job.create({
//       data: {
//         title: 'Data Scientist',
//         description:
//           'Join our data science team to build predictive models and extract insights from large datasets. Work with cutting-edge ML technologies.',
//         requirements: [
//           'Masters degree in Data Science, Statistics, or related field',
//           'Strong programming skills in Python and R',
//           'Experience with machine learning frameworks (TensorFlow, PyTorch)',
//           'Knowledge of statistical analysis and hypothesis testing',
//           'Experience with SQL and data visualization tools',
//         ],
//         type: 'Full-time',
//         location: 'San Francisco, CA (Remote)',
//         salary: {
//           min: 130000,
//           max: 170000,
//           currency: 'USD',
//           period: 'annually',
//         },
//         applicationDeadline: new Date('2024-04-15'),
//         status: 'ACTIVE',
//         companyId: companies[0].id,
//         postedById: employers[0].id,
//       },
//     }),
//     prisma.job.create({
//       data: {
//         title: 'Frontend Developer',
//         description:
//           'Build beautiful and responsive user interfaces for our web applications. Work with a talented design team to create exceptional user experiences.',
//         requirements: [
//           '3+ years of experience in frontend development',
//           'Expert knowledge of React and TypeScript',
//           'Experience with modern CSS frameworks (Tailwind, styled-components)',
//           'Understanding of web accessibility and performance optimization',
//           'Experience with testing frameworks (Jest, Cypress)',
//         ],
//         type: 'Full-time',
//         location: 'Boston, MA (On-site)',
//         salary: {
//           min: 90000,
//           max: 130000,
//           currency: 'USD',
//           period: 'annually',
//         },
//         applicationDeadline: new Date('2024-04-01'),
//         status: 'ACTIVE',
//         companyId: companies[1].id,
//         postedById: employers[1].id,
//       },
//     }),
//     prisma.job.create({
//       data: {
//         title: 'Backend Engineer',
//         description:
//           'Design and implement scalable backend systems and APIs. Work with microservices architecture and cloud technologies.',
//         requirements: [
//           '4+ years of backend development experience',
//           'Proficiency in Java, Spring Boot, or similar frameworks',
//           'Experience with microservices architecture',
//           'Knowledge of containerization (Docker, Kubernetes)',
//           'Experience with message queues and event-driven architecture',
//         ],
//         type: 'Full-time',
//         location: 'Boston, MA (Hybrid)',
//         salary: {
//           min: 110000,
//           max: 150000,
//           currency: 'USD',
//           period: 'annually',
//         },
//         applicationDeadline: new Date('2024-03-25'),
//         status: 'ACTIVE',
//         companyId: companies[1].id,
//         postedById: employers[1].id,
//       },
//     }),
//     prisma.job.create({
//       data: {
//         title: 'Mobile Developer - iOS',
//         description:
//           'Develop native iOS applications with focus on performance and user experience. Work on consumer-facing mobile products.',
//         requirements: [
//           '3+ years of iOS development experience',
//           'Proficiency in Swift and Objective-C',
//           'Experience with iOS frameworks (UIKit, SwiftUI)',
//           'Knowledge of app store submission process',
//           'Understanding of mobile design patterns and best practices',
//         ],
//         type: 'Full-time',
//         location: 'San Francisco, CA (Hybrid)',
//         salary: {
//           min: 100000,
//           max: 140000,
//           currency: 'USD',
//           period: 'annually',
//         },
//         applicationDeadline: new Date('2024-04-10'),
//         status: 'ACTIVE',
//         companyId: companies[0].id,
//         postedById: employers[0].id,
//       },
//     }),
//   ]);

//   console.log('💼 Created jobs');

//   // Create candidate sources
//   const candidateSources = await Promise.all([
//     prisma.candidateSource.create({
//       data: {
//         name: 'Direct Applications',
//         description: 'Applications submitted directly through company website',
//       },
//     }),
//     prisma.candidateSource.create({
//       data: {
//         name: 'University Career Fair',
//         description:
//           'Applications from university career fairs and campus events',
//       },
//     }),
//     prisma.candidateSource.create({
//       data: {
//         name: 'Employee Referral',
//         description: 'Applications from employee referrals',
//       },
//     }),
//     prisma.candidateSource.create({
//       data: {
//         name: 'LinkedIn',
//         description: 'Applications sourced through LinkedIn',
//       },
//     }),
//     prisma.candidateSource.create({
//       data: {
//         name: 'Job Boards',
//         description: 'Applications from job boards like Indeed, Glassdoor',
//       },
//     }),
//   ]);

//   console.log('📊 Created candidate sources');

//   // Create skills in demand
//   const skillsInDemand = await Promise.all([
//     prisma.skillInDemand.create({
//       data: {
//         skillName: 'React',
//         demandCount: 45,
//         growthPercent: 23.5,
//       },
//     }),
//     prisma.skillInDemand.create({
//       data: {
//         skillName: 'Python',
//         demandCount: 38,
//         growthPercent: 18.2,
//       },
//     }),
//     prisma.skillInDemand.create({
//       data: {
//         skillName: 'TypeScript',
//         demandCount: 35,
//         growthPercent: 31.7,
//       },
//     }),
//     prisma.skillInDemand.create({
//       data: {
//         skillName: 'Node.js',
//         demandCount: 32,
//         growthPercent: 15.8,
//       },
//     }),
//     prisma.skillInDemand.create({
//       data: {
//         skillName: 'AWS',
//         demandCount: 28,
//         growthPercent: 27.3,
//       },
//     }),
//     prisma.skillInDemand.create({
//       data: {
//         skillName: 'Docker',
//         demandCount: 25,
//         growthPercent: 22.1,
//       },
//     }),
//     prisma.skillInDemand.create({
//       data: {
//         skillName: 'SQL',
//         demandCount: 30,
//         growthPercent: 12.4,
//       },
//     }),
//     prisma.skillInDemand.create({
//       data: {
//         skillName: 'Machine Learning',
//         demandCount: 22,
//         growthPercent: 35.6,
//       },
//     }),
//   ]);

//   console.log('🎯 Created skills in demand');

//   // Generate job applications with varied timestamps
//   const applications = [];
//   const sources = [
//     'Direct Applications',
//     'University Career Fair',
//     'Employee Referral',
//     'LinkedIn',
//     'Job Boards',
//   ];

//   for (let i = 0; i < 150; i++) {
//     const randomStudent = students[Math.floor(Math.random() * students.length)];
//     const randomJob = jobs[Math.floor(Math.random() * jobs.length)];
//     const randomSource = sources[Math.floor(Math.random() * sources.length)];

//     // Generate applications over the last 90 days
//     const daysAgo = Math.floor(Math.random() * 90);
//     const appliedAt = new Date();
//     appliedAt.setDate(appliedAt.getDate() - daysAgo);

//     // Determine status based on how old the application is
//     let status = 'PENDING';
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
//       coverLetter: `Dear Hiring Manager,\n\nI am excited to apply for the ${randomJob.title} position at your company. With my background in ${randomStudent.major} and experience in ${randomStudent.skills.slice(0, 2).join(' and ')}, I believe I would be a great fit for this role.\n\nThank you for your consideration.\n\nBest regards,\n${randomStudent.firstName} ${randomStudent.lastName}`,
//       status: status as any,
//       appliedAt,
//       jobId: randomJob.id,
//       userId: randomStudent.id,
//       source: randomSource,
//       feedback:
//         status === 'REJECTED'
//           ? 'Thank you for your interest. We have decided to move forward with other candidates.'
//           : status === 'ACCEPTED'
//             ? 'Congratulations! We would like to extend an offer.'
//             : null,
//     });
//   }

//   const createdApplications = await Promise.all(
//     applications.map((app) => prisma.jobApplication.create({ data: app })),
//   );

//   console.log('📝 Created job applications');

//   // Create interviews for some applications
//   const interviewTypes = [
//     'PHONE_SCREENING',
//     'TECHNICAL',
//     'BEHAVIORAL',
//     'PANEL',
//     'FINAL',
//     'HR',
//   ];
//   const interviewStatuses = [
//     'SCHEDULED',
//     'COMPLETED',
//     'CANCELLED',
//     'RESCHEDULED',
//   ];

//   for (let i = 0; i < 60; i++) {
//     const randomApplication =
//       createdApplications[
//         Math.floor(Math.random() * createdApplications.length)
//       ];
//     if (
//       randomApplication.status === 'REVIEWED' ||
//       randomApplication.status === 'ACCEPTED'
//     ) {
//       const randomType =
//         interviewTypes[Math.floor(Math.random() * interviewTypes.length)];
//       const randomStatus =
//         interviewStatuses[Math.floor(Math.random() * interviewStatuses.length)];

//       // Schedule interviews within 30 days of application
//       const scheduledAt = new Date(randomApplication.appliedAt);
//       scheduledAt.setDate(
//         scheduledAt.getDate() + Math.floor(Math.random() * 30) + 1,
//       );

//       await prisma.interview.create({
//         data: {
//           applicationId: randomApplication.id,
//           interviewType: randomType as any,
//           scheduledAt,
//           duration: 60,
//           status: randomStatus as any,
//           notes:
//             randomStatus === 'COMPLETED'
//               ? 'Candidate showed strong technical skills and good communication.'
//               : null,
//           rating:
//             randomStatus === 'COMPLETED'
//               ? Math.floor(Math.random() * 3) + 3
//               : null, // 3-5 rating
//           interviewerIds: [
//             employers[Math.floor(Math.random() * employers.length)].id,
//           ],
//           meetingLink: 'https://zoom.us/j/1234567890',
//           completedAt: randomStatus === 'COMPLETED' ? scheduledAt : null,
//         },
//       });
//     }
//   }

//   console.log('🎤 Created interviews');

//   // Create company reviews
//   for (let i = 0; i < 25; i++) {
//     const randomStudent = students[Math.floor(Math.random() * students.length)];
//     const randomCompany =
//       companies[Math.floor(Math.random() * companies.length)];

//     const reviewsData = [
//       {
//         rating: 5,
//         title: 'Great place to work!',
//         content:
//           'Amazing company culture and great opportunities for growth. The team is very supportive and the projects are challenging.',
//         pros: 'Great work-life balance, competitive salary, amazing benefits, supportive management',
//         cons: 'Sometimes the workload can be intense during product launches',
//       },
//       {
//         rating: 4,
//         title: 'Good experience overall',
//         content:
//           'Had a positive experience working here. Good learning opportunities and decent compensation.',
//         pros: 'Good learning environment, modern tech stack, flexible working hours',
//         cons: 'Limited career advancement opportunities, could improve communication between teams',
//       },
//       {
//         rating: 3,
//         title: 'Average experience',
//         content:
//           'The company has potential but needs improvement in several areas.',
//         pros: 'Interesting projects, decent team members',
//         cons: 'Poor management, unclear expectations, limited resources',
//       },
//       {
//         rating: 4,
//         title: 'Solid company',
//         content:
//           'Good place to start your career. Learned a lot and worked with talented people.',
//         pros: 'Strong mentorship program, good training, diverse projects',
//         cons: 'Salary could be more competitive, limited remote work options',
//       },
//     ];

//     const randomReview =
//       reviewsData[Math.floor(Math.random() * reviewsData.length)];

//     await prisma.companyReview.create({
//       data: {
//         companyId: randomCompany.id,
//         reviewerId: randomStudent.id,
//         rating: randomReview.rating,
//         title: randomReview.title,
//         content: randomReview.content,
//         pros: randomReview.pros,
//         cons: randomReview.cons,
//         isAnonymous: Math.random() > 0.3, // 70% anonymous
//         isVerified: true,
//       },
//     });
//   }

//   console.log('⭐ Created company reviews');

//   console.log('🎉 Seeding completed successfully!');
//   console.log('\n📊 Generated data summary:');
//   console.log(`- ${employers.length} employers`);
//   console.log(`- ${students.length} students`);
//   console.log(`- ${companies.length} companies`);
//   console.log(`- ${jobs.length} jobs`);
//   console.log(`- ${applications.length} job applications`);
//   console.log(`- 60 interviews`);
//   console.log(`- 25 company reviews`);
//   console.log(`- ${skillsInDemand.length} skills in demand`);
//   console.log(`- ${candidateSources.length} candidate sources`);
// }

// main()
//   .catch((e) => {
//     console.error('❌ Seeding failed:', e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
