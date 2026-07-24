

import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';
import * as jobController from './job.controller';
import rateLimit from 'express-rate-limit';
const router = Router();
const createJobLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 jobs per minute
  message: 'Too many jobs created, please try again later',
});

// All routes require authentication
router.use(authenticate);

// View jobs - all roles
router.get('/', jobController.getJobsController);

// Create job - ADMIN & OPERATOR only
router.post('/', authenticate, requireRole('ADMIN', 'OPERATOR'), createJobLimiter, jobController.createJobController);
// Cancel job - ADMIN & OPERATOR only
router.post('/:id/cancel', requireRole('ADMIN', 'OPERATOR'), jobController.cancelJobController);

// Retry job - ADMIN & OPERATOR only
router.post('/:id/retry', requireRole('ADMIN', 'OPERATOR'), jobController.retryJobController);

export default router;