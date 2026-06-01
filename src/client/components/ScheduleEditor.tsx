import { useState, useEffect, useCallback, useRef } from 'react';
import { Clock, X, Sun, Moon, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

interface Schedule {
  id: number;
  deviceId: number;
  startTime: string;
  endTime: string;
  daysOfWeek: string;
  enabled: boolean;
}

interface TwilightData {
  dawn: string;
  dusk: string;
  sunrise: string;
  sunset: string;
}

interface ScheduleEditorProps {
  deviceId: number;
  deviceName: string;
  onClose: () => void;
  onSave: () => void;
}

export default function ScheduleEditor({ deviceId, deviceName, onClose, onSave }: ScheduleEditorProps) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [twilight, setTwilight] = useState<TwilightData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // New schedule form state
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('22:00');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);
  
  const token = localStorage.getItem('token');
  
  const fetchSchedules = useCallback(async () => {
    try {
      const response = await fetch(`/api/devices/${deviceId}/schedules`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setSchedules(data);
      }
    } catch (err) {
      console.error('Failed to fetch schedules:', err);
    }
  }, [deviceId, token]);
  
  const fetchTwilight = useCallback(async () => {
    try {
      const response = await fetch('/api/twilight', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        if (!data.error) {
          setTwilight(data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch twilight:', err);
    }
  }, [token]);
  
  useEffect(() => {
    Promise.all([fetchSchedules(), fetchTwilight()]).finally(() => setLoading(false));
  }, [fetchSchedules, fetchTwilight]);
  
  const handleCreateSchedule = async () => {
    try {
      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceId,
          startTime,
          endTime,
          daysOfWeek: selectedDays,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create schedule');
      }
      
      await fetchSchedules();
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create schedule');
    }
  };
  
  const handleDeleteSchedule = async (scheduleId: number) => {
    if (!confirm('Delete this schedule?')) return;
    
    try {
      const response = await fetch(`/api/schedules/${scheduleId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        await fetchSchedules();
        onSave();
      }
    } catch (err) {
      console.error('Failed to delete schedule:', err);
    }
  };
  
  const toggleDay = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  };
  
  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-text">Schedule for {deviceName}</h2>
            <button 
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-surface-hover transition-colors"
            >
              <X className="w-5 h-5 text-text-muted" />
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm">{error}</div>
          )}
          
          {/* Existing Schedules */}
          {schedules.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-text-secondary">Active Schedules</h3>
              {schedules.map(schedule => (
                <div key={schedule.id} className="glass-card rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="font-medium text-text">{schedule.startTime} - {schedule.endTime}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteSchedule(schedule.id)}
                      className="p-1.5 text-text-muted hover:text-danger transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex gap-1 mt-2">
                    {schedule.daysOfWeek.split(',').map((day) => (
                      <span key={day} className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-md">
                        {daysOfWeek[parseInt(day) - 1]}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* New Schedule Form */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-text-secondary">New Schedule</h3>
            
            {/* Time Slider Visualization */}
            <div className="relative h-16 bg-surface rounded-xl overflow-hidden">
              {/* Hour markers */}
              {[0, 6, 12, 18, 24].map(hour => (
                <div key={hour} className="absolute top-0 bottom-0 flex flex-col items-center justify-end pb-1"
                  style={{ left: `${(hour / 24) * 100}%`, transform: 'translateX(-50%)' }}
>
                  <span className="text-[10px] text-text-muted">{hour === 24 ? '00' : hour.toString().padStart(2, '0')}:00</span>
                </div>
              ))}
              
              {/* Twilight zones */}
              {twilight && (
                <>
                  <div 
                    className="absolute top-0 bottom-0 bg-blue-100/50"
                    style={{
                      left: `${(timeToMinutes(twilight.dawn) / 1440) * 100}%`,
                      width: `${((timeToMinutes(twilight.sunrise) - timeToMinutes(twilight.dawn)) / 1440) * 100}%`,
                    }}
                  />
                  <div 
                    className="absolute top-0 bottom-0 bg-blue-100/50"
                    style={{
                      left: `${(timeToMinutes(twilight.sunset) / 1440) * 100}%`,
                      width: `${((timeToMinutes(twilight.dusk) - timeToMinutes(twilight.sunset)) / 1440) * 100}%`,
                    }}
                  />
                </>
              )}
              
              {/* Night zone */}
              <div 
                className="absolute top-0 bottom-0 bg-indigo-100/30"
                style={{
                  left: `${(timeToMinutes(twilight?.dusk || '18:00') / 1440) * 100}%`,
                  width: `${((timeToMinutes(twilight?.dawn || '06:00') + 1440 - timeToMinutes(twilight?.dusk || '18:00')) / 1440) * 100}%`,
                }}
              />
              
              {/* Schedule range */}
              <div 
                className="absolute top-1/2 -translate-y-1/2 h-8 bg-primary/20 rounded-lg border-2 border-primary"
                style={{
                  left: `${(timeToMinutes(startTime) / 1440) * 100}%`,
                  width: `${((timeToMinutes(endTime) - timeToMinutes(startTime) + 1440) % 1440 / 1440) * 100}%`,
                }}
              />
              
              {/* Start handle */}
              <div 
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-8 bg-primary rounded-lg cursor-ew-resize shadow-md"
                style={{ left: `${(timeToMinutes(startTime) / 1440) * 100}%` }}
              />
              
              {/* End handle */}
              <div 
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-8 bg-primary rounded-lg cursor-ew-resize shadow-md"
                style={{ left: `${(timeToMinutes(endTime) / 1440) * 100}%` }}
              />
            </div>
            
            {/* Time Inputs */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-text-secondary mb-1">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-text"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-text-secondary mb-1">End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-text"
                />
              </div>
            </div>
            
            {/* Days of Week */}
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-2">Days</label>
              <div className="flex gap-1">
                {daysOfWeek.map((day, index) => (
                  <button
                    key={day}
                    onClick={() => toggleDay(index + 1)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                      selectedDays.includes(index + 1)
                        ? 'bg-primary text-white'
                        : 'glass-button text-text-muted'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Twilight Info */}
            {twilight && (
              <div className="flex items-center gap-4 text-xs text-text-muted">
                <div className="flex items-center gap-1">
                  <Sun className="w-3 h-3 text-warning" />
                  <span>Dawn {twilight.dawn}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Sun className="w-3 h-3 text-primary" />
                  <span>Sunrise {twilight.sunrise}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Moon className="w-3 h-3 text-secondary" />
                  <span>Sunset {twilight.sunset}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Moon className="w-3 h-3 text-text-muted" />
                  <span>Dusk {twilight.dusk}</span>
                </div>
              </div>
            )}
            
            <button
              onClick={handleCreateSchedule}
              className="w-full py-3 rounded-xl glass-button-primary text-white font-medium flex items-center justify-center gap-2"
            >
              <CalendarDays className="w-4 h-4" />
              Create Schedule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
