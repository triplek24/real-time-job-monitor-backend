import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { sseRegistry } from './sseClientRegistry';

export const sseConnectionHandler = (req: Request, res: Response) => {
  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  // CORS for SSE
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  res.setHeader('Access-Control-Allow-Origin', frontendUrl);
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Generate unique client ID
  const clientId = randomUUID();

  // Register client
  sseRegistry.register(clientId, {
    id: clientId,
    response: res,
    userId: req.user!.userId,
    userRole: req.user!.role,
    connectedAt: new Date(),
  });

  // Send initial connection event
  res.write(
    `event: connected\ndata: ${JSON.stringify({
      clientId,
      message: 'SSE connection established',
      timestamp: new Date().toISOString(),
    })}\n\n`
  );

  // Handle client disconnect
  req.on('close', () => {
    sseRegistry.unregister(clientId);
    res.end();
  });

  // Handle errors
  req.on('error', (error) => {
    console.error(`[SSE] Connection error for client ${clientId}:`, error);
    sseRegistry.unregister(clientId);
    res.end();
  });
};