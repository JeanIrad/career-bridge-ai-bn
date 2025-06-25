const { PrismaClient } = require('@prisma/client');
const { faker } = require('@faker-js/faker');

const prisma = new PrismaClient();

// Configuration
const SEED_CONFIG = {
  users: 20,
  companies: 5,
  jobs: 25,
  applications: 50,
};

const skills = [
  'JavaScript',
  'TypeScript',
  'React',
  'Node.js',
  'Python',
  'Java',
  'Spring Boot',
  'Docker',
  'AWS',
  'SQL',
  'PostgreSQL',
];

const jobTitles = [
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'DevOps Engineer',
  'Data Scientist',
];

const industries = [
  'Technology',
  'Finance',
  'Healthcare',
  'E-commerce',
  'Education',
];

async function clearSeedData() {
  console.log('🗑️ Clearing existing seed data...');

  // Delete in correct order to avoid foreign key constraints
  await prisma.jobApplication.deleteMany({});
  await prisma.savedJob.deleteMany({});
  await prisma.jobRecommendation.deleteMany({});
  await prisma.job.deleteMany({});

  // Delete companies and their owners
  const companies = await prisma.company.findMany({
    where: { industry: { in: industries } },
    select: { id: true, ownerId: true },
  });

  await prisma.company.deleteMany({
    where: { industry: { in: industries } },
  });

  // Delete company owners
  if (companies.length > 0) {
    await prisma.user.deleteMany({
      where: {
        id: { in: companies.map((c) => c.ownerId) },
      },
    });
  }

  // Delete seed users
  await prisma.user.deleteMany({
    where: {
      email: { contains: 'fakeuser' },
      role: 'STUDENT',
    },
  });

  console.log('✅ Cleared existing seed data');
}

async function generateUsers() {
  console.log('👥 Generating users...');
  const users = [];

  for (let i = 0; i < SEED_CONFIG.users; i++) {
    const user = await prisma.user.create({
      data: {
        email: `fakeuser${i}@example.com`,
        password: 'hashed-password',
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        role: 'STUDENT',
        isEmailVerified: true,
        phone: faker.phone.number(),
        skills: faker.helpers.arrayElements(skills, { min: 3, max: 7 }),
        bio: faker.lorem.paragraph(),
        location: faker.location.city() + ', ' + faker.location.country(),
      },
    });
    users.push(user);
  }

  console.log(`✅ Generated ${users.length} users`);
  return users;
}

async function generateCompanies() {
  console.log('🏢 Generating companies...');
  const companies = [];

  for (let i = 0; i < SEED_CONFIG.companies; i++) {
    // Create company owner
    const owner = await prisma.user.create({
      data: {
        email: `companyowner${i}@example.com`,
        password: 'hashed-password',
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        role: 'EMPLOYER',
        isEmailVerified: true,
      },
    });

    const company = await prisma.company.create({
      data: {
        name: faker.company.name(),
        description:
          faker.company.catchPhrase() + '. ' + faker.lorem.sentences(2),
        industry: faker.helpers.arrayElement(industries),
        size: faker.helpers.arrayElement([
          '1-10',
          '11-50',
          '51-200',
          '201-500',
          '500+',
        ]),
        website: faker.internet.url(),
        location: faker.location.city() + ', ' + faker.location.country(),
        ownerId: owner.id,
      },
    });
    companies.push(company);
  }

  console.log(`✅ Generated ${companies.length} companies`);
  return companies;
}

async function generateJobs(companies) {
  console.log('💼 Generating jobs...');
  const jobs = [];

  for (let i = 0; i < SEED_CONFIG.jobs; i++) {
    const company = faker.helpers.arrayElement(companies);
    const title = faker.helpers.arrayElement(jobTitles);
    const requiredSkills = faker.helpers.arrayElements(skills, {
      min: 2,
      max: 5,
    });

    const job = await prisma.job.create({
      data: {
        title,
        description: `We are looking for a ${title}. ${faker.lorem.paragraphs(2)}`,
        location: company.location,
        type: faker.helpers.arrayElement([
          'FULL_TIME',
          'PART_TIME',
          'CONTRACT',
          'INTERNSHIP',
        ]),
        experience: faker.helpers.arrayElement(['ENTRY', 'MID', 'SENIOR']),
        skills: requiredSkills,
        salary: faker.number.int({ min: 40000, max: 150000 }),
        companyId: company.id,
        isActive: true,
      },
    });
    jobs.push(job);
  }

  console.log(`✅ Generated ${jobs.length} jobs`);
  return jobs;
}

async function generateApplications(users, jobs) {
  console.log('📋 Generating applications...');
  const applications = [];

  for (let i = 0; i < SEED_CONFIG.applications; i++) {
    const user = faker.helpers.arrayElement(users);
    const job = faker.helpers.arrayElement(jobs);

    // Check if application already exists
    const existing = await prisma.jobApplication.findUnique({
      where: {
        userId_jobId: {
          userId: user.id,
          jobId: job.id,
        },
      },
    });

    if (existing) continue;

    const application = await prisma.jobApplication.create({
      data: {
        userId: user.id,
        jobId: job.id,
        status: faker.helpers.arrayElement([
          'PENDING',
          'REVIEWED',
          'INTERVIEW',
          'ACCEPTED',
          'REJECTED',
        ]),
        coverLetter: faker.lorem.paragraphs(2),
        appliedAt: faker.date.recent({ days: 30 }),
      },
    });
    applications.push(application);
  }

  console.log(`✅ Generated ${applications.length} applications`);
  return applications;
}

async function main() {
  try {
    console.log('🌱 Starting seed data generation...\n');

    await clearSeedData();

    const users = await generateUsers();
    const companies = await generateCompanies();
    const jobs = await generateJobs(companies);
    const applications = await generateApplications(users, jobs);

    console.log('\n🎉 Seed data generation completed successfully!');
    console.log('==========================================');
    console.log(`👥 Users: ${users.length}`);
    console.log(`🏢 Companies: ${companies.length}`);
    console.log(`💼 Jobs: ${jobs.length}`);
    console.log(`📋 Applications: ${applications.length}`);
    console.log('==========================================');

    console.log('\n🚀 Next steps:');
    console.log('  1. Start your server: npm run start:dev');
    console.log('  2. Train AI model: npm run ai:train');
    console.log('  3. Test recommendations in the app');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
