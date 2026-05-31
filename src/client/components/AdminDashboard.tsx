import { useState, useEffect, useCallback } from 'react';

interface AdminDevice {
  id: number;
  haEntityId: string;
  name: string;
  type: string;
  room: string | null;
  batteryEntityId: string | null;
  displayOrder: number;
  createdAt: string;
}

interface AddDeviceForm {
  haEntityId: string;
  name: string;
  type: string;
  batteryEntityId: string;
}

export default function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [devices, setDevices] = useState<AdminDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDevice, setNewDevice] = useState<AddDeviceForm>({
    haEntityId: '',
    name: '',
    type: 'switch',
    batteryEntityId: '',
  });

  const token = localStorage.getItem('token');

  const fetchDevices = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/devices', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 401) {
          onLogout();
          return;
        }
        if (response.status === 403) {
          setError('Admin access required');
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
  }, [token, onLogout]);

  useEffect(() => {
    fetchDevices();
    setIsLoading(false);
  }, [fetchDevices]);

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/devices', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          haEntityId: newDevice.haEntityId,
          name: newDevice.name,
          type: newDevice.type,
          batteryEntityId: newDevice.batteryEntityId || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add device');
      }

      setSuccess(`Added ${newDevice.name}`);
      setNewDevice({ haEntityId: '', name: '', type: 'switch', batteryEntityId: '' });
      setShowAddForm(false);
      await fetchDevices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add device');
    }
  };

  const handleDeleteDevice = async (deviceId: number, deviceName: string) => {
    if (!confirm(`Delete "${deviceName}"?`)) return;

    try {
      const response = await fetch(`/api/admin/devices/${deviceId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to delete device');
      }

      setSuccess(`Deleted ${deviceName}`);
      await fetchDevices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete device');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-silver sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-text">Admin Dashboard</h1>
            <p className="text-xs text-text-muted">Manage Shared Devices</p>
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

      {/* Messages */}
      <div className="max-w-lg mx-auto px-4 pt-4 space-y-2">
        {error && (
          <div className="bg-danger/10 border border-danger/20 rounded-xl p-3 text-danger text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-danger/60 hover:text-danger">✕</button>
          </div>
        )}
        {success && (
          <div className="bg-success/10 border border-success/20 rounded-xl p-3 text-success text-sm flex items-center justify-between">
            <span>{success}</span>
            <button onClick={() => setSuccess('')} className="text-success/60 hover:text-success">✕</button>
          </div>
        )}
      </div>

      {/* Add Device Button */}
      <div className="max-w-lg mx-auto px-4 pt-4">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-full bg-primary text-white rounded-xl py-3 px-4 font-medium hover:bg-primary/90 transition-colors"
        >
          {showAddForm ? 'Cancel' : '+ Add Device'}
        </button>
      </div>

      {/* Add Device Form */}
      {showAddForm && (
        <div className="max-w-lg mx-auto px-4 pt-4">
          <form onSubmit={handleAddDevice} className="bg-card rounded-xl p-4 border border-silver space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">Entity ID</label>
              <input
                type="text"
                value={newDevice.haEntityId}
                onChange={(e) => setNewDevice({ ...newDevice, haEntityId: e.target.value })}
                placeholder="switch.living_room"
                className="w-full bg-background border border-silver rounded-lg px-3 py-2 text-text text-sm focus:outline-none focus:border-primary"
                required
              />
              <p className="text-xs text-text-muted mt-1">Format: domain.entity_name</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1">Display Name</label>
              <input
                type="text"
                value={newDevice.name}
                onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                placeholder="Living Room Light"
                className="w-full bg-background border border-silver rounded-lg px-3 py-2 text-text text-sm focus:outline-none focus:border-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1">Type</label>
              <select
                value={newDevice.type}
                onChange={(e) => setNewDevice({ ...newDevice, type: e.target.value })}
                className="w-full bg-background border border-silver rounded-lg px-3 py-2 text-text text-sm focus:outline-none focus:border-primary"
              >
                <option value="switch">Switch</option>
                <option value="sensor">Sensor</option>
                <option value="binary_sensor">Binary Sensor</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1">Battery Entity ID (optional)</label>
              <input
                type="text"
                value={newDevice.batteryEntityId}
                onChange={(e) => setNewDevice({ ...newDevice, batteryEntityId: e.target.value })}
                placeholder="sensor.living_room_battery"
                className="w-full bg-background border border-silver rounded-lg px-3 py-2 text-text text-sm focus:outline-none focus:border-primary"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-white rounded-lg py-2 font-medium hover:bg-primary/90 transition-colors"
            >
              Add Device
            </button>
          </form>
        </div>
      )}

      {/* Device List */}
      <main className="max-w-lg mx-auto px-4 py-4 space-y-3">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Shared Devices</h2>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : devices.length === 0 ? (
          <div className="text-center py-12 text-text-muted">
            <p>No devices configured</p>
            <p className="text-sm mt-1">Add devices above to share them</p>
          </div>
        ) : (
          devices.map((device) => (
            <div
              key={device.id}
              className="bg-card rounded-xl p-4 border border-silver flex items-center justify-between"
            >
              <div className="min-w-0">
                <h3 className="font-semibold text-text text-sm truncate">{device.name}</h3>
                <p className="text-xs text-text-muted truncate">{device.haEntityId}</p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-accent/10 text-accent text-xs rounded-full">
                  {device.type}
                </span>
              </div>

              <button
                onClick={() => handleDeleteDevice(device.id, device.name)}
                className="p-2 text-danger/60 hover:text-danger transition-colors flex-shrink-0 ml-2"
                aria-label={`Delete ${device.name}`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
