import { prisma } from '../../config/database';

export const createJob = async (
  data: {
    title: string;
    position: string;
    experience: string;
    description: string;
  },
  createdById: string
) => {
  const job = await prisma.job.create({
    data: {
      title: data.title,
      position: data.position as any,
      experience: data.experience,
      description: data.description,
      createdById,
      status: 'QUEUED',
      progress: 0,
    },
  });

  // Fetch with creator separately
  const jobWithCreator = await prisma.job.findUnique({
    where: { id: job.id },
    include: {
      creator: {
        select: { id: true, email: true, role: true },
      },
    },
  });

  return jobWithCreator!;
};

// export const getAllJobs = async (page: number = 1, limit: number = 50) => {
//   const skip = (page - 1) * limit;

//   const [jobs, total] = await Promise.all([
//     prisma.job.findMany({
//       skip,
//       take: limit,
//       orderBy: { createdAt: 'desc' },
//       include: {
//         creator: {
//           select: { id: true, email: true, role: true },
//         },
//       },
//     }),
//     prisma.job.count(),
//   ]);

//   return {
//     jobs,
//     total,
//     page,
//     totalPages: Math.ceil(total / limit),
//   };
// };
export const getAllJobs = async (filters: {
  page?: number;
  limit?: number;
  search?: string;
  position?: string;
  experienceRange?: string;
  status?: string;
}) => {
  const { page = 1, limit = 50, search, position, experienceRange, status } = filters;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (position) {
    where.position = position;
  }

  if (experienceRange) {
    where.experience = { contains: experienceRange };
  }

  if (status) {
    where.status = status;
  }

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: { id: true, email: true, role: true },
        },
      },
    }),
    prisma.job.count({ where }),
  ]);

  return { jobs, total, page, totalPages: Math.ceil(total / limit) };
};
export const cancelJob = async (jobId: string) => {
  const job = await prisma.job.findUnique({ where: { id: jobId } });

  if (!job) {
    throw new Error('Job not found');
  }

  if (job.status === 'COMPLETED' || job.status === 'FAILED') {
    throw new Error('Cannot cancel a job that is already completed or failed');
  }

  const updatedJob = await prisma.job.update({
    where: { id: jobId },
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

  return updatedJob;
};

export const retryJob = async (jobId: string) => {
  const job = await prisma.job.findUnique({ where: { id: jobId } });

  if (!job) {
    throw new Error('Job not found');
  }

  if (job.status !== 'FAILED') {
    throw new Error('Can only retry failed jobs');
  }

  const updatedJob = await prisma.job.update({
    where: { id: jobId },
    data: {
      status: 'QUEUED',
      progress: 0,
      completedAt: null,
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

  return updatedJob;
};