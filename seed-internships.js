const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedInternships() {
  console.log('🌱 Seeding internships...');

  try {
    // Get some companies and users first
    const companies = await prisma.company.findMany({
      take: 10,
    });

    const employers = await prisma.user.findMany({
      where: { role: 'EMPLOYER' },
      take: 10,
    });

    if (companies.length === 0 || employers.length === 0) {
      console.log(
        '❌ No companies or employers found. Please seed companies first.',
      );
      return;
    }

    // Create internships
    const internships = [
      {
        title: 'Software Engineering Intern',
        description:
          "Join our engineering team to work on large-scale distributed systems and contribute to products used by millions of users. You'll collaborate with senior engineers, participate in code reviews, and ship features to production.",
        requirements: [
          'Currently pursuing BS/MS in Computer Science or related field',
          'Strong programming skills in Java, Python, or C++',
          'Understanding of data structures and algorithms',
          'Experience with version control (Git)',
          'Strong problem-solving skills',
        ],
        type: 'Software Engineering',
        jobType: 'INTERNSHIP',
        isInternship: true,
        location: 'Mountain View, CA',
        salary: { min: 7000, max: 9000, currency: 'USD', period: 'monthly' },
        applicationDeadline: new Date('2026-09-15'),
        duration: 'SUMMER',
        compensationType: 'PAID',
        stipendAmount: 8000,
        housingProvided: true,
        housingStipend: 2000,
        transportationStipend: 500,
        mealAllowance: 1000,
        programName: 'Google Summer Internship Program',
        cohortSize: 150,
        mentorshipProvided: true,
        trainingProvided: true,
        networkingEvents: true,
        gpaRequirement: 3.0,
        graduationYear: 2026,
        eligibleMajors: [
          'Computer Science',
          'Software Engineering',
          'Computer Engineering',
        ],
        preferredSkills: ['JavaScript', 'React', 'Node.js', 'Python', 'Java'],
        portfolioRequired: false,
        transcriptRequired: true,
        applicationOpenDate: new Date('2025-07-15'),
        startDate: new Date('2026-06-15'),
        endDate: new Date('2026-09-15'),
        fullTimeConversion: true,
        returnOfferRate: 85.5,
        companyId: companies[0].id,
        postedById: employers[0].id,
      },
      {
        title: 'Data Science Intern',
        description:
          "Work with our data science team to analyze user behavior, build machine learning models, and drive data-driven decision making. You'll work on recommendation systems, A/B testing, and predictive analytics.",
        requirements: [
          'Currently pursuing BS/MS in Data Science, Statistics, or related field',
          'Proficiency in Python and SQL',
          'Experience with machine learning libraries (scikit-learn, pandas)',
          'Statistical analysis and hypothesis testing',
          'Data visualization skills',
        ],
        type: 'Data Science',
        jobType: 'INTERNSHIP',
        isInternship: true,
        location: 'Los Gatos, CA',
        salary: { min: 6500, max: 8000, currency: 'USD', period: 'monthly' },
        applicationDeadline: new Date('2025-08-28'),
        duration: 'SUMMER',
        compensationType: 'PAID',
        stipendAmount: 7200,
        housingProvided: false,
        housingStipend: 1800,
        transportationStipend: 300,
        mealAllowance: 800,
        programName: 'Netflix Data Science Internship',
        cohortSize: 25,
        mentorshipProvided: true,
        trainingProvided: true,
        networkingEvents: true,
        gpaRequirement: 3.2,
        graduationYear: 2025,
        eligibleMajors: [
          'Data Science',
          'Statistics',
          'Mathematics',
          'Computer Science',
        ],
        preferredSkills: [
          'Python',
          'R',
          'SQL',
          'Machine Learning',
          'Statistics',
        ],
        portfolioRequired: true,
        transcriptRequired: true,
        applicationOpenDate: new Date('2025-07-01'),
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-08-15'),
        fullTimeConversion: true,
        returnOfferRate: 75.0,
        companyId: companies[1] ? companies[1].id : companies[0].id,
        postedById: employers[1] ? employers[1].id : employers[0].id,
      },
      {
        title: 'Product Design Intern',
        description:
          "Join our design team to create user experiences for millions of travelers and hosts. You'll work on mobile and web interfaces, conduct user research, and collaborate with product managers and engineers.",
        requirements: [
          'Currently pursuing degree in Design, HCI, or related field',
          'Proficiency in Figma, Sketch, or Adobe Creative Suite',
          'Understanding of design thinking and user-centered design',
          'Portfolio demonstrating UX/UI design skills',
          'Strong communication and collaboration skills',
        ],
        type: 'Product Design',
        jobType: 'INTERNSHIP',
        isInternship: true,
        location: 'San Francisco, CA',
        salary: { min: 5500, max: 7000, currency: 'USD', period: 'monthly' },
        applicationDeadline: new Date('2026-09-01'),
        duration: 'SUMMER',
        compensationType: 'PAID',
        stipendAmount: 6200,
        housingProvided: false,
        housingStipend: 2200,
        transportationStipend: 400,
        mealAllowance: 900,
        programName: 'Airbnb Design Fellowship',
        cohortSize: 15,
        mentorshipProvided: true,
        trainingProvided: true,
        networkingEvents: true,
        gpaRequirement: 3.0,
        graduationYear: 2026,
        eligibleMajors: [
          'Design',
          'Human-Computer Interaction',
          'Art',
          'Psychology',
        ],
        preferredSkills: [
          'Figma',
          'Sketch',
          'Prototyping',
          'User Research',
          'Design Systems',
        ],
        portfolioRequired: true,
        transcriptRequired: false,
        applicationOpenDate: new Date('2025-07-10'),
        startDate: new Date('2026-05-20'),
        endDate: new Date('2026-08-20'),
        fullTimeConversion: true,
        returnOfferRate: 65.0,
        companyId: companies[2] ? companies[2].id : companies[0].id,
        postedById: employers[2] ? employers[2].id : employers[0].id,
      },
      {
        title: 'Finance Analyst Intern',
        description:
          'Gain exposure to investment banking, trading, and asset management. Work on financial modeling, market analysis, and client presentations while learning from industry experts.',
        requirements: [
          'Currently pursuing BS/MS in Finance, Economics, or related field',
          'Strong analytical and quantitative skills',
          'Proficiency in Excel and financial modeling',
          'Understanding of financial markets and instruments',
          'Excellent written and verbal communication skills',
        ],
        type: 'Finance',
        jobType: 'INTERNSHIP',
        isInternship: true,
        location: 'New York, NY',
        salary: { min: 85, max: 95, currency: 'USD', period: 'hourly' },
        applicationDeadline: new Date('2026-08-15'),
        duration: 'SUMMER',
        compensationType: 'PAID',
        stipendAmount: 7200,
        housingProvided: false,
        housingStipend: 3000,
        transportationStipend: 500,
        mealAllowance: 1200,
        programName: 'Goldman Sachs Summer Analyst Program',
        cohortSize: 200,
        mentorshipProvided: true,
        trainingProvided: true,
        networkingEvents: true,
        gpaRequirement: 3.5,
        graduationYear: 2026,
        eligibleMajors: ['Finance', 'Economics', 'Business', 'Mathematics'],
        preferredSkills: [
          'Excel',
          'Financial Modeling',
          'Bloomberg Terminal',
          'Python',
          'R',
        ],
        portfolioRequired: false,
        transcriptRequired: true,
        applicationOpenDate: new Date('2025-07-01'),
        startDate: new Date('2026-06-10'),
        endDate: new Date('2026-08-20'),
        fullTimeConversion: true,
        returnOfferRate: 92.0,
        companyId: companies[3] ? companies[3].id : companies[0].id,
        postedById: employers[3] ? employers[3].id : employers[0].id,
      },
      {
        title: 'Marketing Intern',
        description:
          'Support our marketing team in developing and executing digital marketing campaigns. Work on content creation, social media management, and marketing analytics.',
        requirements: [
          'Currently pursuing degree in Marketing, Communications, or related field',
          'Experience with social media platforms',
          'Basic understanding of digital marketing concepts',
          'Strong writing and communication skills',
          'Creative mindset and attention to detail',
        ],
        type: 'Marketing',
        jobType: 'INTERNSHIP',
        isInternship: true,
        location: 'Austin, TX',
        salary: { min: 18, max: 25, currency: 'USD', period: 'hourly' },
        applicationDeadline: new Date('2025-10-01'),
        duration: 'SUMMER',
        compensationType: 'PAID',
        stipendAmount: 3200,
        housingProvided: false,
        housingStipend: 1000,
        transportationStipend: 200,
        mealAllowance: 400,
        programName: 'Summer Marketing Internship',
        cohortSize: 8,
        mentorshipProvided: true,
        trainingProvided: false,
        networkingEvents: false,
        gpaRequirement: 2.8,
        graduationYear: 2025,
        eligibleMajors: ['Marketing', 'Communications', 'Business', 'English'],
        preferredSkills: [
          'Social Media',
          'Content Creation',
          'Google Analytics',
          'Adobe Creative Suite',
        ],
        portfolioRequired: true,
        transcriptRequired: false,
        applicationOpenDate: new Date('2025-08-01'),
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-08-31'),
        fullTimeConversion: false,
        returnOfferRate: 40.0,
        companyId: companies[4] ? companies[4].id : companies[0].id,
        postedById: employers[4] ? employers[4].id : employers[0].id,
      },
      {
        title: 'Research Intern - AI/ML',
        description:
          'Contribute to cutting-edge research in artificial intelligence and machine learning. Work on research projects, publish papers, and collaborate with PhD researchers.',
        requirements: [
          'Currently pursuing MS/PhD in Computer Science, AI, or related field',
          'Strong background in machine learning and deep learning',
          'Experience with PyTorch or TensorFlow',
          'Research experience and publications preferred',
          'Strong mathematical foundation',
        ],
        type: 'Research',
        jobType: 'INTERNSHIP',
        isInternship: true,
        location: 'Redmond, WA',
        salary: { min: 8500, max: 10000, currency: 'USD', period: 'monthly' },
        applicationDeadline: new Date('2025-07-31'),
        duration: 'SUMMER',
        compensationType: 'PAID',
        stipendAmount: 9000,
        housingProvided: true,
        housingStipend: 2500,
        transportationStipend: 600,
        mealAllowance: 1200,
        programName: 'Microsoft Research Internship',
        cohortSize: 50,
        mentorshipProvided: true,
        trainingProvided: true,
        networkingEvents: true,
        gpaRequirement: 3.7,
        graduationYear: 2027,
        eligibleMajors: [
          'Computer Science',
          'Artificial Intelligence',
          'Machine Learning',
          'Mathematics',
        ],
        preferredSkills: [
          'Python',
          'PyTorch',
          'TensorFlow',
          'Research',
          'Mathematics',
        ],
        portfolioRequired: true,
        transcriptRequired: true,
        applicationOpenDate: new Date('2025-07-15'),
        startDate: new Date('2026-06-15'),
        endDate: new Date('2026-09-15'),
        fullTimeConversion: true,
        returnOfferRate: 95.0,
        companyId: companies[5] ? companies[5].id : companies[0].id,
        postedById: employers[5] ? employers[5].id : employers[0].id,
      },
      {
        title: 'Cybersecurity Intern',
        description:
          'Join our security team to help protect company assets and customer data. Work on threat analysis, security assessments, and incident response.',
        requirements: [
          'Currently pursuing degree in Cybersecurity, Computer Science, or related field',
          'Understanding of network security principles',
          'Knowledge of common security tools and frameworks',
          'Interest in ethical hacking and penetration testing',
          'Strong analytical and problem-solving skills',
        ],
        type: 'Cybersecurity',
        jobType: 'INTERNSHIP',
        isInternship: true,
        location: 'Washington, DC',
        salary: { min: 6000, max: 7500, currency: 'USD', period: 'monthly' },
        applicationDeadline: new Date('2025-09-20'),
        duration: 'SUMMER',
        compensationType: 'PAID',
        stipendAmount: 6800,
        housingProvided: false,
        housingStipend: 1500,
        transportationStipend: 300,
        mealAllowance: 600,
        programName: 'Cybersecurity Summer Program',
        cohortSize: 12,
        mentorshipProvided: true,
        trainingProvided: true,
        networkingEvents: true,
        gpaRequirement: 3.2,
        graduationYear: 2025,
        eligibleMajors: [
          'Cybersecurity',
          'Computer Science',
          'Information Technology',
        ],
        preferredSkills: [
          'Network Security',
          'Penetration Testing',
          'Python',
          'Linux',
          'Security Frameworks',
        ],
        portfolioRequired: false,
        transcriptRequired: true,
        applicationOpenDate: new Date('2025-07-20'),
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-08-15'),
        fullTimeConversion: true,
        returnOfferRate: 70.0,
        companyId: companies[6] ? companies[6].id : companies[0].id,
        postedById: employers[6] ? employers[6].id : employers[0].id,
      },
      {
        title: 'Business Development Intern',
        description:
          'Support our business development team in identifying new opportunities, analyzing market trends, and building strategic partnerships.',
        requirements: [
          'Currently pursuing degree in Business, Economics, or related field',
          'Strong analytical and research skills',
          'Excellent communication and presentation skills',
          'Interest in business strategy and market analysis',
          'Proficiency in Microsoft Office Suite',
        ],
        type: 'Business Development',
        jobType: 'INTERNSHIP',
        isInternship: true,
        location: 'Chicago, IL',
        salary: { min: 22, max: 28, currency: 'USD', period: 'hourly' },
        applicationDeadline: new Date('2025-09-10'),
        duration: 'SEMESTER',
        compensationType: 'PAID',
        stipendAmount: 4800,
        housingProvided: false,
        housingStipend: 800,
        transportationStipend: 200,
        mealAllowance: 300,
        programName: 'Business Development Internship',
        cohortSize: 6,
        mentorshipProvided: true,
        trainingProvided: false,
        networkingEvents: true,
        gpaRequirement: 3.0,
        graduationYear: 2025,
        eligibleMajors: ['Business', 'Economics', 'Finance', 'Marketing'],
        preferredSkills: [
          'Excel',
          'PowerPoint',
          'Market Research',
          'Business Analysis',
        ],
        portfolioRequired: false,
        transcriptRequired: false,
        applicationOpenDate: new Date('2025-07-15'),
        startDate: new Date('2026-09-01'),
        endDate: new Date('2026-12-15'),
        fullTimeConversion: false,
        returnOfferRate: 30.0,
        companyId: companies[7] ? companies[7].id : companies[0].id,
        postedById: employers[7] ? employers[7].id : employers[0].id,
      },
    ];

    // Create internships in batches
    for (const internshipData of internships) {
      await prisma.job.create({
        data: internshipData,
      });
    }

    console.log(`✅ Created ${internships.length} internships`);

    // Create some sample applications
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      take: 20,
    });

    if (students.length > 0) {
      const createdInternships = await prisma.job.findMany({
        where: { isInternship: true },
        take: 8,
      });

      const applications = [];
      for (let i = 0; i < Math.min(15, students.length * 2); i++) {
        const student = students[Math.floor(Math.random() * students.length)];
        const internship =
          createdInternships[
            Math.floor(Math.random() * createdInternships.length)
          ];

        // Avoid duplicate applications
        const existingApp = await prisma.jobApplication.findFirst({
          where: {
            userId: student.id,
            jobId: internship.id,
          },
        });

        if (!existingApp) {
          applications.push({
            userId: student.id,
            jobId: internship.id,
            resumeUrl: 'https://example.com/resume.pdf',
            coverLetter:
              'I am very interested in this internship opportunity and believe my skills align well with the requirements.',
            status: ['PENDING', 'REVIEWED', 'SHORTLISTED', 'INTERVIEWED'][
              Math.floor(Math.random() * 4)
            ],
            source: 'direct',
          });
        }
      }

      if (applications.length > 0) {
        await prisma.jobApplication.createMany({
          data: applications,
        });
        console.log(
          `✅ Created ${applications.length} internship applications`,
        );
      }
    }
  } catch (error) {
    console.error('❌ Error seeding internships:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedInternships();
    console.log('🎉 Internship seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { seedInternships };
