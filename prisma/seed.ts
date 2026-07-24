import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding...');

  await prisma.job.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash('password123', 10);

  await prisma.user.create({
    data: {
      email: 'admin@test.com',
      passwordHash: password,
      role: 'ADMIN',
    },
  });

  await prisma.user.create({
    data: {
      email: 'operator@test.com',
      passwordHash: password,
      role: 'OPERATOR',
    },
  });

  await prisma.user.create({
    data: {
      email: 'viewer@test.com',
      passwordHash: password,
      role: 'VIEWER',
    },
  });

  console.log('✅ Done!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });