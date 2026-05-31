import { FastifyInstance } from 'fastify';
import { haService } from '../services/homeAssistant.js';

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async () => {
    const haStatus = await haService.checkConnection();
    
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      haConnected: haStatus.connected,
      haError: haStatus.error,
    };
  });
}
