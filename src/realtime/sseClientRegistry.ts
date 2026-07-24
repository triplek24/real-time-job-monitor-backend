import { Response } from 'express';

interface SSEClient {
  id: string;
  response: Response;
  userId: string;
  userRole: string;
  connectedAt: Date;
}

class SSEClientRegistry {
  private clients: Map<string, SSEClient> = new Map();

  register(clientId: string, client: SSEClient) {
    this.clients.set(clientId, client);
    console.log(`[SSE] Client registered: ${clientId} (${client.userRole}) - Total: ${this.clients.size}`);
  }

  unregister(clientId: string) {
    const client = this.clients.get(clientId);
    if (client) {
      this.clients.delete(clientId);
      console.log(`[SSE] Client unregistered: ${clientId} - Total: ${this.clients.size}`);
    }
  }

  broadcast(eventType: string, data: any) {
    const message = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
    let successCount = 0;
    let failCount = 0;

    this.clients.forEach((client, clientId) => {
      try {
        client.response.write(message);
        successCount++;
      } catch (error) {
        console.error(`[SSE] Failed to send to client ${clientId}:`, error);
        this.unregister(clientId);
        failCount++;
      }
    });

    if (successCount > 0) {
      console.log(`[SSE] Broadcasted ${eventType} to ${successCount} clients (${failCount} failed)`);
    }
  }

  sendToClient(clientId: string, eventType: string, data: any) {
    const client = this.clients.get(clientId);
    if (client) {
      const message = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
      try {
        client.response.write(message);
      } catch (error) {
        console.error(`[SSE] Failed to send to client ${clientId}:`, error);
        this.unregister(clientId);
      }
    }
  }

  getClientCount(): number {
    return this.clients.size;
  }

  getClients(): SSEClient[] {
    return Array.from(this.clients.values());
  }
}

export const sseRegistry = new SSEClientRegistry();