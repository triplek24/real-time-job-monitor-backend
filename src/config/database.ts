
// import { PrismaClient } from '@prisma/client';
// export const prisma = new PrismaClient({
//   log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
// });


// process.on('beforeExit', async () => {
//   await prisma.$disconnect();
// });
// database.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  if (!globalForPrisma.prisma) {
    console.log('[PRISMA] Creating new client instance');
  }
  globalForPrisma.prisma = prisma;
}
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

