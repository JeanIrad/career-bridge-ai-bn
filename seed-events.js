const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Sample event data with realistic content
const sampleEvents = [
  {
    title: 'Google Summer Tech Career Fair 2024',
    description:
      'Join us for an exclusive career fair featuring top tech companies including Google, Microsoft, Apple, and more. Connect with recruiters, learn about exciting opportunities, and advance your tech career.',
    shortDescription: 'Exclusive tech career fair with top companies',
    type: 'Career Fair',
    category: 'CAREER_FAIR',
    tags: ['tech', 'software', 'google', 'microsoft', 'apple', 'career'],
    location: 'San Francisco Convention Center',
    venue: 'San Francisco Convention Center',
    address: '747 Howard St, San Francisco, CA 94103',
    city: 'San Francisco',
    state: 'California',
    country: 'United States',
    mode: 'OFFLINE',
    capacity: 500,
    registrationFee: 0,
    isFeatured: true,
    priority: 'HIGH',
    enableNetworking: true,
    enableChat: true,
    enableQA: true,
    bannerImage:
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    gallery: [
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
      'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800',
    ],
    resources: ['https://careers.google.com', 'https://careers.microsoft.com'],
    agenda: {
      '9:00 AM': 'Registration & Welcome Coffee',
      '10:00 AM': 'Opening Keynote - Future of Tech',
      '11:00 AM': 'Company Booths Open',
      '12:00 PM': 'Networking Lunch',
      '2:00 PM': 'Panel Discussion - Career Growth in Tech',
      '3:30 PM': 'One-on-One Interviews',
      '5:00 PM': 'Closing Remarks',
    },
    speakers: {
      keynote: 'Sundar Pichai, CEO Google',
      panelists: ['Satya Nadella', 'Tim Cook', 'Jensen Huang'],
    },
  },
  {
    title: 'AI & Machine Learning Workshop',
    description:
      'Hands-on workshop covering the latest in AI and machine learning. Learn from industry experts, work on real projects, and build your AI portfolio.',
    shortDescription: 'Hands-on AI/ML workshop with industry experts',
    type: 'Workshop',
    category: 'WORKSHOP',
    tags: ['AI', 'machine learning', 'python', 'tensorflow', 'pytorch'],
    location: 'Stanford University',
    venue: 'Gates Computer Science Building',
    address: '353 Jane Stanford Way, Stanford, CA 94305',
    city: 'Stanford',
    state: 'California',
    country: 'United States',
    mode: 'HYBRID',
    meetingLink: 'https://zoom.us/j/123456789',
    capacity: 100,
    registrationFee: 50,
    isFeatured: true,
    priority: 'HIGH',
    enableNetworking: true,
    enableChat: true,
    enableQA: true,
    bannerImage:
      'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800',
    agenda: {
      '9:00 AM': 'Introduction to AI/ML',
      '10:30 AM': 'Hands-on TensorFlow Lab',
      '12:00 PM': 'Lunch Break',
      '1:00 PM': 'Deep Learning Workshop',
      '3:00 PM': 'Project Presentations',
      '4:30 PM': 'Q&A and Networking',
    },
  },
  {
    title: 'Startup Pitch Competition 2024',
    description:
      'Showcase your startup idea to top investors and industry leaders. Win funding, mentorship, and accelerator opportunities.',
    shortDescription: 'Pitch your startup to top investors',
    type: 'Competition',
    category: 'STARTUP_PITCH',
    tags: ['startup', 'pitch', 'investors', 'funding', 'entrepreneurship'],
    location: 'Y Combinator HQ',
    venue: 'Y Combinator',
    address: '335 Pioneer Way, Mountain View, CA 94041',
    city: 'Mountain View',
    state: 'California',
    country: 'United States',
    mode: 'OFFLINE',
    capacity: 200,
    registrationFee: 25,
    isFeatured: true,
    priority: 'URGENT',
    enableNetworking: true,
    enableChat: false,
    enableQA: true,
    bannerImage:
      'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800',
  },
  {
    title: 'Remote Work Best Practices Webinar',
    description:
      'Learn the best practices for remote work, productivity tips, and how to build a successful remote career in the post-pandemic world.',
    shortDescription: 'Master remote work and productivity',
    type: 'Webinar',
    category: 'WEBINAR',
    tags: ['remote work', 'productivity', 'work from home', 'career'],
    location: 'Online',
    mode: 'ONLINE',
    meetingLink: 'https://zoom.us/j/987654321',
    streamingUrl: 'https://youtube.com/live/abc123',
    capacity: 1000,
    registrationFee: 0,
    isFeatured: false,
    priority: 'MEDIUM',
    enableNetworking: true,
    enableChat: true,
    enableQA: true,
    bannerImage:
      'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?w=800',
  },
  {
    title: 'Women in Tech Leadership Summit',
    description:
      'Empowering women in technology through leadership development, networking, and mentorship opportunities.',
    shortDescription: 'Empowering women in tech leadership',
    type: 'Conference',
    category: 'CONFERENCE',
    tags: ['women in tech', 'leadership', 'diversity', 'mentorship'],
    location: 'Microsoft Campus',
    venue: 'Microsoft Conference Center',
    address: '1 Microsoft Way, Redmond, WA 98052',
    city: 'Redmond',
    state: 'Washington',
    country: 'United States',
    mode: 'HYBRID',
    meetingLink: 'https://teams.microsoft.com/l/meetup-join/abc123',
    capacity: 300,
    registrationFee: 75,
    isFeatured: true,
    priority: 'HIGH',
    enableNetworking: true,
    enableChat: true,
    enableQA: true,
    bannerImage:
      'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=800',
  },
  {
    title: 'Cybersecurity Career Bootcamp',
    description:
      'Intensive 3-day bootcamp covering cybersecurity fundamentals, hands-on labs, and career guidance in the cybersecurity field.',
    shortDescription: '3-day intensive cybersecurity bootcamp',
    type: 'Bootcamp',
    category: 'SKILL_BUILDING',
    tags: ['cybersecurity', 'bootcamp', 'hands-on', 'certification'],
    location: 'University of California, Berkeley',
    venue: 'Soda Hall',
    address: '306 Soda Hall, Berkeley, CA 94720',
    city: 'Berkeley',
    state: 'California',
    country: 'United States',
    mode: 'OFFLINE',
    capacity: 50,
    registrationFee: 200,
    isFeatured: false,
    priority: 'MEDIUM',
    enableNetworking: true,
    enableChat: false,
    enableQA: true,
    bannerImage:
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800',
  },
  {
    title: 'Mock Interview Marathon',
    description:
      'Practice your interview skills with industry professionals. Get personalized feedback and improve your chances of landing your dream job.',
    shortDescription: 'Practice interviews with industry pros',
    type: 'Interview Prep',
    category: 'INTERVIEW_PREP',
    tags: ['interview', 'practice', 'feedback', 'career prep'],
    location: 'Harvard Business School',
    venue: 'Baker Library',
    address: 'Soldiers Field, Boston, MA 02163',
    city: 'Boston',
    state: 'Massachusetts',
    country: 'United States',
    mode: 'OFFLINE',
    capacity: 80,
    registrationFee: 30,
    isFeatured: false,
    priority: 'MEDIUM',
    enableNetworking: true,
    enableChat: false,
    enableQA: false,
    bannerImage:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
  },
  {
    title: 'Blockchain & Cryptocurrency Summit',
    description:
      'Explore the future of blockchain technology and cryptocurrency. Learn about DeFi, NFTs, and career opportunities in Web3.',
    shortDescription: 'Explore blockchain and Web3 careers',
    type: 'Summit',
    category: 'TECH_TALK',
    tags: ['blockchain', 'cryptocurrency', 'web3', 'defi', 'nft'],
    location: 'Miami Convention Center',
    venue: 'Miami Beach Convention Center',
    address: '1901 Convention Center Dr, Miami Beach, FL 33139',
    city: 'Miami Beach',
    state: 'Florida',
    country: 'United States',
    mode: 'HYBRID',
    meetingLink: 'https://zoom.us/j/blockchain2024',
    capacity: 400,
    registrationFee: 100,
    isFeatured: true,
    priority: 'HIGH',
    enableNetworking: true,
    enableChat: true,
    enableQA: true,
    bannerImage:
      'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800',
  },
  {
    title: 'Data Science Career Panel',
    description:
      'Panel discussion with leading data scientists from Netflix, Uber, Airbnb, and more. Learn about career paths and industry trends.',
    shortDescription: 'Data science career insights from industry leaders',
    type: 'Panel',
    category: 'PANEL_DISCUSSION',
    tags: ['data science', 'panel', 'career', 'netflix', 'uber', 'airbnb'],
    location: 'UC Berkeley',
    venue: 'Wheeler Hall',
    address: 'Wheeler Hall, Berkeley, CA 94720',
    city: 'Berkeley',
    state: 'California',
    country: 'United States',
    mode: 'HYBRID',
    meetingLink: 'https://zoom.us/j/datascience2024',
    capacity: 150,
    registrationFee: 0,
    isFeatured: false,
    priority: 'MEDIUM',
    enableNetworking: true,
    enableChat: true,
    enableQA: true,
    bannerImage:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
  },
  {
    title: 'Gaming Industry Networking Mixer',
    description:
      'Connect with game developers, designers, and industry professionals. Learn about opportunities at top gaming companies.',
    shortDescription: 'Network with gaming industry professionals',
    type: 'Mixer',
    category: 'INDUSTRY_MIXER',
    tags: ['gaming', 'game development', 'networking', 'unity', 'unreal'],
    location: 'Los Angeles Convention Center',
    venue: 'South Hall',
    address: '1201 S Figueroa St, Los Angeles, CA 90015',
    city: 'Los Angeles',
    state: 'California',
    country: 'United States',
    mode: 'OFFLINE',
    capacity: 250,
    registrationFee: 40,
    isFeatured: false,
    priority: 'MEDIUM',
    enableNetworking: true,
    enableChat: false,
    enableQA: false,
    bannerImage:
      'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800',
  },
];

async function seedEvents() {
  console.log('🌱 Starting to seed events...');

  try {
    // Get some users to be event creators
    const users = await prisma.user.findMany({
      take: 10,
      where: {
        role: { in: ['EMPLOYER', 'ADMIN'] },
      },
    });

    if (users.length === 0) {
      console.log('❌ No users found. Please run user seeding first.');
      return;
    }

    // Get some companies for company events
    const companies = await prisma.company.findMany({
      take: 5,
    });

    // Get some universities for university events
    const universities = await prisma.university.findMany({
      take: 5,
    });

    const events = [];

    for (let i = 0; i < sampleEvents.length; i++) {
      const eventData = sampleEvents[i];
      const randomUser = users[Math.floor(Math.random() * users.length)];

      // Randomly assign some events to companies/universities
      const randomCompany =
        Math.random() > 0.6 && companies.length > 0
          ? companies[Math.floor(Math.random() * companies.length)]
          : null;

      const randomUniversity =
        Math.random() > 0.7 && universities.length > 0
          ? universities[Math.floor(Math.random() * universities.length)]
          : null;

      // Generate realistic dates
      const startDate = new Date();
      startDate.setDate(
        startDate.getDate() + Math.floor(Math.random() * 90) + 1,
      ); // 1-90 days from now

      const endDate = new Date(startDate);
      endDate.setHours(
        startDate.getHours() + Math.floor(Math.random() * 8) + 2,
      ); // 2-10 hours later

      const registrationDeadline = new Date(startDate);
      registrationDeadline.setDate(
        startDate.getDate() - Math.floor(Math.random() * 3) - 1,
      ); // 1-3 days before event (but ensure it's still in the future)

      // If registration deadline is in the past, set it to tomorrow
      const now = new Date();
      if (registrationDeadline <= now) {
        registrationDeadline.setTime(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
      }

      const event = await prisma.event.create({
        data: {
          ...eventData,
          startDate,
          endDate,
          registrationDeadline,
          timezone: 'America/Los_Angeles',
          duration: Math.floor(Math.random() * 480) + 120, // 2-8 hours in minutes
          isRegistrationOpen: true, // Ensure registration is open
          creatorId: randomUser.id,
          companyId: randomCompany?.id,
          universityId: randomUniversity?.id,
          currentAttendees: Math.floor(
            Math.random() * (eventData.capacity * 0.8),
          ),
          viewCount: Math.floor(Math.random() * 1000),
          shareCount: Math.floor(Math.random() * 100),
        },
      });

      events.push(event);

      // Create some sample registrations
      const registrationCount = Math.floor(
        Math.random() * Math.min(eventData.capacity, users.length),
      );
      const shuffledUsers = [...users].sort(() => 0.5 - Math.random());

      for (let j = 0; j < registrationCount; j++) {
        const user = shuffledUsers[j];
        if (user.id !== randomUser.id) {
          // Don't register the creator
          try {
            await prisma.eventRegistration.create({
              data: {
                eventId: event.id,
                userId: user.id,
                status: j < eventData.capacity ? 'REGISTERED' : 'WAITLISTED',
                attendanceStatus:
                  Math.random() > 0.3 ? 'REGISTERED' : 'CHECKED_IN',
                interests: ['networking', 'career growth', 'learning'].slice(
                  0,
                  Math.floor(Math.random() * 3) + 1,
                ),
                lookingFor: ['job opportunities', 'mentorship', 'skills'].slice(
                  0,
                  Math.floor(Math.random() * 3) + 1,
                ),
                industries: ['technology', 'finance', 'healthcare'].slice(
                  0,
                  Math.floor(Math.random() * 2) + 1,
                ),
                skills: ['javascript', 'python', 'react', 'node.js'].slice(
                  0,
                  Math.floor(Math.random() * 3) + 1,
                ),
                experience: ['Entry Level', 'Mid Level', 'Senior Level'][
                  Math.floor(Math.random() * 3)
                ],
                goals: 'Looking to advance my career and learn new skills',
              },
            });
          } catch (error) {
            // Skip if duplicate registration
            if (!error.message.includes('Unique constraint')) {
              console.error('Error creating registration:', error);
            }
          }
        }
      }

      // Create some sample feedback for past events
      if (Math.random() > 0.5) {
        const feedbackCount = Math.floor(registrationCount * 0.3); // 30% of attendees leave feedback

        for (let k = 0; k < feedbackCount && k < shuffledUsers.length; k++) {
          const user = shuffledUsers[k];
          if (user.id !== randomUser.id) {
            try {
              await prisma.eventFeedback.create({
                data: {
                  eventId: event.id,
                  userId: user.id,
                  overallRating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
                  contentRating: Math.floor(Math.random() * 2) + 4,
                  organizationRating: Math.floor(Math.random() * 2) + 4,
                  venueRating: Math.floor(Math.random() * 2) + 4,
                  networkingRating: Math.floor(Math.random() * 2) + 4,
                  feedback:
                    'Great event! Learned a lot and made valuable connections.',
                  highlights:
                    'The networking session was excellent and the speakers were very knowledgeable.',
                  wouldRecommend: true,
                  wouldAttendAgain: true,
                  isAnonymous: Math.random() > 0.7,
                  isPublic: Math.random() > 0.2,
                },
              });
            } catch (error) {
              // Skip if duplicate feedback
              if (!error.message.includes('Unique constraint')) {
                console.error('Error creating feedback:', error);
              }
            }
          }
        }
      }

      console.log(`✅ Created event: ${event.title}`);
    }

    console.log(
      `🎉 Successfully seeded ${events.length} events with registrations and feedback!`,
    );

    // Print summary
    const eventStats = await prisma.event.groupBy({
      by: ['category'],
      _count: true,
    });

    console.log('\n📊 Event Summary by Category:');
    eventStats.forEach((stat) => {
      console.log(`  ${stat.category}: ${stat._count} events`);
    });

    const totalRegistrations = await prisma.eventRegistration.count();
    const totalFeedback = await prisma.eventFeedback.count();

    console.log(`\n📈 Additional Stats:`);
    console.log(`  Total Registrations: ${totalRegistrations}`);
    console.log(`  Total Feedback: ${totalFeedback}`);
  } catch (error) {
    console.error('❌ Error seeding events:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedEvents();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { seedEvents };
