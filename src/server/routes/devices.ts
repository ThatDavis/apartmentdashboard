import { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { devices } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export async function deviceRoutes(fastify: FastifyInstance) {
  // Get all shared devices
  fastify.get('/devices', async () => {
    const allDevices = await db
      .select()
      .from(devices)
      .where(eq(devices.isShared, true))
      .all();

    return allDevices;
  });

  // Get device state from Home Assistant (placeholder)
  fastify.get('/devices/:id/state', async (request, reply) => {
    const { id } = request.params as { id: string };
    
    const device = await db
      .select()
      .from(devices)
      .where(eq(devices.id, parseInt(id, 10)))
      .get();

    if (!device) {
      return reply.status(404).send({ error: 'Device not found' });
    }

    // TODO: Fetch actual state from Home Assistant
    return {
      deviceId: device.id,
      entityId: device.haEntityId,
      state: 'unknown',
      attributes: {},
      lastUpdated: new Date().toISOString(),
    };
  });

  // Toggle switch (placeholder)
  fastify.post('/devices/:id/toggle', async (request, reply) => {
    const { id } = request.params as { id: string };
    
    const device = await db
      .select()
      .from(devices)
      .where(eq(devices.id, parseInt(id, 10)))
      .get();

    if (!device) {
      return reply.status(404).send({ error: 'Device not found' });
    }

    if (device.type !== 'switch') {
      return reply.status(400).send({ error: 'Device is not a switch' });
    }

    // TODO: Send toggle command to Home Assistant
    return { success: true, message: 'Toggle command sent' };
  });
}
