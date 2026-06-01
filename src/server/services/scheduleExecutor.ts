import { db } from '../db/index.js';
import { schedules, devices, twilightCache } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { haService } from './homeAssistant.js';
import { twilightService, TwilightData } from './twilightService.js';

const CHECK_INTERVAL_MS = 60 * 1000; // 1 minute
const TIMEZONE = 'America/Chicago';

class ScheduleExecutor {
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;
  private lastCheckedMinute: string = '';
  private twilightData: TwilightData | null = null;

  start() {
    if (this.isRunning) return;
    this.isRunning = true;

    // Initial check + setup
    this.checkSchedules();
    this.refreshTwilightData();
    
    // Schedule checks every minute
    this.timer = setInterval(() => this.checkSchedules(), CHECK_INTERVAL_MS);
    
    // Schedule twilight refresh at midnight
    this.scheduleMidnightRefresh();

    console.log('[ScheduleExecutor] Started checking schedules every 60 seconds');
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
  }

  private async refreshTwilightData() {
    try {
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      
      // Check if we already have today's data
      const cached = await db
        .select()
        .from(twilightCache)
        .where(eq(twilightCache.date, dateStr))
        .get();
      
      if (cached) {
        this.twilightData = {
          date: cached.date,
          dawn: cached.dawn,
          dusk: cached.dusk,
          sunrise: cached.sunrise,
          sunset: cached.sunset,
        };
        console.log('[ScheduleExecutor] Using cached twilight data for', dateStr);
        return;
      }
      
      // Fetch new data
      const data = await twilightService.fetchTwilightData(today);
      
      await db.insert(twilightCache).values({
        date: data.date,
        dawn: data.dawn,
        dusk: data.dusk,
        sunrise: data.sunrise,
        sunset: data.sunset,
      });
      
      this.twilightData = data;
      console.log('[ScheduleExecutor] Fetched twilight data for', dateStr);
    } catch (error) {
      console.error('[ScheduleExecutor] Failed to refresh twilight data:', error);
    }
  }

  private scheduleMidnightRefresh() {
    const now = new Date();
    const midnight = twilightService.getNextMidnightCT();
    const msUntilMidnight = midnight.getTime() - now.getTime();
    
    setTimeout(() => {
      this.refreshTwilightData();
      this.scheduleMidnightRefresh(); // Schedule next midnight
    }, msUntilMidnight);
    
    console.log(`[ScheduleExecutor] Scheduled twilight refresh in ${Math.round(msUntilMidnight / 1000 / 60)} minutes`);
  }

  private async checkSchedules() {
    try {
      const now = new Date();
      const currentTime = now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        timeZone: TIMEZONE,
      });
      
      // Only check once per minute
      if (this.lastCheckedMinute === currentTime) return;
      this.lastCheckedMinute = currentTime;
      
      const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const dayOfWeek = currentDay === 0 ? 7 : currentDay; // Convert to 1-7 (Mon-Sun)
      
      // Get all enabled schedules
      const activeSchedules = await db
        .select()
        .from(schedules)
        .where(eq(schedules.enabled, true))
        .all();
      
      for (const schedule of activeSchedules) {
        // Check if schedule applies to today
        const days = schedule.daysOfWeek.split(',').map(Number);
        if (!days.includes(dayOfWeek)) continue;
        
        // Get device info
        const device = await db
          .select()
          .from(devices)
          .where(eq(devices.id, schedule.deviceId))
          .get();
        
        if (!device || device.type !== 'switch') continue;
        
        // Check if we should toggle
        if (currentTime === schedule.startTime) {
          console.log(`[ScheduleExecutor] Turning ON ${device.name} at ${currentTime}`);
          await haService.toggleSwitch(device.haEntityId);
        } else if (currentTime === schedule.endTime) {
          console.log(`[ScheduleExecutor] Turning OFF ${device.name} at ${currentTime}`);
          await haService.toggleSwitch(device.haEntityId);
        }
      }
    } catch (error) {
      console.error('[ScheduleExecutor] Error checking schedules:', error);
    }
  }

  async handleServerRestart() {
    console.log('[ScheduleExecutor] Server restart detected - turning off all scheduled switches');
    
    try {
      const activeSchedules = await db
        .select()
        .from(schedules)
        .where(eq(schedules.enabled, true))
        .all();
      
      for (const schedule of activeSchedules) {
        const device = await db
          .select()
          .from(devices)
          .where(eq(devices.id, schedule.deviceId))
          .get();
        
        if (!device || device.type !== 'switch') continue;
        
        // Turn off the switch
        const haState = await haService.getDeviceState(device.haEntityId);
        if (haState && haState.state === 'on') {
          console.log(`[ScheduleExecutor] Turning OFF ${device.name} after restart`);
          await haService.toggleSwitch(device.haEntityId);
        }
      }
    } catch (error) {
      console.error('[ScheduleExecutor] Error handling restart:', error);
    }
  }

  getTwilightData(): TwilightData | null {
    return this.twilightData;
  }
}

export const scheduleExecutor = new ScheduleExecutor();
