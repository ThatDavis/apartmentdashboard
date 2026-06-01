import { db } from '../db/index.js';
import { devices, deviceHistory } from '../db/schema.js';
import { haService } from './homeAssistant.js';
import { lt } from 'drizzle-orm';

const RECORD_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const RETENTION_DAYS = 7;

class HistoryCollector {
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;

  start() {
    if (this.isRunning) return;
    this.isRunning = true;

    // Record immediately, then on interval
    this.recordAllSensors();
    this.timer = setInterval(() => this.recordAllSensors(), RECORD_INTERVAL_MS);

    console.log(`[HistoryCollector] Started recording every ${RECORD_INTERVAL_MS / 60000} minutes`);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
  }

  private async recordAllSensors() {
    try {
      const allDevices = await db.select().from(devices).all();
      const sensorDevices = allDevices.filter(d => d.type === 'sensor' || d.type === 'binary_sensor');

      if (sensorDevices.length === 0) return;

      const haStates = await haService.getAllStates();
      const now = new Date();

      for (const device of sensorDevices) {
        const haState = haStates.find(s => s.entity_id === device.haEntityId);
        if (!haState || haState.state === 'unavailable' || haState.state === 'unknown') {
          continue;
        }

        // Only record numeric values (skip "on"/"off" for sensors)
        const numericValue = parseFloat(haState.state);
        if (isNaN(numericValue)) continue;

        await db.insert(deviceHistory).values({
          deviceId: device.id,
          state: haState.state,
          recordedAt: now,
        });
      }

      // Clean up old records
      await this.cleanupOldRecords();
    } catch (error) {
      console.error('[HistoryCollector] Failed to record sensors:', error);
    }
  }

  private async cleanupOldRecords() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);

    await db
      .delete(deviceHistory)
      .where(lt(deviceHistory.recordedAt, cutoff));
  }
}

export const historyCollector = new HistoryCollector();
