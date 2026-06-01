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

      await fetchDevices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle device');
    }
  };

  const switches = devices.filter(d => d.type === 'switch');
  const sensors = devices.filter(d => d.type === 'sensor' || d.type === 'binary_sensor');

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3.5 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-text tracking-tight">Dashboard</h1>
            <p className="text-xs text-text-muted mt-0.5">{devices.length} device{devices.length !== 1 ? 's' : ''} connected</p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && onShowAdmin && (
              <button
                onClick={onShowAdmin}
                className="px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/15 rounded-xl transition-glass"
              >
                Manage
              </button>
            )}
            <button
              onClick={onLogout}
              className="px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-black/5 rounded-xl transition-glass"
            >
              Exit
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-5 space-y-5">
        {/* Error */}
        {error && (
          <div className="bg-danger/8 border border-danger/15 rounded-2xl p-3.5 text-danger text-sm">
            {error}
          </div>
        )}

        {/* Switches Section */}
        {switches.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 px-1">
              Controls
            </h2>
            <div className="space-y-2.5">
              {switches.map((device) => (
                <SwitchCard key={device.id} device={device} onToggle={() => handleToggle(device.id)} />
              ))}
            </div>
          </section>
        )}

        {/* Sensors Section */}
        {sensors.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 px-1">
              Sensors
            </h2>
            <div className="space-y-2.5">
              {sensors.map((device) => (
                <SensorCard key={device.id} device={device} />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {!isLoading && devices.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-text-muted/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-text-muted font-medium">No devices configured</p>
            <p className="text-text-muted/70 text-sm mt-1">Contact an admin to add devices</p>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-[2.5px] border-primary border-t-transparent" />
          </div>
        )}
      </div>
    </div>
  );
}

function SwitchCard({ device, onToggle }: { device: Device; onToggle: () => void }) {
  const isOn = device.state === 'on';
  
  return (
    <div className={`liquid-card rounded-2xl p-4 transition-glass ${!device.isOnline ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`status-dot flex-shrink-0 ${device.isOnline ? (isOn ? 'bg-success' : 'bg-offline') : 'bg-offline'}`} />
          <div className="min-w-0">
            <h3 className="font-medium text-text text-[15px] truncate">{device.name}</h3>
            <p className="text-xs text-text-muted mt-0.5">
              {device.isOnline ? (isOn ? 'On' : 'Off') : 'Offline'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {device.battery !== null && device.isOnline && (
            <BatteryIndicator battery={device.battery} />
          )}

          {device.isOnline && (
            <button
              onClick={onToggle}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-glass ${
                isOn ? 'bg-success' : 'bg-text-muted/25'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-glass ${
                  isOn ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SensorCard({ device }: { device: Device }) {
  const getSensorDisplay = () => {
    if (!device.isOnline) return 'Offline';
    if (device.state === 'unknown') return 'Unknown';
    
    // Try to get a friendly value from attributes
    const unit = device.attributes?.unit_of_measurement;
    if (unit) {
      return `${device.state} ${unit}`;
    }
    
    return device.state;
  };

  return (
    <div className={`liquid-card rounded-2xl p-4 transition-glass ${!device.isOnline ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`status-dot flex-shrink-0 ${device.isOnline ? 'bg-primary' : 'bg-offline'}`} />
          <div className="min-w-0">
            <h3 className="font-medium text-text text-[15px] truncate">{device.name}</h3>
            <p className="text-xs text-text-muted mt-0.5">{getSensorDisplay()}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {device.battery !== null && device.isOnline && (
            <BatteryIndicator battery={device.battery} />
          )}
          <div className="text-right">
            <span className="text-lg font-semibold text-text">{device.state}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function BatteryIndicator({ battery }: { battery: number }) {
  const getColor = () => {
    if (battery <= 20) return 'text-danger';
    if (battery <= 40) return 'text-warning';
    return 'text-success';
  };

  return (
    <div className={`flex items-center gap-1 text-xs font-medium ${getColor()}`}>
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M2 7a2 2 0 012-2h11a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V7zm13 1.5a.5.5 0 00-.5-.5h-10a.5.5 0 00-.5.5v3a.5.5 0 00.5.5h10a.5.5 0 00.5-.5v-3z" />
      </svg>
      {battery}%
    </div>
  );
}
