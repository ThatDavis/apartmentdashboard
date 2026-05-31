import { describe, it, expect, beforeEach } from 'vitest';
import fastify from 'fastify';
import { adminRoutes } from '../src/server/routes/admin.js';
import { authRoutes } from '../src/server/routes/auth.js';
import { authMiddleware } from '../src/server/middleware/auth.js';
import { db } from '../src/server/db/index.js';
import { users, devices } from '../src/server/db/schema.js';
import bcrypt from 'bcryptjs';

// Mock environment variables
process.env.JWT_SECRET = 'test-secret';
process.env.ALLOWED_DOMAINS = 'switch,light,sensor';

describe('Admin Routes', () => {
  let app: ReturnType<typeof fastify>;
  let adminToken: string;
  let userToken: string;

  beforeEach(async () => {
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
});
