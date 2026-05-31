import { FastifyInstance } from 'fastify';

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async () => {
    // TODO: Check Home Assistant connectivity
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      haConnected: false, // Will be updated when HA integration is added
    };
  });
}
