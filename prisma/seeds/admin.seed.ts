import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { main as randomSeeds } from './random-seeds';
const prisma = new PrismaClient();

async function main() {
  const salt = await bcrypt.genSalt();
  const password = await bcrypt.hash(
    process.env.ADMIN_PASSWORD || 'admin123',
    salt,
  );

  const admin = await prisma.user.upsert({
    where: { email: 'admin@careerbridge.ai' },
    update: {},
    create: {
      email: 'admin@careerbridge.ai',
      password: password,
      role: 'SUPER_ADMIN',
      firstName: 'Super',
      lastName: 'Admin',
      accountStatus: 'ACTIVE',
      gender: 'MALE',
      dateOfBirth: new Date('1990-01-01'),
      phoneNumber: '+8801712345678',
      address: '123 Main St, Anytown, USA',
      city: 'Anytown',
      state: 'CA',
      isVerified: true,
    },
  });

  console.log(`super admin user is created: email: ${admin.email}`);

  // Run the complete seed
  // await completeSeeds()
  // await randomSeeds();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
