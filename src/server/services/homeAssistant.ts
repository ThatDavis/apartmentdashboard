import { FastifyInstance } from 'fastify';

const HA_URL = process.env.HA_URL;
const HA_TOKEN = process.env.HA_TOKEN;

if (!HA_URL || !HA_TOKEN) {
  console.warn('HA_URL or HA_TOKEN not configured. Home Assistant integration will be disabled.');
}

interface HADeviceState {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_changed: string;
  last_updated: string;
}

const ALLOWED_DOMAINS = (process.env.ALLOWED_DOMAINS || 'switch,light,sensor,binary_sensor')
  .split(',')
  .map(d => d.trim())
  .filter(Boolean);

class HomeAssistantService {
  private baseUrl: string;
  private token: string;
  private enabled: boolean;

  constructor() {
    this.baseUrl = HA_URL || '';
    this.token = HA_TOKEN || '';
    this.enabled = !!(this.baseUrl && this.token);
  }

  isDomainAllowed(entityId: string): boolean {
    const domain = entityId.split('.')[0];
    return ALLOWED_DOMAINS.includes(domain);
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<unknown> {
    if (!this.enabled) {
      throw new Error('Home Assistant not configured');
    }

    const url = `${this.baseUrl}/api${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HA API error: ${response.status} ${error}`);
    }

    return response.json();
  }

  async checkConnection(): Promise<{ connected: boolean; error?: string }> {
    if (!this.enabled) {
      return { connected: false, error: 'Home Assistant not configured' };
    }

    try {
      await this.request('/');
      return { connected: true };
    } catch (error) {
      return { connected: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getDeviceState(entityId: string): Promise<HADeviceState | null> {
    try {
      const states = await this.request('/states') as HADeviceState[];
      return states.find((s: HADeviceState) => s.entity_id === entityId) || null;
    } catch (error) {
      console.error('Failed to fetch device state:', error);
      return null;
    }
  }

  async getAllStates(): Promise<HADeviceState[]> {
    try {
      return await this.request('/states') as HADeviceState[];
    } catch (error) {
      console.error('Failed to fetch all states:', error);
      return [];
    }
  }

  async toggleSwitch(entityId: string): Promise<boolean> {
    if (!this.isDomainAllowed(entityId)) {
      console.error(`Domain not allowed for entity: ${entityId}`);
      return false;
    }

    try {
      await this.request('/services/homeassistant/toggle', {
        method: 'POST',
        body: JSON.stringify({ entity_id: entityId }),
      });
      return true;
    } catch (error) {
      console.error('Failed to toggle switch:', error);
      return false;
    }
  }
}

export const haService = new HomeAssistantService();

// Fastify plugin for dependency injection
export async function homeAssistantPlugin(fastify: FastifyInstance) {
  fastify.decorate('haService', haService);
}

// Type augmentation for Fastify
declare module 'fastify' {
  interface FastifyInstance {
    haService: HomeAssistantService;
  }
}
