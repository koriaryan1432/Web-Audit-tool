import { PrismaClient } from '@prisma/client';

declare global {
  // Prevent multiple Prisma Client instances in development (hot reload)
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
 *
 * In production: one instance per process (Railway/Node).
 * In development: reuse the global instance across hot reloads to avoid
 * exhausting the Supabase connection pool (max 10 connections on free tier).
 *
 * Connection pooling is handled by Supabase's PgBouncer via DIRECT_URL.
 * DATABASE_URL should point to the pooler (port 6543).
 * DIRECT_URL should point to the direct connection (port 5432) — used by migrations.
 */
export const prisma: PrismaClient =
  global.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

/**
 * Graceful shutdown — call this in your process exit handlers.
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}

export default prisma;
