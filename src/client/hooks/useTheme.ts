import { useState, useEffect, useCallback, useRef } from 'react';

interface TwilightData {
  dawn: string;
  dusk: string;
  sunrise: string;
  sunset: string;
}

type ThemeMode = 'auto' | 'light' | 'dark';

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function getCurrentMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function calculateProgress(twilight: TwilightData | null): number {
  if (!twilight) return 1; // Default to light if no twilight data

  const now = getCurrentMinutes();
  const dawn = timeToMinutes(twilight.dawn);
  const sunrise = timeToMinutes(twilight.sunrise);
  const sunset = timeToMinutes(twilight.sunset);
  const dusk = timeToMinutes(twilight.dusk);

  // Night (before dawn or after dusk)
  if (now < dawn || now >= dusk) {
    return 0;
  }

  // Dawn (dawn to sunrise) - transitioning to light
  if (now >= dawn && now < sunrise) {
    return (now - dawn) / (sunrise - dawn);
  }

  // Day (sunrise to sunset)
  if (now >= sunrise && now < sunset) {
    return 1;
  }

  // Dusk (sunset to dusk) - transitioning to dark
  if (now >= sunset && now < dusk) {
    return 1 - (now - sunset) / (dusk - sunset);
  }

  return 1;
}

// Global theme state for cross-component access
let globalMode: ThemeMode = (localStorage.getItem('theme-mode') as ThemeMode) || 'auto';
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach(listener => listener());
}

export function setThemeMode(mode: ThemeMode) {
  globalMode = mode;
  localStorage.setItem('theme-mode', mode);
  notifyListeners();
  window.dispatchEvent(new CustomEvent('themechange', { detail: mode }));
}

export function getThemeMode(): ThemeMode {
  return globalMode;
}

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(globalMode);
  const [progress, setProgress] = useState(1);
  const [twilight, setTwilight] = useState<TwilightData | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync with global state
  useEffect(() => {
    const handleChange = () => setMode(globalMode);
    listeners.add(handleChange);
    
    const handleEvent = (e: Event) => {
      const customEvent = e as CustomEvent<ThemeMode>;
      setMode(customEvent.detail);
    };
    window.addEventListener('themechange', handleEvent);
    
    return () => {
      listeners.delete(handleChange);
      window.removeEventListener('themechange', handleEvent);
    };
  }, []);

  const fetchTwilight = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
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
  }, []);

  const updateProgress = useCallback(() => {
    if (mode === 'light') {
      setProgress(1);
    } else if (mode === 'dark') {
      setProgress(0);
    } else {
      // Auto mode - calculate from twilight
      setProgress(calculateProgress(twilight));
    }
  }, [mode, twilight]);

  useEffect(() => {
    fetchTwilight();
    // Refresh twilight data every hour
    const twilightInterval = setInterval(fetchTwilight, 60 * 60 * 1000);
    return () => clearInterval(twilightInterval);
  }, [fetchTwilight]);

  useEffect(() => {
    updateProgress();
    
    // Update progress every minute
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(updateProgress, 60 * 1000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [updateProgress]);

  // Apply interpolated colors directly
  useEffect(() => {
    const p = progress;
    const inv = 1 - p;
    
    // Helper to interpolate between two rgba values
    const mix = (light: [number, number, number, number], dark: [number, number, number, number]) => {
      return `rgba(${Math.round(light[0] * p + dark[0] * inv)}, ${Math.round(light[1] * p + dark[1] * inv)}, ${Math.round(light[2] * p + dark[2] * inv)}, ${light[3] * p + dark[3] * inv})`;
    };
    
    const root = document.documentElement;
    
    // Background colors
    root.style.setProperty('--bg-color', mix([255, 255, 255, 1], [15, 23, 42, 1]));
    root.style.setProperty('--surface-color', mix([248, 250, 252, 0.8], [30, 41, 59, 0.7]));
    root.style.setProperty('--surface-hover-color', mix([255, 255, 255, 0.9], [30, 41, 59, 0.85]));
    
    // Text colors
    root.style.setProperty('--text-color', mix([30, 41, 59, 1], [248, 250, 252, 1]));
    root.style.setProperty('--text-secondary-color', mix([71, 85, 105, 1], [203, 213, 225, 1]));
    root.style.setProperty('--text-muted-color', mix([100, 116, 139, 1], [148, 163, 184, 1]));
    
    // Border colors
    root.style.setProperty('--border-color', mix([0, 0, 0, 0.1], [255, 255, 255, 0.1]));
    root.style.setProperty('--border-hover-color', mix([0, 0, 0, 0.15], [255, 255, 255, 0.2]));
    
    // Wallpaper overlay
    root.style.setProperty('--wallpaper-overlay', mix([255, 255, 255, 0.85], [15, 23, 42, 0.85]));
    
    // Primary color shift
    root.style.setProperty('--primary-color', mix([255, 103, 0, 1], [255, 133, 51, 1]));
  }, [progress]);

  const toggleMode = useCallback(() => {
    const next = mode === 'auto' ? 'light' : mode === 'light' ? 'dark' : 'auto';
    setThemeMode(next);
  }, [mode]);

  const isManual = mode !== 'auto';
  const isLight = progress > 0.5;

  return { mode, progress, toggleMode, setMode: setThemeMode, isManual, isLight };
}
