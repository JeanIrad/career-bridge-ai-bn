// const { PrismaClient } = require('@prisma/client');
// const { faker } = require('@faker-js/faker');
// const bcrypt = require('bcrypt');
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Helper functions
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

const getRandomArrayElement = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

const getRandomArrayElements = (array, count) => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

export async function main() {
  console.log('Starting database seeding...');

  // Clear existing data (optional - uncomment if needed)
  // await prisma.user.deleteMany();
  // await prisma.company.deleteMany();
  // await prisma.forum.deleteMany();
  // ... add other models as needed

  // 1. Create Users (10)
  console.log('Creating users...');
  const users = [];
  const roles = [
    'ADMIN',
    'STUDENT',
    'PROFESSOR',
    'ALUMNI',
    'EMPLOYER',
    'MENTOR',
    'UNIVERSITY_STAFF',
    'OTHER',
  ];
  const genders = ['MALE', 'FEMALE', 'OTHER'];
  const accountStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
  const visibilities = ['PUBLIC', 'PRIVATE', 'CONNECTIONS'];

  for (let i = 0; i < 10; i++) {
    const user = await prisma.user.create({
      data: {
        email: faker.internet.email(),
        password: await hashPassword('password123'),
        universityId: faker.string.alphanumeric(8),
        studentId: faker.string.alphanumeric(8),
        isVerified: faker.datatype.boolean(),
        accountStatus: getRandomArrayElement(accountStatuses),
        role: getRandomArrayElement(roles),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        phoneNumber: faker.phone.number(),
        address: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        zipCode: faker.location.zipCode(),
        country: faker.location.country(),
        dateOfBirth: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
        gender: getRandomArrayElement(genders),
        nationality: faker.location.country(),
        languages: faker.helpers.arrayElements(
          ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese'],
          { min: 1, max: 3 },
        ),
        interests: faker.helpers.arrayElements(
          [
            'Technology',
            'Sports',
            'Music',
            'Travel',
            'Reading',
            'Gaming',
            'Art',
          ],
          { min: 2, max: 5 },
        ),
        gpa: faker.number.float({ min: 2.0, max: 4.0, precision: 0.1 }),
        graduationYear: faker.date.future().getFullYear(),
        availability: faker.helpers.arrayElement([
          'Available',
          'Not Available',
          'Open to Opportunities',
        ]),
        university: faker.company.name() + ' University',
        major: faker.helpers.arrayElement([
          'Computer Science',
          'Business',
          'Engineering',
          'Psychology',
          'Biology',
          'Art',
        ]),
        headline: faker.person.jobTitle(),
        bio: faker.lorem.paragraph(),
        avatar: faker.image.avatar(),
        socialLinks: {
          linkedin: faker.internet.url(),
          twitter: faker.internet.url(),
          github: faker.internet.url(),
        },
        visibility: getRandomArrayElement(visibilities),
        isPublic: faker.datatype.boolean(),
        lastLogin: faker.date.recent(),
      },
    });
    users.push(user);
  }

  // 2. Create Companies (10)
  console.log('Creating companies...');
  const companies = [];
  const industries = [
    'Technology',
    'Healthcare',
    'Finance',
    'Education',
    'Manufacturing',
    'Retail',
    'Consulting',
  ];
  const companySizes = ['1-10', '11-50', '51-200', '201-1000', '1000+'];
  const companyTypes = ['Private', 'Public', 'Non-profit', 'Government'];

  for (let i = 0; i < 10; i++) {
    const company = await prisma.company.create({
      data: {
        name: faker.company.name(),
        description:
          faker.company.catchPhrase() + '. ' + faker.lorem.paragraph(),
        logo: faker.image.url(),
        website: faker.internet.url(),
        industry: getRandomArrayElement(industries),
        size: getRandomArrayElement(companySizes),
        isVerified: faker.datatype.boolean(),
        ownerId: getRandomArrayElement(users).id,
        type: getRandomArrayElement(companyTypes),
        foundedYear: faker.date.past({ years: 50 }).getFullYear(),
        specializations: faker.helpers.arrayElements(
          ['Software Development', 'Data Analysis', 'Marketing', 'Sales', 'HR'],
          { min: 1, max: 3 },
        ),
        phone: faker.phone.number(),
        email: faker.internet.email(),
        linkedIn: faker.internet.url(),
        twitter: faker.internet.url(),
        facebook: faker.internet.url(),
      },
    });
    companies.push(company);
  }

  // 3. Create Company Locations (10)
  console.log('Creating company locations...');
  for (let i = 0; i < 10; i++) {
    await prisma.companyLocation.create({
      data: {
        companyId: getRandomArrayElement(companies).id,
        address: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        country: faker.location.country(),
        zipCode: faker.location.zipCode(),
        countryCode: faker.location.countryCode(),
        isHeadquarters: i === 0, // First one is headquarters
        locationType: faker.helpers.arrayElement([
          'headquarters',
          'branch',
          'remote',
        ]),
        timezone: faker.date.timeZone(),
        detectedFromIp: faker.datatype.boolean(),
        ipAddress: faker.internet.ip(),
      },
    });
  }

  // 4. Create Jobs (10)
  console.log('Creating jobs...');
  const jobs = [];
  const jobTypes = [
    'Full-time',
    'Part-time',
    'Contract',
    'Internship',
    'Remote',
  ];
  const jobStatuses = ['ACTIVE', 'CLOSED'];

  for (let i = 0; i < 10; i++) {
    const job = await prisma.job.create({
      data: {
        title: faker.person.jobTitle(),
        description: faker.lorem.paragraphs(3),
        requirements: faker.helpers.arrayElements(
          [
            "Bachelor's degree required",
            '3+ years experience',
            'Strong communication skills',
            'Team player',
            'Problem-solving abilities',
            'Leadership experience',
          ],
          { min: 2, max: 4 },
        ),
        type: getRandomArrayElement(jobTypes),
        location: faker.location.city() + ', ' + faker.location.state(),
        salary: {
          min: faker.number.int({ min: 40000, max: 80000 }),
          max: faker.number.int({ min: 80000, max: 150000 }),
          currency: 'USD',
        },
        applicationDeadline: faker.date.future(),
        status: getRandomArrayElement(jobStatuses),
        companyId: getRandomArrayElement(companies).id,
        postedById:
          getRandomArrayElement(
            users.filter((u) => u.role === 'EMPLOYER' || u.role === 'ADMIN'),
          ).id || users[0].id,
      },
    });
    jobs.push(job);
  }

  // 5. Create Job Applications (10)
  console.log('Creating job applications...');
  const applicationStatuses = ['PENDING', 'REVIEWED', 'ACCEPTED', 'REJECTED'];

  for (let i = 0; i < 10; i++) {
    await prisma.jobApplication.create({
      data: {
        resumeUrl: faker.internet.url(),
        coverLetter: faker.lorem.paragraphs(2),
        status: getRandomArrayElement(applicationStatuses),
        feedback: faker.datatype.boolean() ? faker.lorem.sentence() : null,
        jobId: getRandomArrayElement(jobs).id,
        userId: getRandomArrayElement(users).id,
      },
    });
  }

  // 6. Create Forums (10)
  console.log('Creating forums...');
  const forums = [];
  const forumCategories = [
    'General',
    'Career',
    'Technology',
    'Student Life',
    'Alumni',
    'Jobs',
  ];

  for (let i = 0; i < 10; i++) {
    const forum = await prisma.forum.create({
      data: {
        name: faker.lorem.words(3),
        description: faker.lorem.paragraph(),
        category: getRandomArrayElement(forumCategories),
        moderators: getRandomArrayElements(
          users.map((u) => u.id),
          faker.number.int({ min: 1, max: 3 }),
        ),
      },
    });
    forums.push(forum);
  }

  // 7. Create Posts (10)
  console.log('Creating posts...');
  const posts = [];

  for (let i = 0; i < 10; i++) {
    const post = await prisma.post.create({
      data: {
        title: faker.lorem.sentence(),
        content: faker.lorem.paragraphs(faker.number.int({ min: 1, max: 4 })),
        tags: faker.helpers.arrayElements(
          ['javascript', 'career', 'networking', 'advice', 'technology'],
          { min: 1, max: 3 },
        ),
        attachments: faker.datatype.boolean() ? [faker.internet.url()] : [],
        likes: faker.number.int({ min: 0, max: 100 }),
        views: faker.number.int({ min: 0, max: 1000 }),
        forumId: getRandomArrayElement(forums).id,
        userId: getRandomArrayElement(users).id,
      },
    });
    posts.push(post);
  }

  // 8. Create Comments (10)
  console.log('Creating comments...');
  for (let i = 0; i < 10; i++) {
    await prisma.comment.create({
      data: {
        content: faker.lorem.paragraph(),
        postId: getRandomArrayElement(posts).id,
        userId: getRandomArrayElement(users).id,
      },
    });
  }

  // 9. Create Events (10)
  console.log('Creating events...');
  const events = [];
  const eventModes = ['ONLINE', 'OFFLINE', 'HYBRID'];
  const eventStatuses = ['UPCOMING', 'ONGOING', 'COMPLETED'];
  const eventTypes = [
    'Workshop',
    'Seminar',
    'Networking',
    'Career Fair',
    'Alumni Meet',
  ];

  for (let i = 0; i < 10; i++) {
    const startDate = faker.date.future();
    const event = await prisma.event.create({
      data: {
        title: faker.lorem.words(4),
        description: faker.lorem.paragraphs(2),
        type: getRandomArrayElement(eventTypes),
        startDate: startDate,
        endDate: new Date(
          startDate.getTime() +
            faker.number.int({ min: 1, max: 8 }) * 60 * 60 * 1000,
        ),
        location: faker.location.city() + ', ' + faker.location.state(),
        mode: getRandomArrayElement(eventModes),
        capacity: faker.number.int({ min: 20, max: 500 }),
        registrationDeadline: new Date(
          startDate.getTime() - 24 * 60 * 60 * 1000,
        ),
        status: getRandomArrayElement(eventStatuses),
        creatorId: getRandomArrayElement(users).id,
      },
    });
    events.push(event);
  }

  // 10. Create Event Registrations (10)
  console.log('Creating event registrations...');
  const eventRegistrations = [];

  for (let i = 0; i < 10; i++) {
    const registration = await prisma.eventRegistration.create({
      data: {
        eventId: getRandomArrayElement(events).id,
      },
    });
    eventRegistrations.push(registration);
  }

  // 11. Create Chats (10)
  console.log('Creating chats...');
  const chats = [];
  const chatTypes = ['direct', 'group', 'public'];

  for (let i = 0; i < 10; i++) {
    const chat = await prisma.chat.create({
      data: {
        type: getRandomArrayElement(chatTypes),
        participants: getRandomArrayElements(
          users.map((u) => u.id),
          faker.number.int({ min: 2, max: 5 }),
        ),
        userId: getRandomArrayElement(users).id,
      },
    });
    chats.push(chat);
  }

  // 12. Create Messages (10)
  // console.log('Creating messages...');
  // for (let i = 0; i < 10; i++) {
  //   await prisma.message.create({
  //     data: {
  //       content: faker.lorem.sentence(),
  //       chatId: getRandomArrayElement(chats).id,
  //       senderId: getRandomArrayElement(users).id,
  //     },
  //   });
  // }

  // 13. Create Chat Groups (10)
  console.log('Creating chat groups...');
  const chatGroups = [];

  for (let i = 0; i < 10; i++) {
    const group = await prisma.chatGroup.create({
      data: {
        name: faker.lorem.words(2),
        description: faker.lorem.sentence(),
        ownerId: getRandomArrayElement(users).id,
        members: {
          connect: getRandomArrayElements(
            users,
            faker.number.int({ min: 2, max: 5 }),
          ).map((u) => ({ id: u.id })),
        },
      },
    });
    chatGroups.push(group);
  }

  // 14. Create Group Messages (10)
  console.log('Creating group messages...');
  for (let i = 0; i < 10; i++) {
    await prisma.groupMessage.create({
      data: {
        content: faker.lorem.sentence(),
        groupId: getRandomArrayElement(chatGroups).id,
        senderId: getRandomArrayElement(users).id,
        isEdited: faker.datatype.boolean(),
      },
    });
  }

  // 15. Create Notifications (10)
  console.log('Creating notifications...');
  const notificationTypes = [
    'MESSAGE',
    'JOB_ALERT',
    'EVENT_REMINDER',
    'APPLICATION_UPDATE',
    'SYSTEM',
  ];
  const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

  for (let i = 0; i < 10; i++) {
    await prisma.notification.create({
      data: {
        title: faker.lorem.words(4),
        content: faker.lorem.sentence(),
        type: getRandomArrayElement(notificationTypes),
        priority: getRandomArrayElement(priorities),
        read: faker.datatype.boolean(),
        link: faker.internet.url(),
        metadata: {
          source: faker.lorem.word(),
          timestamp: faker.date.recent().toISOString(),
        },
        userId: getRandomArrayElement(users).id,
      },
    });
  }

  // 16. Create Education records (10)
  console.log('Creating education records...');
  const degrees = ['Bachelor', 'Master', 'PhD', 'Associate', 'Certificate'];
  const fields = [
    'Computer Science',
    'Business Administration',
    'Engineering',
    'Psychology',
    'Biology',
  ];

  for (let i = 0; i < 10; i++) {
    await prisma.education.create({
      data: {
        institution: faker.company.name() + ' University',
        degree: getRandomArrayElement(degrees),
        field: getRandomArrayElement(fields),
        startDate: faker.date.past({ years: 8 }),
        endDate: faker.datatype.boolean()
          ? faker.date.past({ years: 2 })
          : null,
        grade: faker.helpers.arrayElement([
          'A',
          'B+',
          'B',
          'C+',
          '3.8 GPA',
          '3.5 GPA',
        ]),
        activities: faker.helpers.arrayElements(
          ['Student Government', 'Debate Club', 'Sports Team', 'Honor Society'],
          { min: 0, max: 2 },
        ),
        userId: getRandomArrayElement(users).id,
      },
    });
  }

  // 17. Create Experience records (10)
  console.log('Creating experience records...');
  for (let i = 0; i < 10; i++) {
    const startDate = faker.date.past({ years: 5 });
    await prisma.experience.create({
      data: {
        title: faker.person.jobTitle(),
        description: faker.lorem.paragraphs(2),
        startDate: startDate,
        endDate: faker.datatype.boolean()
          ? faker.date.between({ from: startDate, to: new Date() })
          : null,
        isCurrent: faker.datatype.boolean(),
        location: faker.location.city() + ', ' + faker.location.state(),
        skills: faker.helpers.arrayElements(
          ['JavaScript', 'Python', 'Management', 'Communication', 'Analysis'],
          { min: 2, max: 4 },
        ),
        userId: getRandomArrayElement(users).id,
        companyId: getRandomArrayElement(companies).id,
      },
    });
  }

  // 18. Create Skills (10)
  console.log('Creating skills...');
  const skillNames = [
    'JavaScript',
    'Python',
    'React',
    'Node.js',
    'SQL',
    'Project Management',
    'Communication',
    'Leadership',
    'Data Analysis',
    'Design',
  ];

  for (let i = 0; i < 10; i++) {
    await prisma.skill.create({
      data: {
        name: getRandomArrayElement(skillNames),
        endorsements: faker.number.int({ min: 0, max: 50 }),
        userId: getRandomArrayElement(users).id,
      },
    });
  }

  // 19. Create Documents (10)
  console.log('Creating documents...');
  const documentTypes = [
    'RESUME',
    'DEGREE_CERTIFICATE',
    'TRANSCRIPT',
    'ID_DOCUMENT',
    'PORTFOLIO',
    'COVER_LETTER',
  ];
  const verificationStatuses = [
    'PENDING',
    'APPROVED',
    'REJECTED',
    'REQUIRES_RESUBMISSION',
  ];

  for (let i = 0; i < 10; i++) {
    await prisma.document.create({
      data: {
        userId: getRandomArrayElement(users).id,
        documentType: getRandomArrayElement(documentTypes),
        originalName: faker.system.fileName(),
        cloudinaryPublicId: faker.string.alphanumeric(20),
        cloudinaryUrl: faker.internet.url(),
        fileSize: faker.number.int({ min: 1024, max: 5242880 }), // 1KB to 5MB
        mimeType: faker.helpers.arrayElement([
          'application/pdf',
          'image/jpeg',
          'image/png',
          'application/msword',
        ]),
        isVerified: faker.datatype.boolean(),
        verificationStatus: getRandomArrayElement(verificationStatuses),
        verificationNotes: faker.datatype.boolean()
          ? faker.lorem.sentence()
          : null,
        verifiedAt: faker.datatype.boolean() ? faker.date.recent() : null,
        verifiedBy: faker.datatype.boolean()
          ? getRandomArrayElement(users).id
          : null,
      },
    });
  }

  // 20. Create Job Recommendations (10)
  console.log('Creating job recommendations...');
  const usedUserJobCombinations = new Set();

  for (let i = 0; i < 10; i++) {
    let userId, jobId, combinationKey;
    let attempts = 0;

    // Try to find a unique user-job combination
    do {
      userId = getRandomArrayElement(users).id;
      jobId = getRandomArrayElement(jobs).id;
      combinationKey = `${userId}-${jobId}`;
      attempts++;

      // If we can't find a unique combination after 50 attempts, break
      if (attempts > 50) {
        console.log(
          `Skipping job recommendation ${i + 1} - couldn't find unique combination`,
        );
        break;
      }
    } while (usedUserJobCombinations.has(combinationKey));

    // Only create if we found a unique combination
    if (!usedUserJobCombinations.has(combinationKey)) {
      usedUserJobCombinations.add(combinationKey);

      await prisma.jobRecommendation.create({
        data: {
          userId: userId,
          jobId: jobId,
          score: faker.number.float({ min: 0, max: 1, precision: 0.01 }),
          reasons: {
            skillMatch: faker.number.float({ min: 0, max: 1 }),
            locationMatch: faker.number.float({ min: 0, max: 1 }),
            experienceMatch: faker.number.float({ min: 0, max: 1 }),
          },
        },
      });
    }
  }

  // Authentication and Security Models

  // 21. Create Verification Codes (10)
  console.log('Creating verification codes...');
  const verificationTypes = [
    'email_verification',
    'password_reset',
    'two_factor',
    'account_reactivation',
  ];
  const usedEmailTypeCombinations = new Set();

  for (let i = 0; i < 10; i++) {
    let email, type, combinationKey;
    let attempts = 0;

    // Try to find a unique email-type combination
    do {
      email = getRandomArrayElement(users).email;
      type = getRandomArrayElement(verificationTypes);
      combinationKey = `${email}-${type}`;
      attempts++;

      // If we can't find a unique combination after 50 attempts, break
      if (attempts > 50) {
        console.log(
          `Skipping verification code ${i + 1} - couldn't find unique combination`,
        );
        break;
      }
    } while (usedEmailTypeCombinations.has(combinationKey));

    // Only create if we found a unique combination
    if (!usedEmailTypeCombinations.has(combinationKey)) {
      usedEmailTypeCombinations.add(combinationKey);

      await prisma.verificationCode.create({
        data: {
          email: email,
          code: faker.string.numeric(6),
          token: faker.string.alphanumeric(32),
          type: type,
          expiresAt: faker.date.future(),
          attempts: faker.number.int({ min: 0, max: 3 }),
          isUsed: faker.datatype.boolean(),
        },
      });
    }
  }

  // 22. Create User Sessions (10)
  console.log('Creating user sessions...');
  for (let i = 0; i < 10; i++) {
    await prisma.userSession.create({
      data: {
        userId: getRandomArrayElement(users).id,
        sessionToken: faker.string.alphanumeric(32),
        deviceName: faker.helpers.arrayElement([
          'iPhone 12',
          'MacBook Pro',
          'Chrome Browser',
          'Android Phone',
        ]),
        deviceId: faker.string.uuid(),
        ipAddress: faker.internet.ip(),
        userAgent: faker.internet.userAgent(),
        location: faker.location.city() + ', ' + faker.location.country(),
        isActive: faker.datatype.boolean(),
        lastActivity: faker.date.recent(),
        expiresAt: faker.date.future(),
      },
    });
  }

  // 23. Create Account Lockouts (10)
  console.log('Creating account lockouts...');
  const usedEmails = new Set();

  for (let i = 0; i < 10; i++) {
    let email;
    let attempts = 0;

    // Try to find a unique email
    do {
      email = getRandomArrayElement(users).email;
      attempts++;

      // If we can't find a unique email after 50 attempts, break
      if (attempts > 50) {
        console.log(
          `Skipping account lockout ${i + 1} - couldn't find unique email`,
        );
        break;
      }
    } while (usedEmails.has(email));

    // Only create if we found a unique email
    if (!usedEmails.has(email)) {
      usedEmails.add(email);

      await prisma.accountLockout.create({
        data: {
          email: email,
          failedAttempts: faker.number.int({ min: 1, max: 5 }),
          lastFailedAttempt: faker.date.recent(),
          lockedUntil: faker.datatype.boolean() ? faker.date.future() : null,
          ipAddress: faker.internet.ip(),
        },
      });
    }
  }

  // 24. Create Security Logs (10)
  console.log('Creating security logs...');
  const securityEvents = [
    'LOGIN_SUCCESS',
    'LOGIN_FAILED',
    'PASSWORD_CHANGED',
    'PROFILE_UPDATED',
    'LOGOUT',
  ];

  for (let i = 0; i < 10; i++) {
    await prisma.securityLog.create({
      data: {
        userId: getRandomArrayElement(users).id,
        event: getRandomArrayElement(securityEvents),
        ipAddress: faker.internet.ip(),
        userAgent: faker.internet.userAgent(),
        metadata: {
          success: faker.datatype.boolean(),
          reason: faker.lorem.words(3),
        },
      },
    });
  }

  // 25. Create Login Attempts (10)
  console.log('Creating login attempts...');
  for (let i = 0; i < 10; i++) {
    await prisma.loginAttempt.create({
      data: {
        email: getRandomArrayElement(users).email,
        ipAddress: faker.internet.ip(),
        userAgent: faker.internet.userAgent(),
        success: faker.datatype.boolean(),
        failReason: faker.datatype.boolean() ? 'Invalid password' : null,
      },
    });
  }

  console.log('Database seeding completed successfully!');
  console.log(`Created:
    - 10 Users
    - 10 Companies  
    - 10 Company Locations
    - 10 Jobs
    - 10 Job Applications
    - 10 Forums
    - 10 Posts
    - 10 Comments
    - 10 Events
    - 10 Event Registrations
    - 10 Chats
    - 10 Messages
    - 10 Chat Groups
    - 10 Group Messages
    - 10 Notifications
    - 10 Education Records
    - 10 Experience Records
    - 10 Skills
    - 10 Documents
    - 10 Job Recommendations
    - 10 Verification Codes
    - 10 User Sessions
    - 10 Account Lockouts
    - 10 Security Logs
    - 10 Login Attempts`);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
// module.exports = {
//   main,
// };
