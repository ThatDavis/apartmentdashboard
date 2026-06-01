import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Trash2, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle2,
  Battery,
  Zap,
  Activity
} from 'lucide-react';

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

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'switch': return Zap;
      case 'sensor': return Activity;
      case 'binary_sensor': return Activity;
      default: return Zap;
    }
  };

  return (
    <div className="min-h-screen pb-8 relative">
      {/* Ambient glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[128px]" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="px-5 pt-8 pb-6">
          <div className="max-w-lg mx-auto lg:max-w-4xl">
            <button
              onClick={onLogout}
              className="mb-4 flex items-center gap-1.5 text-text-muted hover:text-text transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-text">Device Management</h1>
            <p className="text-text-muted text-sm mt-1">{devices.length} device{devices.length !== 1 ? 's' : ''} shared</p>
          </div>
        </header>

        <main className="max-w-lg mx-auto lg:max-w-4xl px-5 space-y-5">
          {/* Messages */}
          <div className="space-y-2">
            {error && (
              <div className="glass-card rounded-2xl p-4 border-l-4 border-l-danger animate-fade-in">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-danger flex-shrink-0" />
                  <p className="text-danger text-sm">{error}</p>
                </div>
              </div>
            )}
            {success && (
              <div className="glass-card rounded-2xl p-4 border-l-4 border-l-success animate-fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                  <p className="text-success text-sm">{success}</p>
                </div>
              </div>
            )}
          </div>

          {/* Add Device Button */}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-full glass-card rounded-2xl py-3.5 px-4 font-medium text-primary text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {showAddForm ? 'Cancel' : 'Add New Device'}
          </button>

          {/* Add Device Form */}
          {showAddForm && (
            <div className="glass-card rounded-2xl p-5 space-y-4 animate-fade-in">
              <h3 className="font-semibold text-text">Add Device</h3>
              
              <form onSubmit={handleAddDevice} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Entity ID</label>
                  <input
                    type="text"
                    value={newDevice.haEntityId}
                    onChange={(e) => setNewDevice({ ...newDevice, haEntityId: e.target.value })}
                    placeholder="switch.living_room"
                    className="w-full px-4 py-3 rounded-xl glass-input text-text placeholder-text-muted"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Display Name</label>
                  <input
                    type="text"
                    value={newDevice.name}
                    onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                    placeholder="Living Room Light"
                    className="w-full px-4 py-3 rounded-xl glass-input text-text placeholder-text-muted"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Type</label>
                  <select
                    value={newDevice.type}
                    onChange={(e) => setNewDevice({ ...newDevice, type: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl glass-input text-text"
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
                    className="w-full px-4 py-3 rounded-xl glass-input text-text placeholder-text-muted"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl glass-button-primary text-white font-medium flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Device
                </button>
              </form>
            </div>
          )}

          {/* Device List */}
          <section>
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4 px-1">
              Shared Devices
            </h2>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
              </div>
            ) : devices.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <Plus className="w-12 h-12 text-text-muted" />
                </div>
                <p className="text-text-muted font-medium text-lg">No devices configured</p>
                <p className="text-text-muted/70 text-sm mt-2">Add devices to share them</p>
              </div>
            ) : (
              <div className="space-y-3">
                {devices.map((device) => {
                  const Icon = getDeviceIcon(device.type);
                  return (
                    <div
                      key={device.id}
                      className="glass-card rounded-2xl p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-primary-light" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-medium text-text text-sm truncate">{device.name}</h3>
                          <p className="text-xs text-text-muted truncate">{device.haEntityId}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="inline-flex items-center px-2 py-0.5 bg-primary/20 text-primary-light text-xs font-medium rounded-lg">
                              {device.type}
                            </span>
                            {device.batteryEntityId && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-success/20 text-success text-xs font-medium rounded-lg">
                                <Battery className="w-3 h-3" />
                                Battery
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteDevice(device.id, device.name)}
                        className="p-2.5 text-text-muted hover:text-danger hover:bg-danger/10 rounded-xl transition-all flex-shrink-0 ml-3"
                        aria-label={`Remove ${device.name}`}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
