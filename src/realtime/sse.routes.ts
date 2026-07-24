import { Router } from 'express';
import { authenticateSSE } from '../middleware/sseAuth';
import { sseConnectionHandler } from './sse.controller';

const router = Router();

router.get('/', authenticateSSE, sseConnectionHandler);

export default router;

