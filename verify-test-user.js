const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyTestUser() {
  try {
    const user = await prisma.user.update({
      where: { email: 'admin@test.com' },
      data: {
        isVerified: true,
        accountStatus: 'ACTIVE',
      },
    });

    console.log('User verified successfully:', user.email);
    console.log('Account status:', user.accountStatus);
    console.log('Is verified:', user.isVerified);
  } catch (error) {
    console.error('Error verifying user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyTestUser();
