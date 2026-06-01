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

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('theme-mode');
    return (saved as ThemeMode) || 'auto';
  });
  const [progress, setProgress] = useState(1);
  const [twilight, setTwilight] = useState<TwilightData | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // Apply progress to CSS custom property
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-progress', progress.toString());
  }, [progress]);

  const toggleMode = useCallback(() => {
    setMode(prev => {
      const next = prev === 'auto' ? 'light' : prev === 'light' ? 'dark' : 'auto';
      localStorage.setItem('theme-mode', next);
      return next;
    });
  }, []);

  const isManual = mode !== 'auto';
  const isLight = progress > 0.5;

  return { mode, progress, toggleMode, isManual, isLight };
}
