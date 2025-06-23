import { PrismaClient } from '@prisma/client';
import { seedUniversities } from './seeds/universities.seed';

const prisma = new PrismaClient();

async function main() {
  try {
    // Seed universities
    await seedUniversities();

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
