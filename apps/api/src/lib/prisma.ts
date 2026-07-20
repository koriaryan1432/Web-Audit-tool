import { PrismaClient } from '@prisma/client';

declare global {
  // Prevent multiple instances in development hot-reload
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
}

/**
 * Prisma client singleton.
 * In development, reuse the global instance to avoid exhausting connection pool
 * during hot-module reloads. In production, create once per process.
 */
export const prisma: PrismaClient =
  globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
