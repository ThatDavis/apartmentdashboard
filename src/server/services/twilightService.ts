interface SunriseSunsetResponse {
  results: {
    sunrise: string;
    sunset: string;
    civil_twilight_begin: string;
    civil_twilight_end: string;
  };
  status: string;
}

export interface TwilightData {
  date: string;
  dawn: string;
  dusk: string;
  sunrise: string;
  sunset: string;
}

// Chicago, IL coordinates
const LAT = 41.8781;
const LNG = -87.6298;
const TIMEZONE = 'America/Chicago';

class TwilightService {
  async fetchTwilightData(date: Date): Promise<TwilightData> {
    const dateStr = date.toISOString().split('T')[0];
    
    try {
      const response = await fetch(
        `https://api.sunrise-sunset.org/json?lat=${LAT}&lng=${LNG}&date=${dateStr}&formatted=0`
      );
      
      if (!response.ok) {
        throw new Error(`Sunrise-sunset API error: ${response.status}`);
      }
      
      const data = await response.json() as SunriseSunsetResponse;
      
      if (data.status !== 'OK') {
        throw new Error(`Sunrise-sunset API returned status: ${data.status}`);
      }
      
      return {
        date: dateStr,
        dawn: this.formatTime(data.results.civil_twilight_begin),
        dusk: this.formatTime(data.results.civil_twilight_end),
        sunrise: this.formatTime(data.results.sunrise),
        sunset: this.formatTime(data.results.sunset),
      };
    } catch (error) {
      console.error('[TwilightService] Failed to fetch twilight data:', error);
      throw error;
    }
  }
  
  private formatTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      timeZone: TIMEZONE,
    });
  }
  
  getNextMidnightCT(): Date {
    const now = new Date();
    const midnight = new Date(now.toLocaleString('en-US', { timeZone: TIMEZONE }));
    midnight.setHours(24, 0, 0, 0);
    return midnight;
  }
}

export const twilightService = new TwilightService();
