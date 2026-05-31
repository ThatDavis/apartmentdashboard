import { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { devices } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { haService } from '../services/homeAssistant.js';
import { AuthenticatedRequest, requireAdmin } from '../middleware/auth.js';

const ALLOWED_DOMAINS = (process.env.ALLOWED_DOMAINS || 'switch,light,sensor,binary_sensor')
  .split(',')
  .map(d => d.trim())
  .filter(Boolean);

interface AddDeviceBody {
  haEntityId: string;
  name: string;
  type: string;
  batteryEntityId?: string;
}

function getDomain(entityId: string): string {
  return entityId.split('.')[0];
}

function isDomainAllowed(entityId: string): boolean {
  return ALLOWED_DOMAINS.includes(getDomain(entityId));
}

export async function adminRoutes(fastify: FastifyInstance) {
  // Apply admin check to all routes in this plugin
  fastify.addHook('preHandler', async (request: AuthenticatedRequest, reply) => {
    await requireAdmin(request, reply);
  });

  // List all devices in database
  fastify.get('/admin/devices', async () => {
    return db.select().from(devices).all();
  });

  // Add a new device
  fastify.post<{ Body: AddDeviceBody }>('/admin/devices', async (request, reply) => {
    const { haEntityId, name, type, batteryEntityId } = request.body;

    // Validate domain
    if (!isDomainAllowed(haEntityId)) {
      return reply.status(400).send({
        error: 'Domain not allowed',
        domain: getDomain(haEntityId),
        allowedDomains: ALLOWED_DOMAINS,
      });
    }

    // Validate type
    if (!['switch', 'sensor', 'binary_sensor'].includes(type)) {
      return reply.status(400).send({ error: 'Type must be switch, sensor, or binary_sensor' });
    }

    // Check if device already exists
    const existing = await db
      .select()
      .from(devices)
      .where(eq(devices.haEntityId, haEntityId))
      .get();

    if (existing) {
      return reply.status(409).send({ error: 'Device already exists' });
    }

    // Insert device
    const result = await db.insert(devices).values({
      haEntityId,
      name,
      type,
      batteryEntityId: batteryEntityId || null,
    }).returning();

    return result[0];
  });

  // Delete a device
  fastify.delete('/admin/devices/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const deviceId = parseInt(id, 10);

    if (isNaN(deviceId)) {
      return reply.status(400).send({ error: 'Invalid device ID' });
    }

    const device = await db
      .select()
      .from(devices)
      .where(eq(devices.id, deviceId))
      .get();

    if (!device) {
      return reply.status(404).send({ error: 'Device not found' });
    }

    await db.delete(devices).where(eq(devices.id, deviceId));

    return { success: true, message: 'Device deleted' };
  });

  // Validate entity ID against HA and domain whitelist
  fastify.get('/admin/validate-entity/:entityId', async (request, reply) => {
    const { entityId } = request.params as { entityId: string };

    if (!isDomainAllowed(entityId)) {
      return reply.status(400).send({
        error: 'Domain not allowed',
        domain: getDomain(entityId),
        allowedDomains: ALLOWED_DOMAINS,
      });
    }

    const state = await haService.getDeviceState(entityId);

    if (!state) {
      return reply.status(404).send({ error: 'Entity not found in Home Assistant' });
    }

    return {
      entityId: state.entity_id,
      state: state.state,
      name: state.attributes.friendly_name || state.entity_id,
      domain: getDomain(state.entity_id),
      valid: true,
    };
  });
}
