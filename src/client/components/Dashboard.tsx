import { useState, useEffect } from 'react';

interface DashboardProps {
  onLogout: () => void;
}

interface Device {
  id: number;
  name: string;
  type: string;
  state: string;
  battery?: number;
  isOnline: boolean;
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error] = useState('');

  useEffect(() => {
    // TODO: Fetch actual devices from API
    // For now, show placeholder data
    const mockDevices: Device[] = [
      {
        id: 1,
        name: 'Soil Sensor - Living Room',
        type: 'sensor',
        state: '45%',
        battery: 78,
        isOnline: true,
      },
      {
        id: 2,
        name: 'Plant Light',
        type: 'switch',
        state: 'on',
        isOnline: true,
      },
      {
        id: 3,
        name: 'Window Sensor',
        type: 'binary_sensor',
        state: 'closed',
        battery: 34,
        isOnline: true,
      },
      {
        id: 4,
        name: 'Outdoor Sensor',
        type: 'sensor',
        state: 'offline',
        isOnline: false,
      },
    ];

    setTimeout(() => {
      setDevices(mockDevices);
      setIsLoading(false);
    }, 500);
  }, []);

  const handleToggle = async (deviceId: number) => {
    // TODO: Send toggle command to API
    console.log('Toggle device:', deviceId);
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
      </header>

      {/* Device List */}
      <main className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="bg-danger/10 border border-danger/20 rounded-xl p-4 text-danger text-sm">
            {error}
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

  return (
    <div className={`bg-card rounded-xl p-4 shadow-sm border ${device.isOnline ? 'border-silver' : 'border-offline'} ${!device.isOnline ? 'opacity-60' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
          <div>
            <h3 className="font-semibold text-text text-sm">{device.name}</h3>
            <p className="text-xs text-text-muted">
              {device.isOnline ? device.state : 'Offline'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {device.battery !== undefined && device.isOnline && (
            <div className="flex items-center text-xs text-text-muted">
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
