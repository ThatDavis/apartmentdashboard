import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the service module to avoid singleton issues
vi.mock('../src/server/services/homeAssistant.js', () => {
  return {
    haService: {
      checkConnection: vi.fn(),
      getDeviceState: vi.fn(),
      getAllStates: vi.fn(),
      toggleSwitch: vi.fn(),
      callService: vi.fn(),
    },
  };
});

import { haService } from '../src/server/services/homeAssistant.js';

describe('HomeAssistantService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkConnection', () => {
    it('returns connected true when HA responds successfully', async () => {
      vi.mocked(haService.checkConnection).mockResolvedValue({ connected: true });

      const result = await haService.checkConnection();
      expect(result.connected).toBe(true);
    });

    it('returns connected false when HA request fails', async () => {
      vi.mocked(haService.checkConnection).mockResolvedValue({ 
        connected: false, 
        error: 'HA API error: 401 Unauthorized' 
      });

      const result = await haService.checkConnection();
      expect(result.connected).toBe(false);
      expect(result.error).toContain('401');
    });

    it('returns connected false on network error', async () => {
      vi.mocked(haService.checkConnection).mockResolvedValue({ 
        connected: false, 
        error: 'Network error' 
      });

      const result = await haService.checkConnection();
      expect(result.connected).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  describe('getDeviceState', () => {
    it('returns device state when found', async () => {
      const mockState = {
        entity_id: 'switch.test',
        state: 'on',
        attributes: {},
        last_changed: '2024-01-01T00:00:00Z',
        last_updated: '2024-01-01T00:00:00Z',
      };

      vi.mocked(haService.getDeviceState).mockResolvedValue(mockState);

      const result = await haService.getDeviceState('switch.test');
      expect(result).toEqual(mockState);
    });

    it('returns null when device not found', async () => {
      vi.mocked(haService.getDeviceState).mockResolvedValue(null);

      const result = await haService.getDeviceState('switch.nonexistent');
      expect(result).toBeNull();
    });

    it('returns null when request fails', async () => {
      vi.mocked(haService.getDeviceState).mockResolvedValue(null);

      const result = await haService.getDeviceState('switch.test');
      expect(result).toBeNull();
    });
  });

  describe('getAllStates', () => {
    it('returns all states', async () => {
      const mockStates = [
        { entity_id: 'switch.test1', state: 'on' },
        { entity_id: 'sensor.test2', state: '42' },
      ];

      vi.mocked(haService.getAllStates).mockResolvedValue(mockStates);

      const result = await haService.getAllStates();
      expect(result).toEqual(mockStates);
    });

    it('returns empty array on error', async () => {
      vi.mocked(haService.getAllStates).mockResolvedValue([]);

      const result = await haService.getAllStates();
      expect(result).toEqual([]);
    });
  });

  describe('toggleSwitch', () => {
    it('returns true when toggle succeeds', async () => {
      vi.mocked(haService.toggleSwitch).mockResolvedValue(true);

      const result = await haService.toggleSwitch('switch.test');
      expect(result).toBe(true);
    });

    it('returns false when toggle fails', async () => {
      vi.mocked(haService.toggleSwitch).mockResolvedValue(false);

      const result = await haService.toggleSwitch('switch.test');
      expect(result).toBe(false);
    });
  });

  describe('callService', () => {
    it('returns true when service call succeeds', async () => {
      vi.mocked(haService.callService).mockResolvedValue(true);

      const result = await haService.callService('light', 'turn_on', 'light.test');
      expect(result).toBe(true);
    });

    it('returns false when service call fails', async () => {
      vi.mocked(haService.callService).mockResolvedValue(false);

      const result = await haService.callService('light', 'turn_on', 'light.test');
      expect(result).toBe(false);
    });
  });
});
