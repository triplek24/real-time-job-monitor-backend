
import { sseRegistry } from '../realtime/sseClientRegistry';
import { prisma } from '../config/database';

export const broadcastJobUpdate = async (job: any) => {
  try {
    sseRegistry.broadcast('job-update', {
      id: job.id,
      title: job.title,
      status: job.status,
      progress: job.progress,
      createdById: job.createdById,
      creator: job.creator,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      completedAt: job.completedAt,
    });

    console.log(`[BROADCAST] Job ${job.id}: ${job.status} (${job.progress}%)`);
  } catch (error) {
    console.error('[BROADCAST] Error broadcasting job update:', error);
  }
};

export const broadcastMetricsUpdate = async () => {
  try {
    const [total, queued, processing, completed, failed] = await Promise.all([
      prisma.job.count(),
      prisma.job.count({ where: { status: 'QUEUED' } }),
      prisma.job.count({ where: { status: 'PROCESSING' } }),
      prisma.job.count({ where: { status: 'COMPLETED' } }),
      prisma.job.count({ where: { status: 'FAILED' } }),
    ]);

    const finishedJobs = completed + failed;
    const successRate = finishedJobs > 0 ? parseFloat(((completed / finishedJobs) * 100).toFixed(1)) : 0;

    sseRegistry.broadcast('metrics-update', {
      total,
      queued,
      processing,
      completed,
      failed,
      successRate,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[BROADCAST] Error broadcasting metrics:', error);
  }
};