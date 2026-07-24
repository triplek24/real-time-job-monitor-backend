import { prisma } from '../../config/database';
import { broadcastJobUpdate, broadcastMetricsUpdate } from '../../lib/broadcast';

const WORKER_INTERVAL = 5000; // 5 seconds for production
const FAILURE_CHANCE = 0.05; // 5% failure rate
const PROGRESS_INCREMENT_MIN = 10;
const PROGRESS_INCREMENT_MAX = 25;
const MAX_BATCH_SIZE = 20; // Process max 20 jobs at once

let workerInterval: NodeJS.Timeout | null = null;

export const startJobWorker = () => {
  console.log('[WORKER] Job worker started');

  workerInterval = setInterval(async () => {
    try {
      // Ensure database connection
      await prisma.$connect();

      // Step 1: Transition QUEUED jobs to PROCESSING (with limit)
      const queuedJobs = await prisma.job.findMany({
        where: { status: 'QUEUED' },
        take: 10, // Max 10 new jobs per cycle
        include: {
          creator: {
            select: { id: true, email: true, role: true },
          },
        },
      });

      for (const job of queuedJobs) {
        try {
          const updatedJob = await prisma.job.update({
            where: { id: job.id },
            data: { status: 'PROCESSING', progress: 0 },
            include: {
              creator: {
                select: { id: true, email: true, role: true },
              },
            },
          });
          await broadcastJobUpdate(updatedJob);
          console.log(`[WORKER] Started job: ${job.id}`);
        } catch (err) {
          console.error(`[WORKER] Failed to start job ${job.id}:`, err);
        }
      }

      // Step 2: Process PROCESSING jobs (with limit)
      const processingJobs = await prisma.job.findMany({
        where: { status: 'PROCESSING' },
        take: MAX_BATCH_SIZE,
        include: {
          creator: {
            select: { id: true, email: true, role: true },
          },
        },
      });

      for (const job of processingJobs) {
        try {
          // Calculate progress increment
          const increment = Math.floor(
            Math.random() * (PROGRESS_INCREMENT_MAX - PROGRESS_INCREMENT_MIN) + 
            PROGRESS_INCREMENT_MIN
          );
          const newProgress = Math.min(job.progress + increment, 100);

          // Check if job should complete
          if (newProgress >= 100) {
            const completedJob = await prisma.job.update({
              where: { id: job.id },
              data: {
                status: 'COMPLETED',
                progress: 100,
                completedAt: new Date(),
              },
              include: {
                creator: {
                  select: { id: true, email: true, role: true },
                },
              },
            });
            await broadcastJobUpdate(completedJob);
            console.log(`[WORKER] Completed job: ${job.id}`);
            continue;
          }

          // Random chance of failure (only for jobs that haven't progressed much)
          if (job.progress < 50 && Math.random() < FAILURE_CHANCE) {
            const failedJob = await prisma.job.update({
              where: { id: job.id },
              data: {
                status: 'FAILED',
                completedAt: new Date(),
              },
              include: {
                creator: {
                  select: { id: true, email: true, role: true },
                },
              },
            });
            await broadcastJobUpdate(failedJob);
            console.log(`[WORKER] Failed job: ${job.id}`);
            continue;
          }

          // Update progress
          const updatedJob = await prisma.job.update({
            where: { id: job.id },
            data: { progress: newProgress },
            include: {
              creator: {
                select: { id: true, email: true, role: true },
              },
            },
          });
          await broadcastJobUpdate(updatedJob);
        } catch (err) {
          console.error(`[WORKER] Error processing job ${job.id}:`, err);
        }
      }

      // Broadcast metrics (less frequently)
      if (queuedJobs.length > 0 || processingJobs.length > 0) {
        await broadcastMetricsUpdate();
      }

    } catch (error) {
      console.error('[WORKER] Critical error:', error);
      // Log but don't crash - will retry next interval
    }
  }, WORKER_INTERVAL);

  console.log(`[WORKER] Running every ${WORKER_INTERVAL}ms`);
};

// Graceful shutdown
export const stopJobWorker = () => {
  if (workerInterval) {
    clearInterval(workerInterval);
    workerInterval = null;
    console.log('[WORKER] Job worker stopped');
  }
};

// Handle process termination
process.on('SIGTERM', () => {
  console.log('[WORKER] SIGTERM received, stopping worker...');
  stopJobWorker();
  prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[WORKER] SIGINT received, stopping worker...');
  stopJobWorker();
  prisma.$disconnect();
  process.exit(0);
});