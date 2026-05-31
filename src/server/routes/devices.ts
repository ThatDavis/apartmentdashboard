import { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { devices } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { haService } from '../services/homeAssistant.js';

export async function deviceRoutes(fastify: FastifyInstance) {
  // Get all shared devices with their current state
  fastify.get('/devices', async () => {
    const allDevices = await db
      .select()
      .from(devices)
      .where(eq(devices.isShared, true))
      .all();

    // Fetch current states from Home Assistant
    const haStates = await haService.getAllStates();
    
    return allDevices.map(device => {
      const haState = haStates.find(s => s.entity_id === device.haEntityId);
      const batteryState = device.batteryEntityId 
        ? haStates.find(s => s.entity_id === device.batteryEntityId)
        : null;

      return {
        ...device,
        state: haState?.state || 'unavailable',
        attributes: haState?.attributes || {},
        lastUpdated: haState?.last_updated || null,
        isOnline: haState?.state !== 'unavailable' && haState?.state !== 'unknown',
        battery: batteryState ? parseInt(batteryState.state, 10) || null : null,
      };
    });
  });

  // Get device state from Home Assistant
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

    const haState = await haService.getDeviceState(device.haEntityId);
    const batteryState = device.batteryEntityId
      ? await haService.getDeviceState(device.batteryEntityId)
      : null;

    if (!haState) {
      return reply.status(503).send({ 
        error: 'Home Assistant unavailable or device not found',
        isOnline: false,
      });
    }

    return {
      deviceId: device.id,
      entityId: device.haEntityId,
      state: haState.state,
      attributes: haState.attributes,
      lastUpdated: haState.last_updated,
      isOnline: haState.state !== 'unavailable' && haState.state !== 'unknown',
      battery: batteryState ? parseInt(batteryState.state, 10) || null : null,
    };
  });

  // Toggle switch
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

    const success = await haService.toggleSwitch(device.haEntityId);
    
    if (!success) {
      return reply.status(503).send({ 
        error: 'Failed to toggle device. Home Assistant may be unavailable.' 
      });
    }

    return { success: true, message: 'Toggle command sent' };
  });
}
