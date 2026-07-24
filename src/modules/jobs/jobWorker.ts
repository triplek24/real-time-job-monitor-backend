import { prisma } from '../../config/database';
import { broadcastJobUpdate, broadcastMetricsUpdate } from '../../lib/broadcast';

const WORKER_INTERVAL = 2000; // 2 seconds
const FAILURE_CHANCE = 0.1; 
const PROGRESS_INCREMENT_MIN = 5;
const PROGRESS_INCREMENT_MAX = 20;

export const startJobWorker = () => {
  console.log('[WORKER] Job worker started');

  setInterval(async () => {
    try {
   
      const queuedJobs = await prisma.job.findMany({
        where: { status: 'QUEUED' },
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
        },
      });

      for (const job of queuedJobs) {
        const updatedJob = await prisma.job.update({
          where: { id: job.id },
          data: {
            status: 'PROCESSING',
            progress: 0,
          },
          include: {
            creator: {
              select: {
                id: true,
                email: true,
                role: true,
              },
            },
          },
        });
        await broadcastJobUpdate(updatedJob);
      }

      // Step 2: Process PROCESSING jobs
      const processingJobs = await prisma.job.findMany({
        where: { status: 'PROCESSING' },
        include: {
          creator: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
        },
      });

      for (const job of processingJobs) {
    
        if (job.progress === 0 && Math.random() < FAILURE_CHANCE) {
          const failedJob = await prisma.job.update({
            where: { id: job.id },
            data: {
              status: 'FAILED',
              completedAt: new Date(),
            },
            include: {
              creator: {
                select: {
                  id: true,
                  email: true,
                  role: true,
                },
              },
            },
          });
          await broadcastJobUpdate(failedJob);
          continue;
        }

        // Increment progress
        const increment = Math.floor(
          Math.random() * (PROGRESS_INCREMENT_MAX - PROGRESS_INCREMENT_MIN) + PROGRESS_INCREMENT_MIN
        );
        const newProgress = Math.min(job.progress + increment, 100);

        if (newProgress >= 100) {
          // Job completed
          const completedJob = await prisma.job.update({
            where: { id: job.id },
            data: {
              status: 'COMPLETED',
              progress: 100,
              completedAt: new Date(),
            },
            include: {
              creator: {
                select: {
                  id: true,
                  email: true,
                  role: true,
                },
              },
            },
          });
          await broadcastJobUpdate(completedJob);
        } else {
          // Job still processing
          const updatedJob = await prisma.job.update({
            where: { id: job.id },
            data: { progress: newProgress },
            include: {
              creator: {
                select: {
                  id: true,
                  email: true,
                  role: true,
                },
              },
            },
          });
          await broadcastJobUpdate(updatedJob);
        }
      }

      
      await broadcastMetricsUpdate();
    } catch (error) {
      console.error('[WORKER] Error processing jobs:', error);
    }
  }, WORKER_INTERVAL);
};