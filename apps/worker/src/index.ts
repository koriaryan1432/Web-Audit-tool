import 'dotenv/config';
import { disconnectPrisma } from './lib/prisma.js';

const REDIS_ENABLED =
  Boolean(process.env.UPSTASH_REDIS_URL) &&
  Boolean(process.env.UPSTASH_REDIS_TOKEN);

console.log('[worker] SiteGrade Audit Worker starting...');
console.log(`[worker] Concurrency: ${process.env.WORKER_CONCURRENCY ?? '2'}`);
console.log(`[worker] Node: ${process.version}`);
console.log(`[worker] Redis: ${REDIS_ENABLED ? 'enabled' : 'DISABLED (set UPSTASH_REDIS_URL + UPSTASH_REDIS_TOKEN to enable)'}`);

async function shutdown(signal: string) {
  console.log(`[worker] Received ${signal}, shutting down gracefully...`);
  try {
    if (worker) await worker.close();
    await disconnectPrisma();
    console.log('[worker] Shutdown complete');
    process.exit(0);
  } catch (err) {
    console.error('[worker] Error during shutdown:', err);
    process.exit(1);
  }
}

let worker: { close: () => Promise<void> } | null = null;

if (!REDIS_ENABLED) {
  console.warn('[worker] Redis not configured — worker is running in no-op mode.');
  console.warn('[worker] Audit jobs will NOT be processed until UPSTASH_REDIS_URL and UPSTASH_REDIS_TOKEN are set.');
  console.log('[worker] Ready (no-op mode). Process will stay alive for health checks.');
} else {
  const { createAuditWorker } = await import('./queue/processor.js');
  worker = createAuditWorker();
  console.log('[worker] Ready. Waiting for audit jobs...');
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  console.error('[worker] Uncaught exception:', err);
  shutdown('uncaughtException');
});
process.on('unhandledRejection', (reason) => {
  console.error('[worker] Unhandled rejection:', reason);
});
