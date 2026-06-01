import { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { schedules, devices } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { scheduleExecutor } from '../services/scheduleExecutor.js';

interface CreateScheduleBody {
  deviceId: number;
  startTime: string;
  endTime: string;
  daysOfWeek?: number[];
}

interface UpdateScheduleBody {
  startTime?: string;
  endTime?: string;
  daysOfWeek?: number[];
  enabled?: boolean;
}

export async function scheduleRoutes(fastify: FastifyInstance) {
  // Get all schedules for current user
  fastify.get('/schedules', async (request: AuthenticatedRequest) => {
    const userId = request.user!.userId;
    
    const userSchedules = await db
      .select()
      .from(schedules)
      .where(eq(schedules.userId, userId))
      .all();
    
    return userSchedules;
  });

  // Get schedules for a specific device
  fastify.get('/devices/:id/schedules', async (request: AuthenticatedRequest, reply) => {
    const { id } = request.params as { id: string };
    const deviceId = parseInt(id, 10);
    const userId = request.user!.userId;
    
    // Verify device exists
    const device = await db
      .select()
      .from(devices)
      .where(eq(devices.id, deviceId))
      .get();
    
    if (!device) {
      return reply.status(404).send({ error: 'Device not found' });
    }
    
    const deviceSchedules = await db
      .select()
      .from(schedules)
      .where(and(
        eq(schedules.deviceId, deviceId),
        eq(schedules.userId, userId)
      ))
      .all();
    
    return deviceSchedules;
  });

  // Create a schedule
  fastify.post<{ Body: CreateScheduleBody }>('/schedules', async (request: AuthenticatedRequest, reply) => {
    const userId = request.user!.userId;
    const { deviceId, startTime, endTime, daysOfWeek } = request.body;
    
    // Validate device exists and is a switch
    const device = await db
      .select()
      .from(devices)
      .where(eq(devices.id, deviceId))
      .get();
    
    if (!device) {
      return reply.status(404).send({ error: 'Device not found' });
    }
    
    if (device.type !== 'switch') {
      return reply.status(400).send({ error: 'Schedules can only be created for switches' });
    }
    
    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return reply.status(400).send({ error: 'Times must be in HH:MM format' });
    }
    
    // Validate days of week
    const days = daysOfWeek || [1, 2, 3, 4, 5, 6, 7];
    if (!days.every(d => d >= 1 && d <= 7)) {
      return reply.status(400).send({ error: 'Days must be 1-7 (Mon-Sun)' });
    }
    
    const result = await db.insert(schedules).values({
      deviceId,
      userId,
      startTime,
      endTime,
      daysOfWeek: days.join(','),
    }).returning();
    
    return result[0];
  });

  // Update a schedule
  fastify.patch<{ Body: UpdateScheduleBody }>('/schedules/:id', async (request: AuthenticatedRequest, reply) => {
    const { id } = request.params as { id: string };
    const scheduleId = parseInt(id, 10);
    const userId = request.user!.userId;
    const updates = request.body;
    
    // Verify schedule exists and belongs to user
    const schedule = await db
      .select()
      .from(schedules)
      .where(and(
        eq(schedules.id, scheduleId),
        eq(schedules.userId, userId)
      ))
      .get();
    
    if (!schedule) {
      return reply.status(404).send({ error: 'Schedule not found' });
    }
    
    const updateData: Partial<typesof schedules.$inferInsert> = {};
    
    if (updates.startTime !== undefined) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(updates.startTime)) {
        return reply.status(400).send({ error: 'Start time must be in HH:MM format' });
      }
      updateData.startTime = updates.startTime;
    }
    
    if (updates.endTime !== undefined) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(updates.endTime)) {
        return reply.status(400).send({ error: 'End time must be in HH:MM format' });
      }
      updateData.endTime = updates.endTime;
    }
    
    if (updates.daysOfWeek !== undefined) {
      if (!updates.daysOfWeek.every(d => d >= 1 && d <= 7)) {
        return reply.status(400).send({ error: 'Days must be 1-7 (Mon-Sun)' });
      }
      updateData.daysOfWeek = updates.daysOfWeek.join(',');
    }
    
    if (updates.enabled !== undefined) {
      updateData.enabled = updates.enabled;
    }
    
    await db
      .update(schedules)
      .set(updateData)
      .where(eq(schedules.id, scheduleId));
    
    return { success: true };
  });

  // Delete a schedule
  fastify.delete('/schedules/:id', async (request: AuthenticatedRequest, reply) => {
    const { id } = request.params as { id: string };
    const scheduleId = parseInt(id, 10);
    const userId = request.user!.userId;
    
    // Verify schedule exists and belongs to user
    const schedule = await db
      .select()
      .from(schedules)
      .where(and(
        eq(schedules.id, scheduleId),
        eq(schedules.userId, userId)
      ))
      .get();
    
    if (!schedule) {
      return reply.status(404).send({ error: 'Schedule not found' });
    }
    
    await db.delete(schedules).where(eq(schedules.id, scheduleId));
    
    return { success: true };
  });

  // Get twilight data
  fastify.get('/twilight', async () => {
    return scheduleExecutor.getTwilightData() || { error: 'Twilight data not yet available' };
  });
}
