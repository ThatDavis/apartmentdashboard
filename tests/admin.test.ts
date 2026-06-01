import { describe, it, expect, beforeEach } from 'vitest';
import fastify from 'fastify';
import { adminRoutes } from '../src/server/routes/admin.js';
import { authRoutes } from '../src/server/routes/auth.js';
import { authMiddleware } from '../src/server/middleware/auth.js';
import { db } from '../src/server/db/index.js';
import { users, devices, loginAttempts } from '../src/server/db/schema.js';
import bcrypt from 'bcryptjs';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

// Use in-memory database for tests
process.env.DATABASE_URL = ':memory:';

// Mock environment variables
process.env.JWT_SECRET = 'test-secret';
process.env.ALLOWED_DOMAINS = 'switch,light,sensor';

describe('Admin Routes', () => {
  let app: ReturnType<typeof fastify>;
  let adminToken: string;
  let userToken: string;

  beforeEach(async () => {
    // Run migrations on the database
    migrate(db, { migrationsFolder: './drizzle' });

    app = fastify();
    
    // Register auth hook
    app.addHook('preHandler', async (request, reply) => {
      const url = request.raw.url || '';
      const path = url.split('?')[0];
      const publicRoutes = ['/api/login', '/api/logout', '/api/health'];
      if (publicRoutes.includes(path)) return;
      await authMiddleware(request as any, reply);
    });
    
    await app.register(authRoutes, { prefix: '/api' });
    await app.register(adminRoutes, { prefix: '/api' });

    // Clean up database
    await db.delete(devices);
    await db.delete(loginAttempts);
    await db.delete(users);

    // Create admin user
    const adminPinHash = await bcrypt.hash('1234', 10);
    await db.insert(users).values({ username: 'admin', pinHash: adminPinHash, isAdmin: true });

    // Create regular user
    const userPinHash = await bcrypt.hash('1234', 10);
    await db.insert(users).values({ username: 'user', pinHash: userPinHash, isAdmin: false });

    // Get tokens
    const adminLogin = await app.inject({
      method: 'POST',
      url: '/api/login',
      payload: { username: 'admin', pin: '1234' },
    });
    adminToken = JSON.parse(adminLogin.body).token;

    const userLogin = await app.inject({
      method: 'POST',
      url: '/api/login',
      payload: { username: 'user', pin: '1234' },
    });
    userToken = JSON.parse(userLogin.body).token;
  });

  describe('GET /api/admin/devices', () => {
    it('should allow admin to list devices', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/devices',
        headers: { authorization: `Bearer ${adminToken}` },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(Array.isArray(body)).toBe(true);
    });

    it('should reject non-admin users', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/devices',
        headers: { authorization: `Bearer ${userToken}` },
      });

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Admin access required');
    });

    it('should reject unauthenticated requests', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/devices',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /api/admin/devices', () => {
    it('should allow admin to add allowed domain device', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/admin/devices',
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          haEntityId: 'switch.living_room',
          name: 'Living Room Light',
          type: 'switch',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.haEntityId).toBe('switch.living_room');
    });

    it('should reject disallowed domains', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/admin/devices',
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          haEntityId: 'lock.front_door',
          name: 'Front Door',
          type: 'switch',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Domain not allowed');
    });

    it('should reject invalid types', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/admin/devices',
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          haEntityId: 'switch.test',
          name: 'Test',
          type: 'invalid_type',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject duplicate devices', async () => {
      // Add first
      await app.inject({
        method: 'POST',
        url: '/api/admin/devices',
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          haEntityId: 'switch.test',
          name: 'Test',
          type: 'switch',
        },
      });

      // Try to add again
      const response = await app.inject({
        method: 'POST',
        url: '/api/admin/devices',
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          haEntityId: 'switch.test',
          name: 'Test 2',
          type: 'switch',
        },
      });

      expect(response.statusCode).toBe(409);
    });

    it('should reject non-admin users', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/admin/devices',
        headers: { authorization: `Bearer ${userToken}` },
        payload: {
          haEntityId: 'switch.test',
          name: 'Test',
          type: 'switch',
        },
      });

      expect(response.statusCode).toBe(403);
    });
  });

  describe('DELETE /api/admin/devices/:id', () => {
    it('should allow admin to delete device', async () => {
      // Add a device first
      const addResponse = await app.inject({
        method: 'POST',
        url: '/api/admin/devices',
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          haEntityId: 'switch.test',
          name: 'Test',
          type: 'switch',
        },
      });
      const device = JSON.parse(addResponse.body);

      // Delete it
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/admin/devices/${device.id}`,
        headers: { authorization: `Bearer ${adminToken}` },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
    });

    it('should return 404 for non-existent device', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/admin/devices/99999',
        headers: { authorization: `Bearer ${adminToken}` },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should reject non-admin users', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/admin/devices/1',
        headers: { authorization: `Bearer ${userToken}` },
      });

      expect(response.statusCode).toBe(403);
    });
  });

  describe('PATCH /api/admin/devices/:id', () => {
    async function createDevice(overrides = {}) {
      const res = await app.inject({
        method: 'POST',
        url: '/api/admin/devices',
        headers: { authorization: `Bearer ${adminToken}` },
        payload: { haEntityId: 'switch.test', name: 'Test', type: 'switch', ...overrides },
      });
      return JSON.parse(res.body);
    }

    it('should allow admin to update device fields', async () => {
      const device = await createDevice();

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/admin/devices/${device.id}`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: { name: 'Renamed', type: 'sensor', batteryEntityId: 'sensor.test_battery' },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.name).toBe('Renamed');
      expect(body.type).toBe('sensor');
      expect(body.batteryEntityId).toBe('sensor.test_battery');
      expect(body.haEntityId).toBe('switch.test');
    });

    it('should clear battery entity when passed empty', async () => {
      const device = await createDevice({ batteryEntityId: 'sensor.test_battery' });

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/admin/devices/${device.id}`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: { batteryEntityId: '' },
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body).batteryEntityId).toBeNull();
    });

    it('should reject an invalid type', async () => {
      const device = await createDevice();

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/admin/devices/${device.id}`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: { type: 'bogus' },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject a disallowed domain', async () => {
      const device = await createDevice();

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/admin/devices/${device.id}`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: { haEntityId: 'camera.front_door' },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject changing entity ID to one that already exists', async () => {
      const first = await createDevice({ haEntityId: 'switch.one', name: 'One' });
      await createDevice({ haEntityId: 'switch.two', name: 'Two' });

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/admin/devices/${first.id}`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: { haEntityId: 'switch.two' },
      });

      expect(response.statusCode).toBe(409);
    });

    it('should return 404 for non-existent device', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/admin/devices/99999',
        headers: { authorization: `Bearer ${adminToken}` },
        payload: { name: 'Nope' },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should reject non-admin users', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/admin/devices/1',
        headers: { authorization: `Bearer ${userToken}` },
        payload: { name: 'Nope' },
      });

      expect(response.statusCode).toBe(403);
    });
  });

  describe('GET /api/admin/users', () => {
    it('should allow admin to list users', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/users',
        headers: { authorization: `Bearer ${adminToken}` },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBe(2);
      expect(body[0]).toHaveProperty('username');
      expect(body[0]).not.toHaveProperty('pinHash');
    });

    it('should reject non-admin users', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/admin/users',
        headers: { authorization: `Bearer ${userToken}` },
      });

      expect(response.statusCode).toBe(403);
    });
  });

  describe('DELETE /api/admin/users/:id', () => {
    it('should allow admin to delete a user', async () => {
      // Get user ID first
      const usersResponse = await app.inject({
        method: 'GET',
        url: '/api/admin/users',
        headers: { authorization: `Bearer ${adminToken}` },
      });
      const userList = JSON.parse(usersResponse.body);
      const userToDelete = userList.find((u: { username: string }) => u.username === 'user');

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/admin/users/${userToDelete.id}`,
        headers: { authorization: `Bearer ${adminToken}` },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
    });

    it('should prevent self-deletion', async () => {
      // Get admin ID
      const usersResponse = await app.inject({
        method: 'GET',
        url: '/api/admin/users',
        headers: { authorization: `Bearer ${adminToken}` },
      });
      const userList = JSON.parse(usersResponse.body);
      const adminUser = userList.find((u: { username: string }) => u.username === 'admin');

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/admin/users/${adminUser.id}`,
        headers: { authorization: `Bearer ${adminToken}` },
      });

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('You cannot delete your own account');
    });

    it('should reject non-admin users', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/admin/users/1',
        headers: { authorization: `Bearer ${userToken}` },
      });

      expect(response.statusCode).toBe(403);
    });
  });

  describe('PATCH /api/admin/users/:id/pin', () => {
    it('should allow admin to change a user PIN', async () => {
      // Get user ID first
      const usersResponse = await app.inject({
        method: 'GET',
        url: '/api/admin/users',
        headers: { authorization: `Bearer ${adminToken}` },
      });
      const userList = JSON.parse(usersResponse.body);
      const userToUpdate = userList.find((u: { username: string }) => u.username === 'user');

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/admin/users/${userToUpdate.id}/pin`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: { pin: '5678' },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);

      // Verify new PIN works
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/login',
        payload: { username: 'user', pin: '5678' },
      });
      expect(loginResponse.statusCode).toBe(200);
    });

    it('should reject invalid PIN length', async () => {
      const usersResponse = await app.inject({
        method: 'GET',
        url: '/api/admin/users',
        headers: { authorization: `Bearer ${adminToken}` },
      });
      const userList = JSON.parse(usersResponse.body);
      const userToUpdate = userList.find((u: { username: string }) => u.username === 'user');

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/admin/users/${userToUpdate.id}/pin`,
        headers: { authorization: `Bearer ${adminToken}` },
        payload: { pin: '12' },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject non-admin users', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/admin/users/1/pin',
        headers: { authorization: `Bearer ${userToken}` },
        payload: { pin: '5678' },
      });

      expect(response.statusCode).toBe(403);
    });
  });
});
