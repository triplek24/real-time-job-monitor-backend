import { Request, Response } from 'express';
import { z } from 'zod';
import * as jobService from './job.service';
import { broadcastJobUpdate } from '../../lib/broadcast';



const createJobSchema = z.object({
  title: z.string().min(1).max(255),
  position: z.enum(['JUNIOR', 'MIDDLE', 'SENIOR', 'STAFF']),
  experience: z.string().min(1),
  description: z.string().min(10).max(5000),
});

export const createJobController = async (req: Request, res: Response) => {
  try {
    const data = createJobSchema.parse(req.body);
    const job = await jobService.createJob(data, req.user!.userId);
    await broadcastJobUpdate(job);
    res.status(201).json({ success: true, data: job });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: error.message || 'Failed to create job',
    });
  }
};

// export const getJobsController = async (req: Request, res: Response) => {
//   try {
//     const page = parseInt(req.query.page as string) || 1;
//     const limit = parseInt(req.query.limit as string) || 50;

//     const result = await jobService.getAllJobs(page, limit);

//     res.json({
//       success: true,
//       data: result,
//     });
//   } catch (error: any) {
//     res.status(500).json({
//       success: false,
//       error: 'Server Error',
//       message: error.message || 'Failed to fetch jobs',
//     });
//   }
// };

// export const getJobsController = async (req: Request, res: Response) => {
//   try {
//     const filters = {
//       page: parseInt(req.query.page as string) || 1,
//       limit: parseInt(req.query.limit as string) || 50,
//       search: req.query.search as string,
//       position: req.query.position as string,
//       experienceRange: req.query.experienceRange as string,
//       status: req.query.status as string,
//     };

//     const result = await jobService.getAllJobs(filters);
//     res.json({ success: true, data: result });
//   } catch (error: any) {
//     res.status(500).json({
//       success: false,
//       error: 'Server Error',
//       message: error.message || 'Failed to fetch jobs',
//     });
//   }
// };
// jobsController.ts
export const getJobsController = async (req: Request, res: Response) => {
  const t0 = performance.now();
  try {
    const filters = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 50,
      search: req.query.search as string,
      position: req.query.position as string,
      experienceRange: req.query.experienceRange as string,
      status: req.query.status as string,
    };

    const t1 = performance.now();
    const result = await jobService.getAllJobs(filters);
    const t2 = performance.now();

    console.log(`[TIMING] parse: ${(t1 - t0).toFixed(1)}ms | query: ${(t2 - t1).toFixed(1)}ms | total: ${(t2 - t0).toFixed(1)}ms`);

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message || 'Failed to fetch jobs',
    });
  }
};
export const cancelJobController = async (req: Request, res: Response) => {
  try {
    // Fix: Ensure jobId is always a string
    const jobId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    
    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Job ID is required',
      });
    }

    const job = await jobService.cancelJob(jobId);

    // Broadcast update
    await broadcastJobUpdate(job);

    res.json({
      success: true,
      data: job,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: error.message || 'Failed to cancel job',
    });
  }
};

export const retryJobController = async (req: Request, res: Response) => {
  try {
    // Fix: Ensure jobId is always a string
    const jobId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    
    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Job ID is required',
      });
    }

    const job = await jobService.retryJob(jobId);

    // Broadcast update
    await broadcastJobUpdate(job);

    res.json({
      success: true,
      data: job,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: error.message || 'Failed to retry job',
    });
  }
};