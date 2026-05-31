import { useState, useEffect, useCallback } from 'react';

interface DashboardProps {
  onLogout: () => void;
  isAdmin?: boolean;
  onShowAdmin?: () => void;
}

interface Device {
  id: number;
  name: string;
  type: string;
  state: string;
  attributes: Record<string, unknown>;
  lastUpdated: string | null;
  isOnline: boolean;
  battery: number | null;
}

export default function Dashboard({ onLogout, isAdmin, onShowAdmin }: DashboardProps) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDevices = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/devices', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 401) {
          onLogout();
          return;
        }
        throw new Error('Failed to fetch devices');
      }

      const data = await response.json();
      setDevices(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load devices');
    }
  }, [onLogout]);

  useEffect(() => {
    fetchDevices();
    setIsLoading(false);

    // Poll for updates every 5 seconds
    const interval = setInterval(fetchDevices, 5000);
    return () => clearInterval(interval);
  }, [fetchDevices]);

  const handleToggle = async (deviceId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/devices/${deviceId}/toggle`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to toggle device');
      }

      // Refresh device list
      await fetchDevices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle device');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-silver sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-text">Apartment Dashboard</h1>
            <p className="text-xs text-text-muted">Shared Devices</p>
          </div>
          <div className="flex items-center space-x-2">
            {isAdmin && onShowAdmin && (
              <button
                onClick={onShowAdmin}
                className="p-2 text-text-muted hover:text-text transition-colors"
                aria-label="Admin settings"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            )}
            <button
              onClick={onLogout}
              className="p-2 text-text-muted hover:text-text transition-colors"
              aria-label="Sign out"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="max-w-lg mx-auto px-4 pt-4">
          <div className="bg-danger/10 border border-danger/20 rounded-xl p-3 text-danger text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-danger/60 hover:text-danger">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Device List */}
      <main className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : devices.length === 0 ? (
          <div className="text-center py-12 text-text-muted">
            <p>No shared devices found</p>
          </div>
        ) : (
          devices.map((device) => (
            <DeviceCard key={device.id} device={device} onToggle={() => handleToggle(device.id)} />
          ))
        )}
      </main>
    </div>
  );
}

function DeviceCard({ device, onToggle }: { device: Device; onToggle: () => void }) {
  const getStatusColor = () => {
    if (!device.isOnline) return 'bg-offline';
    if (device.state === 'on') return 'bg-success';
    if (device.state === 'off') return 'bg-danger';
    return 'bg-accent';
  };

  const getBatteryColor = () => {
    if (!device.battery) return '';
    if (device.battery <= 20) return 'text-danger';
    if (device.battery <= 40) return 'text-warning';
    return 'text-success';
  };

  return (
    <div className={`bg-card rounded-xl p-4 shadow-sm border ${device.isOnline ? 'border-silver' : 'border-offline'} ${!device.isOnline ? 'opacity-60' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 min-w-0">
          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${getStatusColor()}`} />
          <div className="min-w-0">
            <h3 className="font-semibold text-text text-sm truncate">{device.name}</h3>
            <p className="text-xs text-text-muted">
              {device.isOnline ? device.state : 'Offline'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
          {device.battery !== null && device.isOnline && (
            <div className={`flex items-center text-xs ${getBatteryColor()}`}>
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {device.battery}%
            </div>
          )}

          {device.type === 'switch' && device.isOnline && (
            <button
              onClick={onToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                device.state === 'on' ? 'bg-primary' : 'bg-silver'
              }`}
              aria-label={`Toggle ${device.name}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  device.state === 'on' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
