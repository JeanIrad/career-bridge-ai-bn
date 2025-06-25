import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';
import { CampusEventType } from '@prisma/client';

const prisma = new PrismaClient();

// Helper functions
const getRandomElement = <T>(array: T[]): T =>
  array[Math.floor(Math.random() * array.length)];
const getRandomElements = <T>(array: T[], count: number): T[] => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, array.length));
};

// Constants for realistic data
const COMPANIES = [
  {
    name: 'TechFlow Solutions',
    industry: 'Technology',
    description: 'Leading software development company',
  },
  {
    name: 'Global Finance Corp',
    industry: 'Finance',
    description: 'International financial services',
  },
  {
    name: 'HealthCare Innovations',
    industry: 'Healthcare',
    description: 'Medical technology solutions',
  },
  {
    name: 'EduTech Systems',
    industry: 'Education',
    description: 'Educational technology platform',
  },
  {
    name: 'GreenEnergy Co',
    industry: 'Energy',
    description: 'Renewable energy solutions',
  },
  {
    name: 'DataViz Analytics',
    industry: 'Analytics',
    description: 'Data visualization and business intelligence',
  },
  {
    name: 'CloudFirst Technologies',
    industry: 'Cloud Computing',
    description: 'Cloud infrastructure services',
  },
  {
    name: 'AI Research Lab',
    industry: 'Artificial Intelligence',
    description: 'AI and machine learning research',
  },
  {
    name: 'CyberSecure Inc',
    industry: 'Cybersecurity',
    description: 'Cybersecurity solutions provider',
  },
  {
    name: 'BioTech Innovations',
    industry: 'Biotechnology',
    description: 'Biotechnology research and development',
  },
];

const JOB_TITLES = [
  'Software Engineer',
  'Data Scientist',
  'Product Manager',
  'UX Designer',
  'DevOps Engineer',
  'Full Stack Developer',
  'Backend Developer',
  'Frontend Developer',
  'Mobile Developer',
  'Security Analyst',
  'Business Analyst',
  'Project Manager',
  'QA Engineer',
  'Marketing Manager',
  'Sales Representative',
  'HR Specialist',
  'Financial Analyst',
  'Research Scientist',
];

const INTERNSHIP_TITLES = [
  'Software Engineering Intern',
  'Data Science Intern',
  'Marketing Intern',
  'Design Intern',
  'Business Development Intern',
  'Research Intern',
  'Product Management Intern',
  'HR Intern',
  'Finance Intern',
  'Operations Intern',
  'Content Writing Intern',
  'Social Media Intern',
];

const SKILLS = [
  'JavaScript',
  'Python',
  'React',
  'Node.js',
  'SQL',
  'AWS',
  'Docker',
  'Kubernetes',
  'Machine Learning',
  'Data Analysis',
  'Project Management',
  'Agile',
  'Scrum',
  'UI/UX Design',
  'Figma',
  'Adobe Creative Suite',
  'Git',
  'MongoDB',
  'PostgreSQL',
  'Java',
  'C++',
  'TypeScript',
  'Vue.js',
  'Angular',
  'Firebase',
  'GraphQL',
  'REST APIs',
];

const UNIVERSITIES = [
  {
    name: 'Massachusetts Institute of Technology',
    city: 'Cambridge',
    state: 'MA',
    country: 'USA',
  },
  {
    name: 'Stanford University',
    city: 'Stanford',
    state: 'CA',
    country: 'USA',
  },
  {
    name: 'Harvard University',
    city: 'Cambridge',
    state: 'MA',
    country: 'USA',
  },
  {
    name: 'University of California, Berkeley',
    city: 'Berkeley',
    state: 'CA',
    country: 'USA',
  },
  {
    name: 'Carnegie Mellon University',
    city: 'Pittsburgh',
    state: 'PA',
    country: 'USA',
  },
  {
    name: 'University of Washington',
    city: 'Seattle',
    state: 'WA',
    country: 'USA',
  },
  {
    name: 'Georgia Institute of Technology',
    city: 'Atlanta',
    state: 'GA',
    country: 'USA',
  },
  {
    name: 'University of Toronto',
    city: 'Toronto',
    state: 'ON',
    country: 'Canada',
  },
  {
    name: 'University of Oxford',
    city: 'Oxford',
    state: 'England',
    country: 'UK',
  },
  {
    name: 'ETH Zurich',
    city: 'Zurich',
    state: 'Zurich',
    country: 'Switzerland',
  },
];

const EVENT_TYPES = [
  'CAREER_FAIR',
  'INFO_SESSION',
  'NETWORKING_EVENT',
  'TECH_TALK',
  'WORKSHOP',
  'HACKATHON',
  'INTERVIEW_DAY',
  'COMPANY_PRESENTATION',
  'PANEL_DISCUSSION',
];

const MAJORS = [
  'Computer Science',
  'Software Engineering',
  'Data Science',
  'Business Administration',
  'Marketing',
  'Finance',
  'Mechanical Engineering',
  'Electrical Engineering',
  'Information Systems',
  'Psychology',
  'Economics',
  'Mathematics',
  'Physics',
  'Chemistry',
];

async function createUsers() {
  console.log('Creating users...');
  const users: any[] = [];

  // Create admin user
  //   const adminUser = await prisma.user.create({
  //     data: {
  //       email: 'admin@jobplatform.com',
  //       password: await bcrypt.hash('admin123', 10),
  //       firstName: 'Admin',
  //       lastName: 'User',
  //       role: 'SUPER_ADMIN',
  //       isVerified: true,
  //       emailVerified: true,
  //       phoneNumber: '+1234567890',
  //       university: 'Job Platform University',
  //       major: 'Computer Science',
  //       graduationYear: 2024,
  //       gpa: 3.8,
  //       bio: 'Platform administrator with extensive experience in job placement systems.',
  //       headline: 'Platform Administrator',
  //       skills: {
  //         createMany: {
  //           data: [
  //             'System Administration',
  //             'User Management',
  //             'Platform Operations',
  //           ].map((skill) => ({
  //             name: skill,
  //             endorsements: faker.number.int({ min: 10, max: 50 }),
  //           })),
  //         },
  //       },
  //     },
  //   });
  //   users.push(adminUser);

  // Create students
  for (let i = 0; i < 50; i++) {
    const user = await prisma.user.create({
      data: {
        email: faker.internet.email(),
        password: await bcrypt.hash('password123', 10),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        role: 'STUDENT',
        isVerified: faker.datatype.boolean(),
        emailVerified: faker.datatype.boolean(),
        phoneNumber: faker.phone.number(),
        address: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        country: faker.location.country(),
        dateOfBirth: faker.date.between({
          from: '1995-01-01',
          to: '2005-12-31',
        }),
        gender: getRandomElement(['MALE', 'FEMALE', 'OTHER']),
        nationality: faker.location.country(),
        languages: getRandomElements(
          ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese'],
          2,
        ),
        interests: getRandomElements(
          ['Technology', 'Sports', 'Music', 'Travel', 'Reading', 'Gaming'],
          3,
        ),
        gpa: parseFloat(
          faker.number
            .float({ min: 2.0, max: 4.0, fractionDigits: 1 })
            .toFixed(1),
        ),
        graduationYear: faker.number.int({ min: 2024, max: 2027 }),
        university: getRandomElement(UNIVERSITIES).name,
        major: getRandomElement(MAJORS),
        bio: faker.lorem.paragraph(3),
        headline: faker.person.jobTitle(),
        availability: getRandomElement([
          'Full-time',
          'Part-time',
          'Internship',
          'Contract',
        ]),
        skills: {
          createMany: {
            data: getRandomElements(
              SKILLS,
              faker.number.int({ min: 3, max: 8 }),
            ).map((skill) => ({
              name: skill,
              endorsements: faker.number.int({ min: 0, max: 20 }),
            })),
          },
        },
        education: {
          createMany: {
            data: [
              {
                institution: getRandomElement(UNIVERSITIES).name,
                degree: getRandomElement([
                  'Bachelor of Science',
                  'Bachelor of Arts',
                  'Master of Science',
                ]),
                field: getRandomElement(MAJORS),
                startDate: faker.date.between({
                  from: '2020-01-01',
                  to: '2022-12-31',
                }),
                endDate: faker.date.between({
                  from: '2023-01-01',
                  to: '2027-12-31',
                }),
                grade: faker.number
                  .float({ min: 2.5, max: 4.0, fractionDigits: 1 })
                  .toString(),
                activities: getRandomElements(
                  [
                    'Student Government',
                    'Debate Club',
                    'Coding Club',
                    'Sports Team',
                  ],
                  2,
                ),
              },
            ],
          },
        },
      },
    });
    users.push(user);
  }

  // Create employers
  for (let i = 0; i < 20; i++) {
    const user = await prisma.user.create({
      data: {
        email: faker.internet.email(),
        password: await bcrypt.hash('password123', 10),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        role: 'EMPLOYER',
        isVerified: true,
        emailVerified: true,
        phoneNumber: faker.phone.number(),
        address: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        country: faker.location.country(),
        bio: faker.lorem.paragraph(2),
        headline: faker.person.jobTitle() + ' - Hiring Manager',
        skills: {
          createMany: {
            data: getRandomElements(
              [
                'Recruiting',
                'HR Management',
                'Talent Acquisition',
                'Leadership',
              ],
              3,
            ).map((skill) => ({
              name: skill,
              endorsements: faker.number.int({ min: 5, max: 30 }),
            })),
          },
        },
      },
    });
    users.push(user);
  }

  console.log(`Created ${users.length} users`);
  return users;
}

async function createCompanies(users: any[]) {
  console.log('Creating companies...');
  const employers = users.filter((user) => user.role === 'EMPLOYER');
  const companies: any[] = [];

  for (let i = 0; i < COMPANIES.length; i++) {
    const companyData = COMPANIES[i];
    const owner = employers[i % employers.length];

    const company = await prisma.company.create({
      data: {
        name: companyData.name,
        description: companyData.description,
        industry: companyData.industry,
        size: getRandomElement([
          '1-10',
          '11-50',
          '51-200',
          '201-500',
          '501-1000',
          '1000+',
        ]),
        website: `https://${companyData.name.toLowerCase().replace(/\s+/g, '')}.com`,
        email: `contact@${companyData.name.toLowerCase().replace(/\s+/g, '')}.com`,
        phone: faker.phone.number(),
        linkedIn: `https://linkedin.com/company/${companyData.name.toLowerCase().replace(/\s+/g, '')}`,
        type: getRandomElement(['Private', 'Public', 'Non-profit', 'Startup']),
        foundedYear: faker.number.int({ min: 1980, max: 2020 }),
        specializations: getRandomElements(
          [
            'Software Development',
            'AI/ML',
            'Cloud Computing',
            'Data Analytics',
            'Mobile Apps',
          ],
          3,
        ),
        isVerified: faker.datatype.boolean(),
        verificationStatus: getRandomElement([
          'PENDING',
          'APPROVED',
          'REJECTED',
        ]),
        ownerId: owner.id,
        locations: {
          createMany: {
            data: [
              {
                address: faker.location.streetAddress(),
                city: faker.location.city(),
                state: faker.location.state(),
                country: faker.location.country(),
                zipCode: faker.location.zipCode(),
                isHeadquarters: true,
                locationType: 'headquarters',
              },
              {
                address: faker.location.streetAddress(),
                city: faker.location.city(),
                state: faker.location.state(),
                country: faker.location.country(),
                zipCode: faker.location.zipCode(),
                isHeadquarters: false,
                locationType: 'branch',
              },
            ],
          },
        },
      },
    });
    companies.push(company);
  }

  console.log(`Created ${companies.length} companies`);
  return companies;
}

async function createJobs(companies: any[], users: any[]) {
  console.log('Creating jobs and internships...');
  const jobs: any[] = [];
  const employers = users.filter((user) => user.role === 'EMPLOYER');

  // Create full-time jobs
  for (let i = 0; i < 30; i++) {
    const company = getRandomElement(companies);
    const poster = getRandomElement(employers);
    const title = getRandomElement(JOB_TITLES);

    const job = await prisma.job.create({
      data: {
        title,
        description: `We are seeking a talented ${title} to join our dynamic team. This role offers excellent opportunities for growth and development in a fast-paced environment.

Key Responsibilities:
- Develop and maintain high-quality software solutions
- Collaborate with cross-functional teams
- Participate in code reviews and technical discussions
- Contribute to architectural decisions
- Mentor junior team members

What We Offer:
- Competitive salary and benefits
- Flexible work arrangements
- Professional development opportunities
- Collaborative work environment`,
        requirements: getRandomElements(
          [
            "Bachelor's degree in Computer Science or related field",
            '3+ years of professional experience',
            'Strong programming skills',
            'Experience with modern frameworks',
            'Excellent communication skills',
            'Problem-solving abilities',
            'Team collaboration experience',
            'Agile/Scrum methodology knowledge',
          ],
          faker.number.int({ min: 4, max: 6 }),
        ),
        type: 'Full-time',
        location: getRandomElement(['Remote', 'On-site', 'Hybrid']),
        salary: {
          min: faker.number.int({ min: 60000, max: 80000 }),
          max: faker.number.int({ min: 90000, max: 150000 }),
          currency: 'USD',
          period: 'annual',
        },
        applicationDeadline: faker.date.between({
          from: new Date(),
          to: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        }),
        status: getRandomElement(['ACTIVE', 'CLOSED']),
        companyId: company.id,
        postedById: poster.id,
      },
    });
    jobs.push(job);
  }

  // Create internships
  for (let i = 0; i < 20; i++) {
    const company = getRandomElement(companies);
    const poster = getRandomElement(employers);
    const title = getRandomElement(INTERNSHIP_TITLES);

    const internship = await prisma.job.create({
      data: {
        title,
        description: `Join our team as a ${title} and gain hands-on experience in a professional environment. This internship is perfect for students looking to apply their academic knowledge in real-world projects.

What You'll Do:
- Work on meaningful projects that impact our business
- Learn from experienced professionals
- Participate in team meetings and brainstorming sessions
- Develop technical and professional skills
- Network with industry professionals

Program Benefits:
- Mentorship from senior team members
- Flexible schedule to accommodate academic commitments
- Potential for full-time offer upon graduation
- Professional development workshops`,
        requirements: getRandomElements(
          [
            'Currently enrolled in relevant degree program',
            'Strong academic performance (GPA 3.0+)',
            'Basic programming knowledge',
            'Enthusiasm for learning',
            'Strong communication skills',
            'Ability to work independently',
            'Team collaboration skills',
            'Time management abilities',
          ],
          faker.number.int({ min: 3, max: 5 }),
        ),
        type: 'Internship',
        location: getRandomElement(['Remote', 'On-site', 'Hybrid']),
        salary: {
          min: faker.number.int({ min: 15, max: 20 }),
          max: faker.number.int({ min: 25, max: 35 }),
          currency: 'USD',
          period: 'hourly',
        },
        applicationDeadline: faker.date.between({
          from: new Date(),
          to: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        }),
        status: 'ACTIVE',
        companyId: company.id,
        postedById: poster.id,
      },
    });
    jobs.push(internship);
  }

  console.log(`Created ${jobs.length} jobs and internships`);
  return jobs;
}

async function createUniversities() {
  console.log('Creating universities...');
  const universities: any[] = [];

  for (const uniData of UNIVERSITIES) {
    const university = await prisma.university.create({
      data: {
        name: uniData.name,
        shortName: uniData.name
          .split(' ')
          .map((word) => word[0])
          .join(''),
        description: `${uniData.name} is a prestigious institution known for excellence in education and research.`,
        website: `https://${uniData.name.toLowerCase().replace(/\s+/g, '').replace(/,/g, '')}.edu`,
        email: `admissions@${uniData.name.toLowerCase().replace(/\s+/g, '').replace(/,/g, '')}.edu`,
        phone: faker.phone.number(),
        address: faker.location.streetAddress(),
        city: uniData.city,
        state: uniData.state,
        country: uniData.country,
        type: getRandomElement(['PUBLIC', 'PRIVATE', 'RESEARCH_UNIVERSITY']),
        establishedYear: faker.number.int({ min: 1850, max: 1990 }),
        studentCount: faker.number.int({ min: 5000, max: 50000 }),
        facultyCount: faker.number.int({ min: 500, max: 5000 }),
        worldRanking: faker.number.int({ min: 1, max: 200 }),
        nationalRanking: faker.number.int({ min: 1, max: 100 }),
        isTopTier: faker.datatype.boolean(),
        departments: getRandomElements(
          [
            'Computer Science',
            'Engineering',
            'Business',
            'Medicine',
            'Law',
            'Arts & Sciences',
            'Education',
            'Psychology',
            'Mathematics',
            'Physics',
          ],
          faker.number.int({ min: 5, max: 8 }),
        ),
        popularMajors: getRandomElements(
          MAJORS,
          faker.number.int({ min: 5, max: 10 }),
        ),
        graduationRate: faker.number.float({
          min: 0.7,
          max: 0.95,
          fractionDigits: 2,
        }),
        employmentRate: faker.number.float({
          min: 0.8,
          max: 0.98,
          fractionDigits: 2,
        }),
        isPartnershipReady: faker.datatype.boolean(),
        partnershipEmail: `partnerships@${uniData.name.toLowerCase().replace(/\s+/g, '').replace(/,/g, '')}.edu`,
        partnershipContact: faker.person.fullName(),
        isVerified: faker.datatype.boolean(),
      },
    });
    universities.push(university);
  }

  console.log(`Created ${universities.length} universities`);
  return universities;
}

async function createEvents(
  companies: any[],
  universities: any[],
  users: any[],
) {
  console.log('Creating events...');
  const events: any[] = [];
  const eventCreators = users.filter((user) =>
    ['EMPLOYER', 'UNIVERSITY_STAFF', 'ADMIN'].includes(user.role),
  );

  // Create campus events
  for (let i = 0; i < 25; i++) {
    const company = getRandomElement(companies);
    const university = getRandomElement(universities);
    const creator = getRandomElement(eventCreators);
    const eventType = getRandomElement(EVENT_TYPES);

    const startDate = faker.date.between({
      from: new Date(),
      to: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    });
    const endDate = new Date(
      startDate.getTime() +
        faker.number.int({ min: 1, max: 8 }) * 60 * 60 * 1000,
    );

    const campusEvent = await prisma.campusEvent.create({
      data: {
        title: `${company.name} ${eventType
          .replace(/_/g, ' ')
          .toLowerCase()
          .replace(/\b\w/g, (l) => l.toUpperCase())}`,
        description: `Join us for an exciting ${eventType.replace(/_/g, ' ').toLowerCase()} hosted by ${company.name}. This is a great opportunity to learn about career opportunities, network with professionals, and discover what makes our company unique.

Event Highlights:
- Learn about our company culture and values
- Discover available positions and internships
- Network with current employees and hiring managers
- Ask questions about career paths and growth opportunities
- Get insights into our hiring process

Who Should Attend:
- Students interested in ${company.industry}
- Recent graduates seeking career opportunities
- Anyone curious about working in the tech industry

Registration is required. Light refreshments will be provided.`,
        type: eventType as CampusEventType,
        startDateTime: startDate,
        endDateTime: endDate,
        location: faker.datatype.boolean()
          ? `${university.name} - ${faker.location.buildingNumber()} ${faker.location.street()}`
          : 'Virtual Event',
        isVirtual: faker.datatype.boolean(),
        meetingLink: faker.datatype.boolean()
          ? 'https://meet.google.com/abc-defg-hij'
          : null,
        capacity: faker.number.int({ min: 50, max: 500 }),
        registrationCount: faker.number.int({ min: 0, max: 200 }),
        requiresRSVP: true,
        rsvpDeadline: new Date(startDate.getTime() - 24 * 60 * 60 * 1000),
        universityId: university.id,
        companyId: company.id,
      },
    });
    events.push(campusEvent);

    // Also create a regular event
    const regularEvent = await prisma.event.create({
      data: {
        title: `${company.name} Networking Event`,
        description: `Professional networking event hosted by ${company.name}. Connect with industry professionals and explore career opportunities.`,
        type: 'Networking',
        startDate: faker.date.between({
          from: new Date(),
          to: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        }),
        endDate: faker.date.between({
          from: new Date(),
          to: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        }),
        location: faker.datatype.boolean()
          ? faker.location.streetAddress()
          : 'Virtual',
        mode: getRandomElement(['ONLINE', 'OFFLINE', 'HYBRID']),
        capacity: faker.number.int({ min: 30, max: 200 }),
        registrationDeadline: faker.date.between({
          from: new Date(),
          to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }),
        status: getRandomElement(['UPCOMING', 'ONGOING', 'COMPLETED']),
        creatorId: creator.id,
      },
    });
    events.push(regularEvent);
  }

  console.log(`Created ${events.length} events`);
  return events;
}

async function createApplications(jobs: any[], users: any[]) {
  console.log('Creating job applications...');
  const students = users.filter((user) => user.role === 'STUDENT');
  const applications: any[] = [];

  for (let i = 0; i < 100; i++) {
    const job = getRandomElement(jobs);
    const student = getRandomElement(students);

    // Check if application already exists
    const existingApplication = await prisma.jobApplication.findFirst({
      where: {
        jobId: job.id,
        userId: student.id,
      },
    });

    if (!existingApplication) {
      const application = await prisma.jobApplication.create({
        data: {
          resumeUrl: faker.internet.url(),
          coverLetter: faker.lorem.paragraphs(3),
          status: getRandomElement([
            'PENDING',
            'REVIEWED',
            'SHORTLISTED',
            'INTERVIEWED',
            'ACCEPTED',
            'REJECTED',
          ]),
          feedback: faker.datatype.boolean() ? faker.lorem.paragraph() : null,
          jobId: job.id,
          userId: student.id,
          source: getRandomElement([
            'direct',
            'referral',
            'job_board',
            'career_fair',
            'social_media',
          ]),
        },
      });
      applications.push(application);
    }
  }

  console.log(`Created ${applications.length} job applications`);
  return applications;
}

async function createForumsAndPosts(users: any[]) {
  console.log('Creating forums and posts...');

  // Create forums
  const forumCategories = [
    {
      name: 'Career Advice',
      description: 'Get advice on career development and job searching',
      category: 'Career',
    },
    {
      name: 'Interview Preparation',
      description: 'Tips and experiences for job interviews',
      category: 'Career',
    },
    {
      name: 'Industry News',
      description: 'Latest news and trends in various industries',
      category: 'News',
    },
    {
      name: 'Networking',
      description: 'Connect with professionals and peers',
      category: 'Networking',
    },
    {
      name: 'Skill Development',
      description: 'Discuss learning resources and skill building',
      category: 'Education',
    },
  ];

  const forums: any[] = [];
  for (const forumData of forumCategories) {
    const forum = await prisma.forum.create({
      data: {
        name: forumData.name,
        description: forumData.description,
        category: forumData.category,
        moderators: [users[0].id], // Admin as moderator
      },
    });
    forums.push(forum);
  }

  // Create posts
  const posts: any[] = [];
  for (let i = 0; i < 50; i++) {
    const forum = getRandomElement(forums);
    const author = getRandomElement(users);

    const post = await prisma.post.create({
      data: {
        title: faker.lorem.sentence({ min: 5, max: 12 }),
        content: faker.lorem.paragraphs(faker.number.int({ min: 2, max: 5 })),
        tags: getRandomElements(
          [
            'career',
            'advice',
            'interview',
            'networking',
            'skills',
            'technology',
            'internship',
          ],
          3,
        ),
        likes: faker.number.int({ min: 0, max: 50 }),
        views: faker.number.int({ min: 0, max: 500 }),
        forumId: forum.id,
        userId: author.id,
      },
    });
    posts.push(post);
  }

  // Create comments
  for (let i = 0; i < 150; i++) {
    const post = getRandomElement(posts);
    const commenter = getRandomElement(users);

    await prisma.comment.create({
      data: {
        content: faker.lorem.paragraph(),
        postId: post.id,
        userId: commenter.id,
      },
    });
  }

  console.log(
    `Created ${forums.length} forums and ${posts.length} posts with comments`,
  );
}

async function createNotifications(users: any[]) {
  console.log('Creating notifications...');

  const notificationTypes = [
    'GENERAL',
    'JOB_APPLICATION',
    'EVENT_REGISTRATION',
    'MESSAGE',
    'SYSTEM',
    'REMINDER',
    'ALERT',
  ];

  for (let i = 0; i < 200; i++) {
    const user = getRandomElement(users);
    const type = getRandomElement(notificationTypes);

    await prisma.notification.create({
      data: {
        title: faker.lorem.sentence({ min: 3, max: 8 }),
        content: faker.lorem.paragraph(),
        type: type as any,
        priority: getRandomElement(['LOW', 'MEDIUM', 'HIGH']),
        read: faker.datatype.boolean(),
        link: faker.internet.url(),
        userId: user.id,
      },
    });
  }

  console.log('Created 200 notifications');
}

async function main() {
  try {
    console.log('🌱 Starting seed process...');

    // Clear existing data (optional - uncomment if needed)
    // console.log('Clearing existing data...');
    // await prisma.$executeRaw`TRUNCATE TABLE "users" CASCADE`;

    // Create data in order of dependencies
    const users = await createUsers();
    const companies = await createCompanies(users);
    const jobs = await createJobs(companies, users);
    const universities = await createUniversities();
    const events = await createEvents(companies, universities, users);
    const applications = await createApplications(jobs, users);

    // Create additional data
    await createForumsAndPosts(users);
    await createNotifications(users);

    console.log('🎉 Seed completed successfully!');
    console.log('\nSummary:');
    console.log(`- Users: ${users.length}`);
    console.log(`- Companies: ${companies.length}`);
    console.log(`- Jobs/Internships: ${jobs.length}`);
    console.log(`- Universities: ${universities.length}`);
    console.log(`- Events: ${events.length}`);
    console.log(`- Applications: ${applications.length}`);

    console.log('\nTest login credentials:');
    console.log('Admin: admin@jobplatform.com / admin123');
    console.log(
      'Regular users: Use any generated email with password "password123"',
    );
  } catch (error) {
    console.error('Error during seed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
main();
