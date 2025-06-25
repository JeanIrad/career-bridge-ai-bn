const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const universities = [
  {
    name: "Stanford University",
    shortName: "Stanford",
    city: "Stanford",
    state: "California",
    country: "United States",
    type: "PRIVATE",
    worldRanking: 3,
    isTopTier: true,
    isActive: true,
    isVerified: true,
    popularMajors: ["Computer Science", "Engineering", "Business", "Medicine", "Law"],
    isPartnershipReady: true,
  },
  {
    name: "Massachusetts Institute of Technology",
    shortName: "MIT",
    city: "Cambridge",
    state: "Massachusetts",
    country: "United States",
    type: "PRIVATE",
    worldRanking: 1,
    isTopTier: true,
    isActive: true,
    isVerified: true,
    popularMajors: ["Computer Science", "Engineering", "Physics", "Mathematics", "Economics"],
    isPartnershipReady: true,
  },
  {
    name: "Harvard University",
    shortName: "Harvard",
    city: "Cambridge",
    state: "Massachusetts",
    country: "United States",
    type: "PRIVATE",
    worldRanking: 2,
    isTopTier: true,
    isActive: true,
    isVerified: true,
    popularMajors: ["Business", "Law", "Medicine", "Liberal Arts", "Economics"],
    isPartnershipReady: true,
  },
  {
    name: "University of California, Berkeley",
    shortName: "UC Berkeley",
    city: "Berkeley",
    state: "California",
    country: "United States",
    type: "PUBLIC",
    worldRanking: 4,
    isTopTier: true,
    isActive: true,
    isVerified: true,
    popularMajors: ["Computer Science", "Engineering", "Business", "Economics", "Biology"],
    isPartnershipReady: true,
  }
];

async function seedUniversities() {
  try {
    console.log('🌱 Seeding universities...');

    for (const university of universities) {
      const existing = await prisma.university.findFirst({
        where: { name: university.name }
      });

      if (!existing) {
        await prisma.university.create({
          data: university
        });
        console.log(`✅ Created: ${university.name}`);
      } else {
        console.log(`⏭️  Exists: ${university.name}`);
      }
    }

    const total = await prisma.university.count();
    console.log(`🎯 Total universities in database: ${total}`);

  } catch (error) {
    console.error('❌ Error seeding universities:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedUniversities();
