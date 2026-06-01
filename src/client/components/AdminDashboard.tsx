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

      setSuccess(`Added "${newDevice.name}"`);
      setNewDevice({ haEntityId: '', name: '', type: 'switch', batteryEntityId: '' });
      setShowAddForm(false);
      await fetchDevices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add device');
    }
  };

  const handleDeleteDevice = async (deviceId: number, deviceName: string) => {
    if (!confirm(`Remove "${deviceName}" from the dashboard?`)) return;

    try {
      const response = await fetch(`/api/admin/devices/${deviceId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to remove device');
      }

      setSuccess(`Removed "${deviceName}"`);
      await fetchDevices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove device');
    }
  };

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3.5 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-text tracking-tight">Device Management</h1>
            <p className="text-xs text-text-muted mt-0.5">{devices.length} device{devices.length !== 1 ? 's' : ''} shared</p>
          </div>
          <button
            onClick={onLogout}
            className="px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-black/5 rounded-xl transition-glass"
          >
            Exit
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-5 space-y-5">
        {/* Messages */}
        <div className="space-y-2">
          {error && (
            <div className="bg-danger/8 border border-danger/15 rounded-2xl p-3.5 text-danger text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-success/8 border border-success/15 rounded-2xl p-3.5 text-success text-sm">
              {success}
            </div>
          )}
        </div>

        {/* Add Device Button */}
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-full liquid-card rounded-2xl py-3.5 px-4 font-medium text-primary text-[15px] transition-glass hover:text-primary-dark"
        >
          {showAddForm ? 'Cancel' : '+ Add New Device'}
        </button>

        {/* Add Device Form */}
        {showAddForm && (
          <div className="liquid-card rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold text-text">Add Device</h3>
            
            <form onSubmit={handleAddDevice} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Entity ID</label>
                <input
                  type="text"
                  value={newDevice.haEntityId}
                  onChange={(e) => setNewDevice({ ...newDevice, haEntityId: e.target.value })}
                  placeholder="switch.living_room"
                  className="w-full px-4 py-3 rounded-2xl border border-border text-text placeholder-text-muted focus:outline-none focus:border-primary/40 transition-glass text-[15px]"
                  required
                />
                <p className="text-xs text-text-muted mt-1">Format: domain.entity_name</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Display Name</label>
                <input
                  type="text"
                  value={newDevice.name}
                  onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                  placeholder="Living Room Light"
                  className="w-full px-4 py-3 rounded-2xl border border-border text-text placeholder-text-muted focus:outline-none focus:border-primary/40 transition-glass text-[15px]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Type</label>
                <select
                  value={newDevice.type}
                  onChange={(e) => setNewDevice({ ...newDevice, type: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-border text-text focus:outline-none focus:border-primary/40 transition-glass text-[15px]"
                >
                  <option value="switch">Switch</option>
                  <option value="sensor">Sensor</option>
                  <option value="binary_sensor">Binary Sensor</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Battery Entity ID (optional)</label>
                <input
                  type="text"
                  value={newDevice.batteryEntityId}
                  onChange={(e) => setNewDevice({ ...newDevice, batteryEntityId: e.target.value })}
                  placeholder="sensor.living_room_battery"
                  className="w-full px-4 py-3 rounded-2xl border border-border text-text placeholder-text-muted focus:outline-none focus:border-primary/40 transition-glass text-[15px]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-primary hover:bg-primary-dark text-white font-medium rounded-2xl transition-glass shadow-lg shadow-primary/25"
              >
                Add Device
              </button>
            </form>
          </div>
        )}

        {/* Device List */}
        <section>
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 px-1">
            Shared Devices
          </h2>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-[2.5px] border-primary border-t-transparent" />
            </div>
          ) : devices.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-text-muted/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <p className="text-text-muted font-medium">No devices configured</p>
              <p className="text-text-muted/70 text-sm mt-1">Add devices to share them</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className="liquid-card rounded-2xl p-4 flex items-center justify-between transition-glass"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-text text-[15px] truncate">{device.name}</h3>
                    <p className="text-xs text-text-muted truncate mt-0.5">{device.haEntityId}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-lg">
                        {device.type}
                      </span>
                      {device.batteryEntityId && (
                        <span className="inline-flex items-center px-2.5 py-0.5 bg-success/10 text-success text-xs font-medium rounded-lg">
                          Battery
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteDevice(device.id, device.name)}
                    className="p-2.5 text-text-muted hover:text-danger hover:bg-danger/10 rounded-xl transition-glass flex-shrink-0 ml-3"
                    aria-label={`Remove ${device.name}`}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
