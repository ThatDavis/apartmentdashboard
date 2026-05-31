import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    userId: number;
    username: string;
  };
}

export async function authMiddleware(
  request: AuthenticatedRequest,
  reply: FastifyReply
) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; username: string };

    request.user = decoded;
  } catch {
    return reply.status(401).send({ error: 'Invalid token' });
  }
}

export async function registerAuthMiddleware(fastify: FastifyInstance) {
  fastify.addHook('onRequest', async (request: AuthenticatedRequest, reply: FastifyReply) => {
    // Skip auth for public routes - use raw URL to avoid type issues
    const url = request.raw.url || '';
    const path = url.split('?')[0];
    
    const publicRoutes = ['/api/login', '/api/logout', '/api/health'];
    if (publicRoutes.includes(path)) {
      return;
    }

    await authMiddleware(request, reply);
  });
}
