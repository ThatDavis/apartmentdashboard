import { describe, it, expect, beforeEach } from 'vitest';
import fastify from 'fastify';
import { scheduleRoutes } from '../src/server/routes/schedules.js';
import { authRoutes } from '../src/server/routes/auth.js';
import { deviceRoutes } from '../src/server/routes/devices.js';
import { authMiddleware } from '../src/server/middleware/auth.js';
import { db } from '../src/server/db/index.js';
import { eq } from 'drizzle-orm';
import { users, devices, schedules } from '../src/server/db/schema.js';
import bcrypt from 'bcryptjs';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

process.env.DATABASE_URL = ':memory:';
process.env.JWT_SECRET = 'test-secret';
process.env.ALLOWED_DOMAINS = 'switch,light,sensor';

describe('Schedule Routes', () => {
  let app: ReturnType<typeof fastify>;
  let userToken: string;
  let userId: number;
  let deviceId: number;

  beforeEach(async () => {
    migrate(db, { migrationsFolder: './drizzle' });

    app = fastify();
    
    app.addHook('preHandler', async (request, reply) => {
      const url = request.raw.url || '';
      const path = url.split('?')[0];
      const publicRoutes = ['/api/login', '/api/logout', '/api/health'];
      if (publicRoutes.includes(path)) return;
      await authMiddleware(request as any, reply);
    });
    
    await app.register(authRoutes, { prefix: '/api' });
    await app.register(deviceRoutes, { prefix: '/api' });
    await app.register(scheduleRoutes, { prefix: '/api' });

    await db.delete(schedules);
    await db.delete(devices);
    await db.delete(users);

    const pinHash = await bcrypt.hash('1234', 10);
    const userResult = await db.insert(users).values({ username: 'user', pinHash, isAdmin: false }).returning();
    userId = userResult[0].id;

    const login = await app.inject({
      method: 'POST',
      url: '/api/login',
      payload: { username: 'user', pin: '1234' },
    });
    userToken = JSON.parse(login.body).token;

    // Insert a test device directly
    const result = await db.insert(devices).values({
      haEntityId: 'switch.test',
      name: 'Test Switch',
      type: 'switch',
    }).returning();
    deviceId = result[0].id;
  });

  describe('POST /api/schedules', () => {
    it('should create a schedule for a switch', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/schedules',
        headers: { authorization: `Bearer ${userToken}` },
        payload: {
          deviceId,
          startTime: '07:00',
          endTime: '22:00',
          daysOfWeek: [1, 2, 3, 4, 5],
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.startTime).toBe('07:00');
      expect(body.endTime).toBe('22:00');
      expect(body.daysOfWeek).toBe('1,2,3,4,5');
    });

    it('should reject schedules for non-switches', async () => {
      const sensorResult = await db.insert(devices).values({
        haEntityId: 'sensor.test',
        name: 'Test Sensor',
        type: 'sensor',
      }).returning();

      const response = await app.inject({
        method: 'POST',
        url: '/api/schedules',
        headers: { authorization: `Bearer ${userToken}` },
        payload: {
          deviceId: sensorResult[0].id,
          startTime: '07:00',
          endTime: '22:00',
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject invalid time format', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/schedules',
        headers: { authorization: `Bearer ${userToken}` },
        payload: {
          deviceId,
          startTime: '7:00',
          endTime: '25:00',
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/devices/:id/schedules', () => {
    it('should list schedules for a device', async () => {
      await db.insert(schedules).values({
        deviceId,
        userId,
        startTime: '07:00',
        endTime: '22:00',
        daysOfWeek: '1,2,3,4,5',
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/devices/${deviceId}/schedules`,
        headers: { authorization: `Bearer ${userToken}` },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.length).toBe(1);
      expect(body[0].startTime).toBe('07:00');
    });
  });

  describe('PATCH /api/schedules/:id', () => {
    it('should update a schedule', async () => {
      const result = await db.insert(schedules).values({
        deviceId,
        userId,
        startTime: '07:00',
        endTime: '22:00',
        daysOfWeek: '1,2,3,4,5',
      }).returning();

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/schedules/${result[0].id}`,
        headers: { authorization: `Bearer ${userToken}` },
        payload: { startTime: '08:00' },
      });

      expect(response.statusCode).toBe(200);
      
      const updated = await db.select().from(schedules).where(eq(schedules.id, result[0].id)).get();
      expect(updated?.startTime).toBe('08:00');
    });

    it('should reject updates to other users schedules', async () => {
      const otherPinHash = await bcrypt.hash('5678', 10);
      await db.insert(users).values({ username: 'other', pinHash: otherPinHash, isAdmin: false });
      
      const otherLogin = await app.inject({
        method: 'POST',
        url: '/api/login',
        payload: { username: 'other', pin: '5678' },
      });
      const otherToken = JSON.parse(otherLogin.body).token;

      const result = await db.insert(schedules).values({
        deviceId,
        userId,
        startTime: '07:00',
        endTime: '22:00',
        daysOfWeek: '1,2,3,4,5',
      }).returning();

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/schedules/${result[0].id}`,
        headers: { authorization: `Bearer ${otherToken}` },
        payload: { startTime: '08:00' },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/schedules/:id', () => {
    it('should delete a schedule', async () => {
      const result = await db.insert(schedules).values({
        deviceId,
        userId,
        startTime: '07:00',
        endTime: '22:00',
        daysOfWeek: '1,2,3,4,5',
      }).returning();

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/schedules/${result[0].id}`,
        headers: { authorization: `Bearer ${userToken}` },
      });

      expect(response.statusCode).toBe(200);
      
      const deleted = await db.select().from(schedules).where(eq(schedules.id, result[0].id)).get();
      expect(deleted).toBeUndefined();
    });
  });

  describe('GET /api/twilight', () => {
    it('should return twilight data or error', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/twilight',
        headers: { authorization: `Bearer ${userToken}` },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      // Either has twilight data or error message
      expect(body.error || body.dawn).toBeDefined();
    });
  });
});
