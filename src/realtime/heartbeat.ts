import { sseRegistry } from './sseClientRegistry';

const HEARTBEAT_INTERVAL = 30000; // 30 seconds

export const startHeartbeat = () => {
  setInterval(() => {
    const clientCount = sseRegistry.getClientCount();
    if (clientCount > 0) {
      const heartbeatMessage = `: heartbeat ${new Date().toISOString()}\n\n`;

      sseRegistry.getClients().forEach((client) => {
        try {
          client.response.write(heartbeatMessage);
        } catch (error) {
          console.error('[SSE] Heartbeat failed for client:', error);
          sseRegistry.unregister(client.id);
        }
      });

      console.log(`[SSE] Heartbeat sent to ${clientCount} clients`);
    }
  }, HEARTBEAT_INTERVAL);
};