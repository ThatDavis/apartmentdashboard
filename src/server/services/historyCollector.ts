import { db } from '../db/index.js';
import { devices, deviceHistory } from '../db/schema.js';
import { haService } from './homeAssistant.js';
import { lt } from 'drizzle-orm';
import { sendPushToAll } from '../routes/push.js';

const RECORD_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const RETENTION_DAYS = 7;

type ThresholdState = 'normal' | 'above_max' | 'below_min';

class HistoryCollector {
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;
  private thresholdState = new Map<number, ThresholdState>();

  start() {
    if (this.isRunning) return;
    this.isRunning = true;

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

        const numericValue = parseFloat(haState.state);
        if (isNaN(numericValue)) continue;

        await db.insert(deviceHistory).values({
          deviceId: device.id,
          state: haState.state,
          recordedAt: now,
        });

        await this.checkThreshold(device, numericValue);
      }

      await this.cleanupOldRecords();
    } catch (error) {
      console.error('[HistoryCollector] Failed to record sensors:', error);
    }
  }

  private async checkThreshold(
    device: typeof devices.$inferSelect,
    value: number
  ) {
    if (!device.thresholdEnabled) return;

    const { thresholdMin, thresholdMax, name } = device;
    let current: ThresholdState = 'normal';

    if (thresholdMin !== null && value < thresholdMin) {
      current = 'below_min';
    } else if (thresholdMax !== null && value > thresholdMax) {
      current = 'above_max';
    }

    const previous = this.thresholdState.get(device.id) ?? 'normal';

    if (current !== 'normal' && current !== previous) {
      const unit = (device as unknown as { attributes?: { unit_of_measurement?: string } })?.attributes?.unit_of_measurement ?? '';
      const direction = current === 'below_min' ? 'below' : 'above';
      const limit = current === 'below_min' ? thresholdMin : thresholdMax;
      await sendPushToAll(
        `${name} Alert`,
        `${name} is ${direction} threshold: ${value}${unit} (limit: ${limit}${unit})`
      );
    }

    this.thresholdState.set(device.id, current);
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
