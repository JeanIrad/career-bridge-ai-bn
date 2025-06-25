const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const mentorshipSeeds = async () => {
  console.log('🌱 Seeding mentorship system...');

  try {
    // Get some existing users to make mentors
    const users = await prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    if (users.length < 5) {
      console.log('⚠️ Not enough users found. Please seed users first.');
      return;
    }

    // Create mentor profiles for some users
    const mentorProfiles = [];
    const mentorData = [
      {
        userId: users[0].id,
        bio: 'Senior Software Engineer with 8+ years of experience in full-stack development. Passionate about mentoring junior developers and helping them navigate their career paths.',
        expertise: [
          'JavaScript',
          'React',
          'Node.js',
          'Python',
          'System Design',
        ],
        industries: ['Technology', 'Fintech', 'E-commerce'],
        yearsOfExperience: 8,
        currentRole: 'Senior Software Engineer',
        currentCompany: 'TechCorp Inc.',
        isAvailable: true,
        maxMentees: 5,
        preferredMeetingMode: 'VIRTUAL',
        timeZone: 'America/New_York',
        hourlyRate: 75,
        isPaidMentor: true,
        isVerified: true,
        averageRating: 4.8,
        totalReviews: 12,
        status: 'ACTIVE',
      },
      {
        userId: users[1].id,
        bio: 'Product Manager with 6 years of experience in B2B SaaS. Love helping aspiring PMs understand the role and develop their skills.',
        expertise: [
          'Product Management',
          'User Research',
          'Data Analysis',
          'Strategy',
        ],
        industries: ['SaaS', 'Technology', 'Healthcare'],
        yearsOfExperience: 6,
        currentRole: 'Senior Product Manager',
        currentCompany: 'InnovateCorp',
        isAvailable: true,
        maxMentees: 3,
        preferredMeetingMode: 'HYBRID',
        timeZone: 'America/Los_Angeles',
        hourlyRate: 0,
        isPaidMentor: false,
        isVerified: true,
        averageRating: 4.9,
        totalReviews: 8,
        status: 'ACTIVE',
      },
      {
        userId: users[2].id,
        bio: 'UX Designer with 5 years of experience in design systems and user experience. Excited to share knowledge about design thinking and career growth.',
        expertise: [
          'UX Design',
          'UI Design',
          'Design Systems',
          'Figma',
          'User Research',
        ],
        industries: ['Design', 'Technology', 'Media'],
        yearsOfExperience: 5,
        currentRole: 'Senior UX Designer',
        currentCompany: 'DesignStudio',
        isAvailable: true,
        maxMentees: 4,
        preferredMeetingMode: 'VIRTUAL',
        timeZone: 'America/Chicago',
        hourlyRate: 50,
        isPaidMentor: true,
        isVerified: true,
        averageRating: 4.7,
        totalReviews: 15,
        status: 'ACTIVE',
      },
      {
        userId: users[3].id,
        bio: 'Data Scientist with 7 years of experience in machine learning and analytics. Passionate about helping others break into data science.',
        expertise: [
          'Machine Learning',
          'Python',
          'SQL',
          'Statistics',
          'Data Visualization',
        ],
        industries: ['Data Science', 'Finance', 'Healthcare'],
        yearsOfExperience: 7,
        currentRole: 'Senior Data Scientist',
        currentCompany: 'DataTech Solutions',
        isAvailable: true,
        maxMentees: 3,
        preferredMeetingMode: 'VIRTUAL',
        timeZone: 'America/New_York',
        hourlyRate: 0,
        isPaidMentor: false,
        isVerified: true,
        averageRating: 4.6,
        totalReviews: 10,
        status: 'ACTIVE',
      },
      {
        userId: users[4].id,
        bio: 'Marketing Director with 10+ years of experience in digital marketing and brand strategy. Love helping marketers advance their careers.',
        expertise: [
          'Digital Marketing',
          'Brand Strategy',
          'Content Marketing',
          'SEO',
          'Analytics',
        ],
        industries: ['Marketing', 'E-commerce', 'Consumer Goods'],
        yearsOfExperience: 10,
        currentRole: 'Marketing Director',
        currentCompany: 'BrandCorp',
        isAvailable: true,
        maxMentees: 2,
        preferredMeetingMode: 'IN_PERSON',
        timeZone: 'America/Los_Angeles',
        hourlyRate: 100,
        isPaidMentor: true,
        isVerified: true,
        averageRating: 4.9,
        totalReviews: 20,
        status: 'ACTIVE',
      },
    ];

    for (const mentor of mentorData) {
      try {
        const profile = await prisma.mentorProfile.create({
          data: mentor,
        });
        mentorProfiles.push(profile);
        console.log(`✅ Created mentor profile for ${mentor.currentRole}`);
      } catch (error) {
        console.log(
          `⚠️ Skipping mentor profile (might already exist): ${error.message}`,
        );
      }
    }

    if (mentorProfiles.length === 0) {
      console.log('⚠️ No mentor profiles created. They might already exist.');
      return;
    }

    // Create mentorship requests
    const mentorshipRequests = [];
    const requestsData = [
      {
        menteeId: users[5]?.id || users[0].id,
        mentorId: mentorProfiles[0].id,
        title: 'Career Transition to Full-Stack Development',
        description:
          'I am a recent bootcamp graduate looking to transition into a full-stack developer role. I would love guidance on building projects, preparing for interviews, and navigating the job market.',
        goals: [
          'Build a strong portfolio',
          'Prepare for technical interviews',
          'Learn system design basics',
          'Get job search advice',
        ],
        duration: 12,
        meetingFrequency: 'weekly',
        status: 'PENDING',
        priority: 'HIGH',
      },
      {
        menteeId: users[6]?.id || users[1].id,
        mentorId: mentorProfiles[1].id,
        title: 'Breaking into Product Management',
        description:
          'I am currently a business analyst and want to transition into product management. Looking for guidance on developing PM skills and making the career switch.',
        goals: [
          'Understand PM responsibilities',
          'Build PM portfolio',
          'Network with other PMs',
          'Prepare for PM interviews',
        ],
        duration: 8,
        meetingFrequency: 'bi-weekly',
        status: 'ACCEPTED',
        priority: 'MEDIUM',
        mentorResponse:
          'I would be happy to help you transition into PM! I went through a similar journey myself.',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
        endDate: new Date(Date.now() + 8 * 7 * 24 * 60 * 60 * 1000), // 8 weeks from now
      },
      {
        menteeId: users[7]?.id || users[2].id,
        mentorId: mentorProfiles[2].id,
        title: 'UX Design Career Growth',
        description:
          'I have 2 years of UX design experience and want to advance to a senior level. Looking for guidance on leadership skills and advanced design practices.',
        goals: [
          'Develop leadership skills',
          'Learn advanced design systems',
          'Build a stronger portfolio',
          'Prepare for senior roles',
        ],
        duration: 16,
        meetingFrequency: 'weekly',
        status: 'ACCEPTED',
        priority: 'MEDIUM',
        mentorResponse:
          'Great to see your enthusiasm for growth! I can definitely help with senior-level skills.',
        startDate: new Date(Date.now() - 2 * 7 * 24 * 60 * 60 * 1000), // Started 2 weeks ago
        endDate: new Date(Date.now() + 14 * 7 * 24 * 60 * 60 * 1000), // 14 weeks from now
      },
    ];

    for (const request of requestsData) {
      try {
        const mentorshipRequest = await prisma.mentorshipRequest.create({
          data: request,
        });
        mentorshipRequests.push(mentorshipRequest);
        console.log(`✅ Created mentorship request: ${request.title}`);
      } catch (error) {
        console.log(`⚠️ Error creating mentorship request: ${error.message}`);
      }
    }

    // Create mentorships for accepted requests
    const acceptedRequests = mentorshipRequests.filter(
      (r) => r.status === 'ACCEPTED',
    );
    const mentorships = [];

    for (const request of acceptedRequests) {
      try {
        const mentorship = await prisma.mentorship.create({
          data: {
            requestId: request.id,
            menteeId: request.menteeId,
            mentorId: request.mentorId,
            title: request.title,
            description: request.description,
            goals: request.goals,
            startDate: request.startDate,
            endDate: request.endDate,
            meetingFrequency: request.meetingFrequency,
            status: 'ACTIVE',
            progressScore: Math.random() * 0.5 + 0.2, // 20-70% progress
            completedSessions: Math.floor(Math.random() * 3) + 1,
            totalSessions: Math.floor(Math.random() * 5) + 3,
          },
        });
        mentorships.push(mentorship);
        console.log(`✅ Created mentorship: ${mentorship.title}`);
      } catch (error) {
        console.log(`⚠️ Error creating mentorship: ${error.message}`);
      }
    }

    // Create some mentorship sessions
    const sessions = [];
    for (const mentorship of mentorships) {
      const sessionCount = Math.floor(Math.random() * 3) + 2; // 2-4 sessions per mentorship

      for (let i = 0; i < sessionCount; i++) {
        const sessionDate = new Date(
          Date.now() + (i - 1) * 7 * 24 * 60 * 60 * 1000,
        ); // Weekly sessions
        const isCompleted = sessionDate < new Date();

        try {
          const session = await prisma.mentorshipSession.create({
            data: {
              mentorshipId: mentorship.id,
              mentorId: mentorship.mentorId,
              menteeId: mentorship.menteeId,
              title: `Session ${i + 1}: ${['Kickoff Meeting', 'Progress Review', 'Skill Development', 'Goal Setting', 'Career Planning'][i] || 'Follow-up'}`,
              description: `Regular mentorship session focusing on career development and goal achievement.`,
              agenda: [
                'Check-in on goals',
                'Discuss challenges',
                'Review progress',
                'Plan next steps',
              ],
              sessionType: 'ONE_ON_ONE',
              scheduledAt: sessionDate,
              duration: 60,
              meetingMode: 'VIRTUAL',
              meetingLink: 'https://zoom.us/j/example',
              status: isCompleted ? 'COMPLETED' : 'SCHEDULED',
              mentorAttended: isCompleted,
              menteeAttended: isCompleted,
              sessionNotes: isCompleted
                ? 'Great progress made on goals. Discussed next steps and action items.'
                : null,
              actionItems: isCompleted
                ? [
                    'Complete portfolio project',
                    'Apply to 3 companies',
                    'Practice interview questions',
                  ]
                : [],
            },
          });
          sessions.push(session);
        } catch (error) {
          console.log(`⚠️ Error creating session: ${error.message}`);
        }
      }
    }

    console.log(`✅ Created ${sessions.length} mentorship sessions`);

    // Create some mentorship reviews
    const reviews = [];
    for (let i = 0; i < Math.min(mentorProfiles.length, 3); i++) {
      const mentor = mentorProfiles[i];
      const reviewerIds = users.slice(5, 8).map((u) => u.id);

      for (let j = 0; j < Math.min(reviewerIds.length, 2); j++) {
        try {
          const review = await prisma.mentorshipReview.create({
            data: {
              mentorId: mentor.id,
              reviewerId: reviewerIds[j],
              overallRating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
              communicationRating: Math.floor(Math.random() * 2) + 4,
              knowledgeRating: 5,
              supportRating: Math.floor(Math.random() * 2) + 4,
              availabilityRating: Math.floor(Math.random() * 2) + 4,
              title: 'Excellent mentorship experience',
              review: `Working with this mentor has been incredibly valuable. They provided clear guidance, actionable feedback, and helped me achieve my career goals. Highly recommend!`,
              pros: 'Great communication, deep expertise, very supportive',
              cons: 'Sometimes sessions could be longer',
              isPublic: true,
              wouldRecommend: true,
            },
          });
          reviews.push(review);
        } catch (error) {
          console.log(`⚠️ Error creating review: ${error.message}`);
        }
      }
    }

    console.log(`✅ Created ${reviews.length} mentorship reviews`);

    // Create some goals for active mentorships
    const goals = [];
    for (const mentorship of mentorships) {
      const goalTemplates = [
        {
          title: 'Build Portfolio Website',
          description:
            'Create a professional portfolio website showcasing projects and skills',
          category: 'CAREER',
          priority: 'HIGH',
          progress: Math.floor(Math.random() * 60) + 20,
        },
        {
          title: 'Complete Technical Interview Prep',
          description: 'Practice coding problems and system design questions',
          category: 'SKILL_DEVELOPMENT',
          priority: 'HIGH',
          progress: Math.floor(Math.random() * 40) + 30,
        },
        {
          title: 'Network with Industry Professionals',
          description:
            'Attend 3 networking events and connect with 10 professionals',
          category: 'NETWORKING',
          priority: 'MEDIUM',
          progress: Math.floor(Math.random() * 50) + 10,
        },
      ];

      for (let i = 0; i < Math.min(goalTemplates.length, 2); i++) {
        const goalTemplate = goalTemplates[i];
        try {
          const goal = await prisma.goalTracking.create({
            data: {
              mentorshipId: mentorship.id,
              ...goalTemplate,
              targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
              status: goalTemplate.progress > 80 ? 'COMPLETED' : 'IN_PROGRESS',
              completedAt: goalTemplate.progress > 80 ? new Date() : null,
            },
          });
          goals.push(goal);
        } catch (error) {
          console.log(`⚠️ Error creating goal: ${error.message}`);
        }
      }
    }

    console.log(`✅ Created ${goals.length} mentorship goals`);

    console.log('🎉 Mentorship system seeding completed!');
    console.log(`📊 Summary:`);
    console.log(`   - Mentor Profiles: ${mentorProfiles.length}`);
    console.log(`   - Mentorship Requests: ${mentorshipRequests.length}`);
    console.log(`   - Active Mentorships: ${mentorships.length}`);
    console.log(`   - Sessions: ${sessions.length}`);
    console.log(`   - Reviews: ${reviews.length}`);
    console.log(`   - Goals: ${goals.length}`);
  } catch (error) {
    console.error('❌ Error seeding mentorship system:', error);
  }
};

// Run the seed function
mentorshipSeeds()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
