const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testEvents() {
  try {
    console.log('Testing database connection...');

    // Test basic connection
    const userCount = await prisma.user.count();
    console.log(`Found ${userCount} users in database`);

    // Test events
    const eventCount = await prisma.event.count();
    console.log(`Found ${eventCount} events in database`);

    if (eventCount > 0) {
      const events = await prisma.event.findMany({
        take: 3,
        select: {
          id: true,
          title: true,
          category: true,
          status: true,
          startDate: true,
        },
      });
      console.log('Sample events:', events);
    }

    console.log('Database test completed successfully!');
  } catch (error) {
    console.error('Database test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testEvents();
