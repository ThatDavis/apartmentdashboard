import { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { devices, users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { haService } from '../services/homeAssistant.js';
import { AuthenticatedRequest, requireAdmin } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

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

  // Update an existing device
  fastify.patch<{ Body: Partial<AddDeviceBody> }>('/admin/devices/:id', async (request, reply) => {
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

    const { haEntityId, name, type, batteryEntityId } = request.body;

    // Validate domain if entity ID is being changed
    if (haEntityId !== undefined && !isDomainAllowed(haEntityId)) {
      return reply.status(400).send({
        error: 'Domain not allowed',
        domain: getDomain(haEntityId),
        allowedDomains: ALLOWED_DOMAINS,
      });
    }

    // Validate type if being changed
    if (type !== undefined && !['switch', 'sensor', 'binary_sensor'].includes(type)) {
      return reply.status(400).send({ error: 'Type must be switch, sensor, or binary_sensor' });
    }

    // If entity ID is changing, ensure it doesn't collide with another device
    if (haEntityId !== undefined && haEntityId !== device.haEntityId) {
      const existing = await db
        .select()
        .from(devices)
        .where(eq(devices.haEntityId, haEntityId))
        .get();

      if (existing) {
        return reply.status(409).send({ error: 'Device already exists' });
      }
    }

    const result = await db
      .update(devices)
      .set({
        ...(haEntityId !== undefined && { haEntityId }),
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(batteryEntityId !== undefined && { batteryEntityId: batteryEntityId || null }),
      })
      .where(eq(devices.id, deviceId))
      .returning();

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

  // --- User Management ---

  // List all users (without PIN hashes)
  fastify.get('/admin/users', async () => {
    const allUsers = await db.select().from(users).all();
    return allUsers.map(u => ({
      id: u.id,
      username: u.username,
      isAdmin: u.isAdmin,
      createdAt: u.createdAt,
    }));
  });

  // Delete a user
  fastify.delete('/admin/users/:id', async (request: AuthenticatedRequest, reply) => {
    const { id } = request.params as { id: string };
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      return reply.status(400).send({ error: 'Invalid user ID' });
    }

    // Prevent self-deletion
    if (request.user?.userId === userId) {
      return reply.status(403).send({ error: 'You cannot delete your own account' });
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .get();

    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    await db.delete(users).where(eq(users.id, userId));

    return { success: true, message: 'User deleted' };
  });

  // Create a new user
  interface CreateUserBody {
    username: string;
    pin: string;
    isAdmin?: boolean;
  }

  fastify.post('/admin/users', async (request: AuthenticatedRequest, reply) => {
    const { username, pin, isAdmin } = request.body as CreateUserBody;

    if (!username || username.length < 2) {
      return reply.status(400).send({ error: 'Username must be at least 2 characters' });
    }

    if (!pin || pin.length < 4 || pin.length > 6) {
      return reply.status(400).send({ error: 'PIN must be 4-6 digits' });
    }

    // Check if username already exists
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .get();

    if (existing) {
      return reply.status(409).send({ error: 'Username already exists' });
    }

    const pinHash = await bcrypt.hash(pin, 10);

    const result = await db.insert(users).values({
      username,
      pinHash,
      isAdmin: isAdmin || false,
    }).returning();

    return {
      id: result[0].id,
      username: result[0].username,
      isAdmin: result[0].isAdmin,
      createdAt: result[0].createdAt,
    };
  });

  // Update user PIN
  interface UpdatePinBody {
    pin: string;
  }

  fastify.patch('/admin/users/:id/pin', async (request: AuthenticatedRequest, reply) => {
    const { id } = request.params as { id: string };
    const userId = parseInt(id, 10);
    const { pin } = request.body as UpdatePinBody;

    if (isNaN(userId)) {
      return reply.status(400).send({ error: 'Invalid user ID' });
    }

    if (!pin || pin.length < 4 || pin.length > 6) {
      return reply.status(400).send({ error: 'PIN must be 4-6 digits' });
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .get();

    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    const pinHash = await bcrypt.hash(pin, 10);

    await db
      .update(users)
      .set({ pinHash, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return { success: true, message: 'PIN updated' };
  });
}
