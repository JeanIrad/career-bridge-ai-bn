import { PrismaClient } from '@prisma/client';
import { seedUniversities } from './seeds/universities.seed';
import { seedAchievements } from './seeds/achievements.seed';
// import { main as randomSeeds } from './seeds/random-seeds.js';
import { main as newSeeds } from './seeds/new-seeds';

const prisma = new PrismaClient();

export async function main() {
  try {
    // Seed universities
    await seedUniversities();
    await seedAchievements();
    // await randomSeeds();
    await newSeeds();
    // Add other seed operations here
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
