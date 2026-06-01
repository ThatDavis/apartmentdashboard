import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  AlertCircle, 
  CheckCircle2,
  Battery,
  Zap,
  Activity,
  Users,
  Settings,
  KeyRound
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

interface User {
  id: number;
  username: string;
  isAdmin: boolean;
  createdAt: string;
}

interface AddDeviceForm {
  haEntityId: string;
  name: string;
  type: string;
  batteryEntityId: string;
}

export default function AdminDashboard({ onLogout, onBack }: { onLogout: () => void; onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<'devices' | 'users'>('devices');
  const [devices, setDevices] = useState<AdminDevice[]>([]);
  const [users, setUsers] = useState<User[]>([]);
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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDevice, setEditDevice] = useState<AddDeviceForm>({
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

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/users', {
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
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    }
  }, [token, onLogout]);

  useEffect(() => {
    if (activeTab === 'devices') {
      fetchDevices();
    } else {
      fetchUsers();
    }
    setIsLoading(false);
  }, [activeTab, fetchDevices, fetchUsers]);

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

  const startEditDevice = (device: AdminDevice) => {
    setEditingId(device.id);
    setEditDevice({
      haEntityId: device.haEntityId,
      name: device.name,
      type: device.type,
      batteryEntityId: device.batteryEntityId || '',
    });
    setShowAddForm(false);
    setError('');
    setSuccess('');
  };

  const handleEditDevice = async (e: React.FormEvent, deviceId: number) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/admin/devices/${deviceId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          haEntityId: editDevice.haEntityId,
          name: editDevice.name,
          type: editDevice.type,
          batteryEntityId: editDevice.batteryEntityId || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update device');
      }

      setSuccess(`Updated "${editDevice.name}"`);
      setEditingId(null);
      await fetchDevices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update device');
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

  const handleDeleteUser = async (userId: number, username: string) => {
    if (!confirm(`Delete user "${username}"? This cannot be undone.`)) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete user');
      }

      setSuccess(`Deleted user "${username}"`);
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  const handleChangePin = async (userId: number, username: string) => {
    const newPin = prompt(`Enter new PIN for "${username}" (4-6 digits):`);
    if (!newPin) return;
    if (newPin.length < 4 || newPin.length > 6 || !/^\d+$/.test(newPin)) {
      setError('PIN must be 4-6 digits');
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}/pin`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pin: newPin }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update PIN');
      }

      setSuccess(`Updated PIN for "${username}"`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update PIN');
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
              onClick={onBack}
              className="mb-4 flex items-center gap-1.5 text-text-muted hover:text-text transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-text">Admin Panel</h1>
          </div>
        </header>

        <main className="max-w-lg mx-auto lg:max-w-4xl px-5 space-y-5">
          {/* Tab Navigation */}
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => setActiveTab('devices')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === 'devices'
                  ? 'bg-primary text-white shadow-md'
                  : 'glass-button text-text-secondary hover:text-text'
              }`}
            >
              <Settings className="w-4 h-4" />
              Devices
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === 'users'
                  ? 'bg-primary text-white shadow-md'
                  : 'glass-button text-text-secondary hover:text-text'
              }`}
            >
              <Users className="w-4 h-4" />
              Users
            </button>
          </div>

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

          {/* Devices Tab */}
          {activeTab === 'devices' && (
            <div className="space-y-5 animate-fade-in">
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
                  Shared Devices ({devices.length})
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

                      if (editingId === device.id) {
                        return (
                          <div
                            key={device.id}
                            className="glass-card rounded-2xl p-5 space-y-4 animate-fade-in"
                          >
                            <h3 className="font-semibold text-text">Edit Device</h3>

                            <form onSubmit={(e) => handleEditDevice(e, device.id)} className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1.5">Entity ID</label>
                                <input
                                  type="text"
                                  value={editDevice.haEntityId}
                                  onChange={(e) => setEditDevice({ ...editDevice, haEntityId: e.target.value })}
                                  placeholder="switch.living_room"
                                  className="w-full px-4 py-3 rounded-xl glass-input text-text placeholder-text-muted"
                                  required
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1.5">Display Name</label>
                                <input
                                  type="text"
                                  value={editDevice.name}
                                  onChange={(e) => setEditDevice({ ...editDevice, name: e.target.value })}
                                  placeholder="Living Room Light"
                                  className="w-full px-4 py-3 rounded-xl glass-input text-text placeholder-text-muted"
                                  required
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1.5">Type</label>
                                <select
                                  value={editDevice.type}
                                  onChange={(e) => setEditDevice({ ...editDevice, type: e.target.value })}
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
                                  value={editDevice.batteryEntityId}
                                  onChange={(e) => setEditDevice({ ...editDevice, batteryEntityId: e.target.value })}
                                  placeholder="sensor.living_room_battery"
                                  className="w-full px-4 py-3 rounded-xl glass-input text-text placeholder-text-muted"
                                />
                              </div>

                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingId(null)}
                                  className="flex-1 py-3 rounded-xl glass-button text-text-secondary font-medium"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  className="flex-1 py-3 rounded-xl glass-button-primary text-white font-medium flex items-center justify-center gap-2"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  Save Changes
                                </button>
                              </div>
                            </form>
                          </div>
                        );
                      }

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

                          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                            <button
                              onClick={() => startEditDevice(device)}
                              className="p-2.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                              aria-label={`Edit ${device.name}`}
                            >
                              <Pencil className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteDevice(device.id, device.name)}
                              className="p-2.5 text-text-muted hover:text-danger hover:bg-danger/10 rounded-xl transition-all"
                              aria-label={`Remove ${device.name}`}
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-5 animate-fade-in">
              <section>
                <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4 px-1">
                  Users ({users.length})
                </h2>
                
                {isLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <Users className="w-12 h-12 text-text-muted" />
                    </div>
                    <p className="text-text-muted font-medium text-lg">No users found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="glass-card rounded-2xl p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center flex-shrink-0">
                            <Users className="w-5 h-5 text-secondary-light" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-medium text-text text-sm truncate">{user.username}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              {user.isAdmin && (
                                <span className="inline-flex items-center px-2 py-0.5 bg-primary/20 text-primary-light text-xs font-medium rounded-lg">
                                  Admin
                                </span>
                              )}
                              <span className="text-xs text-text-muted">
                                Created {new Date(user.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                          <button
                            onClick={() => handleChangePin(user.id, user.username)}
                            className="p-2.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                            aria-label={`Change PIN for ${user.username}`}
                          >
                            <KeyRound className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id, user.username)}
                            className="p-2.5 text-text-muted hover:text-danger hover:bg-danger/10 rounded-xl transition-all"
                            aria-label={`Delete ${user.username}`}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
