import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { getMeController } from './user.controller';

const router = Router();

router.get('/me', authenticate, getMeController);

export default router;