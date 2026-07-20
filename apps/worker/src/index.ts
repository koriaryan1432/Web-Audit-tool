import 'dotenv/config';
import { createAuditWorker } from './queue/processor.js';
import { disconnectPrisma } from './lib/prisma.js';

console.log('[worker] SiteGrade Audit Worker starting...');
console.log(`[worker] Concurrency: ${process.env.WORKER_CONCURRENCY ?? '2'}`);
console.log(`[worker] Node: ${process.version}`);

const worker = createAuditWorker();

async function shutdown(signal: string) {
  console.log(`[worker] Received ${signal}, shutting down gracefully...`);
  try {
    await worker.close();
    await disconnectPrisma();
    console.log('[worker] Shutdown complete');
    process.exit(0);
  } catch (err) {
    console.error('[worker] Error during shutdown:', err);
    process.exit(1);
  }
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

console.log('[worker] Ready. Waiting for audit jobs...');
