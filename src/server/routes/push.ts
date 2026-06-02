import { FastifyInstance } from 'fastify';
import webpush from 'web-push';
import { db } from '../db/index.js';
import { pushSubscriptions } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import type { AuthenticatedRequest } from '../middleware/auth.js';

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL || 'admin@localhost'}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function pushRoutes(fastify: FastifyInstance) {
  fastify.get('/push/vapid-public-key', async () => {
    return { publicKey: process.env.VAPID_PUBLIC_KEY || null };
  });

  fastify.post('/push/subscribe', async (request: AuthenticatedRequest, reply) => {
    const { endpoint, keys } = request.body as {
      endpoint: string;
      keys: { p256dh: string; auth: string };
    };

    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
    await db.insert(pushSubscriptions).values({
      userId: request.user!.userId,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    });

    return reply.status(201).send({ success: true });
  });

  fastify.delete('/push/unsubscribe', async (request: AuthenticatedRequest) => {
    const { endpoint } = request.body as { endpoint: string };
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
    return { success: true };
  });
}

export async function sendPushToAll(title: string, body: string) {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return;

  const subs = await db.select().from(pushSubscriptions).all();
  const payload = JSON.stringify({ title, body });

  await Promise.allSettled(
    subs.map(sub =>
      webpush
        .sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload)
        .catch(async err => {
          if (err.statusCode === 410) {
            await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
          }
        })
    )
  );
}
