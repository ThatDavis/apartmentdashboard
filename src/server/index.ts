import 'dotenv/config';
import fastify from 'fastify';
import cors from '@fastify/cors';
import staticPlugin from '@fastify/static';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { authRoutes } from './routes/auth.js';
import { healthRoutes } from './routes/health.js';
import { deviceRoutes } from './routes/devices.js';
import { adminRoutes } from './routes/admin.js';
import { homeAssistantPlugin } from './services/homeAssistant.js';
import { authMiddleware, AuthenticatedRequest } from './middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';

const app = fastify({
  logger: {
    level: NODE_ENV === 'production' ? 'info' : 'debug',
  },
});

// Register plugins
await app.register(cors, {
  origin: NODE_ENV === 'development' ? true : false,
  credentials: true,
});

// Serve static files in production
if (NODE_ENV === 'production') {
  await app.register(staticPlugin, {
    root: join(__dirname, '../client'),
    prefix: '/',
  });
}

// Register Home Assistant service
await app.register(homeAssistantPlugin);

// Register auth middleware globally (protects routes except public ones)
app.addHook('preHandler', async (request: AuthenticatedRequest, reply) => {
  const url = request.raw.url || '';
  const path = url.split('?')[0];
  
  // Skip auth for public API routes and static files
  const publicRoutes = ['/api/login', '/api/logout', '/api/health'];
  const isStaticFile = path === '/' || path.startsWith('/assets/') || path.endsWith('.html') || path.endsWith('.js') || path.endsWith('.css');
  if (publicRoutes.includes(path) || isStaticFile) {
    return;
  }

  await authMiddleware(request, reply);
});

// Register routes
await app.register(authRoutes, { prefix: '/api' });
await app.register(healthRoutes, { prefix: '/api' });
await app.register(deviceRoutes, { prefix: '/api' });
await app.register(adminRoutes, { prefix: '/api' });

// SPA fallback for client-side routing
app.get('/', async (_request, reply) => {
  if (NODE_ENV === 'production') {
    return reply.sendFile('index.html');
  }
  return { message: 'API Server Running - Development Mode' };
});

// Error handler
app.setErrorHandler((error: Error & { statusCode?: number }, _request, reply) => {
  app.log.error(error);
  reply.status(error.statusCode || 500).send({
    error: NODE_ENV === 'production' ? 'Internal Server Error' : error.message,
  });
});

// Start server
try {
  await app.listen({ port: PORT, host: '0.0.0.0' });
  app.log.info(`Server running on http://localhost:${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
