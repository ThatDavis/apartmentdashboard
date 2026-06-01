import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  pinHash: text('pin_hash').notNull(),
  isAdmin: integer('is_admin', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const loginAttempts = sqliteTable('login_attempts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull(),
  ipAddress: text('ip_address'),
  success: integer('success', { mode: 'boolean' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const devices = sqliteTable('devices', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  haEntityId: text('ha_entity_id').notNull().unique(),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'sensor', 'switch', 'binary_sensor'
  room: text('room'),
  batteryEntityId: text('battery_entity_id'),
  displayOrder: integer('display_order').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const deviceHistory = sqliteTable('device_history', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  deviceId: integer('device_id').notNull(),
  state: text('state').notNull(),
  recordedAt: integer('recorded_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const schedules = sqliteTable('schedules', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  deviceId: integer('device_id').notNull(),
  userId: integer('user_id').notNull(),
  startTime: text('start_time').notNull(), // HH:MM format (24h)
  endTime: text('end_time').notNull(), // HH:MM format (24h)
  daysOfWeek: text('days_of_week').notNull().default('1,2,3,4,5,6,7'), // Comma-separated: 1=Mon, 7=Sun
  enabled: integer('enabled', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const twilightCache = sqliteTable('twilight_cache', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull().unique(), // YYYY-MM-DD
  dawn: text('dawn').notNull(), // HH:MM
  dusk: text('dusk').notNull(), // HH:MM
  sunrise: text('sunrise').notNull(), // HH:MM
  sunset: text('sunset').notNull(), // HH:MM
  fetchedAt: integer('fetched_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});
