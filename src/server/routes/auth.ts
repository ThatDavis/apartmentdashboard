import { FastifyInstance } from 'fastify';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users, loginAttempts } from '../db/schema.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const MAX_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10);
const LOCKOUT_MINUTES = parseInt(process.env.LOCKOUT_DURATION_MINUTES || '30', 10);

interface LoginBody {
  username: string;
  pin: string;
}

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: LoginBody }>('/login', async (request, reply) => {
    const { username, pin } = request.body;
    const ip = request.ip;

    // Check for recent failed attempts
    const recentAttempts = await db
      .select()
      .from(loginAttempts)
      .where(eq(loginAttempts.username, username))
      .all();

    const failedAttempts = recentAttempts.filter(
      (a) => !a.success && a.createdAt && Date.now() - a.createdAt.getTime() < LOCKOUT_MINUTES * 60 * 1000
    );

    if (failedAttempts.length >= MAX_ATTEMPTS) {
      return reply.status(429).send({
        error: 'Too many failed attempts. Please try again later.',
        lockedUntil: new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000),
      });
    }

    const user = await db.select().from(users).where(eq(users.username, username)).get();

    if (!user) {
      await db.insert(loginAttempts).values({ username, ipAddress: ip, success: false });
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const validPin = await bcrypt.compare(pin, user.pinHash);

    if (!validPin) {
      await db.insert(loginAttempts).values({ username, ipAddress: ip, success: false });
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    await db.insert(loginAttempts).values({ username, ipAddress: ip, success: true });

    const token = jwt.sign(
      { userId: user.id, username: user.username, isAdmin: user.isAdmin },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return { token };
  });

  fastify.post('/logout', async () => {
    // Client-side token removal is sufficient for JWT
    return { success: true };
  });

  fastify.get('/me', async (request, reply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const token = authHeader.slice(7);
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; username: string; isAdmin: boolean };

      return { userId: decoded.userId, username: decoded.username, isAdmin: decoded.isAdmin };
    } catch {
      return reply.status(401).send({ error: 'Invalid token' });
    }
  });
}
