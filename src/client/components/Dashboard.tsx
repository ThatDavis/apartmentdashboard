import { useState, useEffect, useCallback } from 'react';
import {
  Lightbulb, 
  Zap, 
  Thermometer, 
  Droplets, 
  Battery, 
  BatteryWarning, 
  BatteryLow,
  Power,
  Settings,
  LogOut,
  Wifi,
  WifiOff,
  Activity,
  Sun,
  Moon,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  CalendarDays
} from 'lucide-react';
import SensorChart from './SensorChart.js';
import ScheduleEditor from './ScheduleEditor.js';
import { useTheme } from '../hooks/useTheme.js';

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

interface HistoryPoint {
  recordedAt: string;
  value: number;
}

export default function Dashboard({ onLogout, isAdmin, onShowAdmin }: DashboardProps) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState('');
  const [sensorHistory, setSensorHistory] = useState<Record<number, HistoryPoint[]>>({});
  const [expandedSensor, setExpandedSensor] = useState<number | null>(null);
  const [scheduleEditorDevice, setScheduleEditorDevice] = useState<Device | null>(null);

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
    const timeInterval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      const hour = now.getHours();
      if (hour < 12) setGreeting('Good morning');
      else if (hour < 17) setGreeting('Good afternoon');
      else setGreeting('Good evening');
    }, 60000);
    
    // Set initial greeting
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
    
    return () => {
      clearInterval(interval);
      clearInterval(timeInterval);
    };
  }, [fetchDevices]);

  const fetchSensorHistory = useCallback(async (deviceId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/devices/${deviceId}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 401) {
          onLogout();
          return;
        }
        throw new Error('Failed to fetch history');
      }

      const data = await response.json();
      setSensorHistory(prev => ({ ...prev, [deviceId]: data }));
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  }, [onLogout]);

  const handleToggle = useCallback(async (deviceId: number) => {
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
  }, [fetchDevices]);

  const switches = devices.filter(d => d.type === 'switch');
  const sensors = devices.filter(d => d.type === 'sensor' || d.type === 'binary_sensor');
  const onlineCount = devices.filter(d => d.isOnline).length;

  const formatTime = () => {
    return currentTime.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="min-h-screen pb-8 relative">
      {/* Ambient background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/15 rounded-full blur-[128px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[128px]" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="px-5 pt-8 pb-6">
          <div className="max-w-lg mx-auto lg:max-w-4xl lg:max-w-4xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-text-muted text-sm font-medium">{greeting}</p>
                <h1 className="text-4xl font-bold text-text mt-1 tracking-tight">
                  {formatTime()}
                </h1>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/20 text-success text-xs font-medium">
                    <Wifi className="w-3 h-3" />
                    {onlineCount} online
                  </span>
                  {devices.length > onlineCount && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-danger/20 text-danger text-xs font-medium">
                      <WifiOff className="w-3 h-3" />
                      {devices.length - onlineCount} offline
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <ThemeToggle />
                {isAdmin && onShowAdmin && (
                  <button
                    onClick={onShowAdmin}
                    className="p-2.5 rounded-xl glass-button text-text-secondary hover:text-text"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={onLogout}
                  className="p-2.5 rounded-xl glass-button text-text-secondary hover:text-text"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-lg mx-auto lg:max-w-4xl px-5 space-y-6">
          {/* Error */}
          {error && (
            <div className="glass-card rounded-2xl p-4 border-l-4 border-l-danger animate-fade-in">
              <p className="text-danger text-sm">{error}</p>
            </div>
          )}

          {/* Switches Grid */}
          {switches.length > 0 && (
            <section className="animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-primary-light" />
                <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
                  Controls
                </h2>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {switches.map((device) => (
                  <SwitchCard 
                    key={device.id} 
                    device={device} 
                    onToggle={() => handleToggle(device.id)}
                    onSchedule={() => setScheduleEditorDevice(device)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Sensors List */}
          {sensors.length > 0 && (
            <section className="animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-primary-light" />
                <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
                  Sensors
                </h2>
              </div>
              <div className="space-y-3">
                {sensors.map((device) => (
                  <SensorCard 
                    key={device.id} 
                    device={device} 
                    history={sensorHistory[device.id] || []}
                    isExpanded={expandedSensor === device.id}
                    onToggleExpand={() => {
                      if (expandedSensor === device.id) {
                        setExpandedSensor(null);
                      } else {
                        setExpandedSensor(device.id);
                        if (!sensorHistory[device.id]) {
                          fetchSensorHistory(device.id);
                        }
                      }
                    }}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Empty State */}
          {!isLoading && devices.length === 0 && (
            <div className="text-center py-20 animate-fade-in">
                <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <Lightbulb className="w-12 h-12 text-text-muted" />
                </div>
              <p className="text-text-muted font-medium text-lg">No devices configured</p>
              <p className="text-text-muted/70 text-sm mt-2">Contact an admin to add devices</p>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
            </div>
          )}
        </main>
      </div>

      {/* Schedule Editor Modal */}
      {scheduleEditorDevice && (
        <ScheduleEditor
          deviceId={scheduleEditorDevice.id}
          deviceName={scheduleEditorDevice.name}
          onClose={() => setScheduleEditorDevice(null)}
          onSave={() => {
            // Refresh devices to show any schedule indicators
            fetchDevices();
          }}
        />
      )}
    </div>
  );
}

function ThemeToggle() {
  const { mode, isLight, toggleMode, isManual } = useTheme();

  return (
    <button
      onClick={toggleMode}
      className={`p-2.5 rounded-xl glass-button transition-all ${
        isManual ? 'ring-2 ring-primary/30' : ''
      }`}
      title={`Theme: ${mode} (click to cycle)`}
    >
      {isLight ? (
        <Sun className="w-5 h-5 text-warning" />
      ) : (
        <Moon className="w-5 h-5 text-secondary-light" />
      )}
      {isManual && (
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
      )}
    </button>
  );
}

function SwitchCard({ device, onToggle, onSchedule }: { device: Device; onToggle: () => void; onSchedule: () => void }) {
  const isOn = device.state === 'on';
  
  return (
    <div 
      className={`glass-card rounded-2xl p-4 transition-all duration-200 ${
        isOn ? 'bg-primary/15 border-primary/30' : ''
      } ${!device.isOnline ? 'opacity-40' : ''}`}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-start justify-between mb-3">
          <div 
            className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer active:scale-95 ${
              isOn 
                ? 'bg-primary/30 text-primary-light' 
                : 'bg-text-muted/10 text-text-muted'
            }`}
            onClick={device.isOnline ? onToggle : undefined}
          >
            <Lightbulb className="w-5 h-5" />
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={onSchedule}
              className="p-2 rounded-lg hover:bg-primary/10 text-text-muted hover:text-primary transition-colors"
              aria-label={`Schedule ${device.name}`}
            >
              <CalendarDays className="w-4 h-4" />
            </button>
            {device.battery !== null && device.isOnline && (
              <BatteryIndicator battery={device.battery} />
            )}
          </div>
        </div>

        <div className="mt-auto cursor-pointer" onClick={device.isOnline ? onToggle : undefined}>
          <h3 className="font-medium text-text text-sm truncate">{device.name}</h3>
          <p className={`text-xs mt-1 font-medium ${
            device.isOnline
              ? (isOn ? 'text-primary-light' : 'text-text-secondary')
              : 'text-text-muted'
          }`}>
            {device.isOnline ? (isOn ? 'On' : 'Off') : 'Offline'}
          </p>
        </div>

        {/* Toggle indicator */}
        <div className={`mt-3 h-1.5 rounded-full overflow-hidden ${
          isOn ? 'bg-primary/20' : 'bg-text-muted/10'
        }`}>
          <div 
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              isOn ? 'w-full bg-primary' : 'w-0'
            }`} 
          />
        </div>
      </div>
    </div>
  );
}

function SensorCard({ 
  device, 
  history, 
  isExpanded, 
  onToggleExpand 
}: { 
  device: Device; 
  history: HistoryPoint[];
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const getSensorDisplay = () => {
    if (!device.isOnline) return 'Offline';
    if (device.state === 'unknown') return 'Unknown';
    
    const unit = device.attributes?.unit_of_measurement;
    if (unit) {
      return `${device.state} ${unit}`;
    }
    
    return device.state;
  };

  const getSensorIcon = () => {
    const name = device.name.toLowerCase();
    if (name.includes('temp')) return Thermometer;
    if (name.includes('humid')) return Droplets;
    return Activity;
  };

  const Icon = getSensorIcon();

  return (
    <div className={`glass-card rounded-2xl p-4 ${!device.isOnline ? 'opacity-40' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            device.isOnline ? 'bg-primary/20 text-primary-light' : 'bg-text-muted/10 text-text-muted'
          }`}>
            <Icon className="w-5 h-5" />
          </div>
          
          <div className="min-w-0">
            <h3 className="font-medium text-text text-sm truncate">{device.name}</h3>
            <p className="text-xs text-text-muted mt-0.5">{getSensorDisplay()}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {device.battery !== null && device.isOnline && (
            <BatteryIndicator battery={device.battery} />
          )}
          <span className="text-lg font-semibold text-text">{device.state}</span>
          <button
            onClick={onToggleExpand}
            className="p-1.5 rounded-lg hover:bg-primary/10 text-text-muted hover:text-primary transition-colors"
            aria-label={isExpanded ? 'Hide chart' : 'Show chart'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* History Chart */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-border animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-text-secondary">Last 48 Hours</span>
            <span className="text-xs text-text-muted">
              {history.length > 0 ? `${history.length} readings` : 'Loading...'}
            </span>
          </div>
          <SensorChart data={history} color="#FF6700" height={100} />
        </div>
      )}
    </div>
  );
}

function BatteryIndicator({ battery }: { battery: number }) {
  if (battery <= 20) {
    return (
      <div className="flex items-center gap-1 text-xs font-medium text-danger">
        <BatteryWarning className="w-3.5 h-3.5" />
        {battery}%
      </div>
    );
  }
  
  if (battery <= 40) {
    return (
      <div className="flex items-center gap-1 text-xs font-medium text-warning">
        <BatteryLow className="w-3.5 h-3.5" />
        {battery}%
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-xs font-medium text-success">
      <Battery className="w-3.5 h-3.5" />
      {battery}%
    </div>
  );
}
