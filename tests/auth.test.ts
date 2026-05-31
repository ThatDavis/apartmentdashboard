import { describe, it, expect, vi, beforeEach } from 'vitest';
import fastify from 'fastify';
import { authRoutes } from '../src/server/routes/auth.js';
import { healthRoutes } from '../src/server/routes/health.js';
import { registerAuthMiddleware } from '../src/server/middleware/auth.js';
import { db } from '../src/server/db/index.js';
import { users, loginAttempts } from '../src/server/db/schema.js';
import bcrypt from 'bcryptjs';

// Mock environment variables
process.env.JWT_SECRET = 'test-secret';
process.env.MAX_LOGIN_ATTEMPTS = '5';
process.env.LOCKOUT_DURATION_MINUTES = '30';

describe('Authentication', () => {
  let app: ReturnType<typeof fastify>;

  beforeEach(async () => {
    app = fastify();
    await app.register(registerAuthMiddleware);
    await app.register(authRoutes, { prefix: '/api' });
    await app.register(healthRoutes, { prefix: '/api' });

    // Clean up database
    await db.delete(loginAttempts);
    await db.delete(users);
  });

  describe('POST /api/login', () => {
    it('should login with valid credentials', async () => {
      // Create a test user
      const pinHash = await bcrypt.hash('1234', 10);
      await db.insert(users).values({ username: 'testuser', pinHash });

      const response = await app.inject({
        method: 'POST',
        url: '/api/login',
        payload: { username: 'testuser', pin: '1234' },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.token).toBeDefined();
    });

    it('should reject invalid username', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/login',
        payload: { username: 'nonexistent', pin: '1234' },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Invalid credentials');
    });

    it('should reject invalid PIN', async () => {
      // Create a test user
      const pinHash = await bcrypt.hash('1234', 10);
      await db.insert(users).values({ username: 'testuser', pinHash });

      const response = await app.inject({
        method: 'POST',
        url: '/api/login',
        payload: { username: 'testuser', pin: 'wrong' },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Invalid credentials');
    });

    it('should lock account after 5 failed attempts', async () => {
      // Create a test user
      const pinHash = await bcrypt.hash('1234', 10);
      await db.insert(users).values({ username: 'testuser', pinHash });

      // Make 5 failed attempts
      for (let i = 0; i < 5; i++) {
        await app.inject({
          method: 'POST',
          url: '/api/login',
          payload: { username: 'testuser', pin: 'wrong' },
        });
      }

      // 6th attempt should be locked
      const response = await app.inject({
        method: 'POST',
        url: '/api/login',
        payload: { username: 'testuser', pin: '1234' },
      });

      expect(response.statusCode).toBe(429);
      const body = JSON.parse(response.body);
      expect(body.error).toContain('Too many failed attempts');
    });

    it('should log failed attempts', async () => {
      await app.inject({
        method: 'POST',
        url: '/api/login',
        payload: { username: 'nonexistent', pin: '1234' },
      });

      const attempts = await db.select().from(loginAttempts).all();
      expect(attempts).toHaveLength(1);
      expect(attempts[0].username).toBe('nonexistent');
      expect(attempts[0].success).toBe(false);
    });
  });

  describe('GET /api/me', () => {
    it('should return user info with valid token', async () => {
      // Create a test user and login
      const pinHash = await bcrypt.hash('1234', 10);
      await db.insert(users).values({ username: 'testuser', pinHash });

      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/login',
        payload: { username: 'testuser', pin: '1234' },
      });

      const { token } = JSON.parse(loginResponse.body);

      const response = await app.inject({
        method: 'GET',
        url: '/api/me',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.username).toBe('testuser');
    });

    it('should reject request without token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/me',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should reject invalid token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/me',
        headers: { authorization: 'Bearer invalid-token' },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('Auth Middleware', () => {
    it('should allow access to public routes without auth', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/health',
      });

      expect(response.statusCode).toBe(200);
    });
  });
});
