import { PrismaClient } from '@prisma/client';

/**
 * Prisma client for the worker process.
 * Workers run as long-lived Node processes, so no global hot-reload guard needed.
 */
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}

export default prisma;
