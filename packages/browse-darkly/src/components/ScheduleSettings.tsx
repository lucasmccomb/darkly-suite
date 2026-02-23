import React, { useEffect, useState } from 'react';
import type { ThemeMode, ScheduleConfig, SunriseSunsetConfig } from '@darkly/core';
import { DEFAULT_PREFERENCES } from '@darkly/core';

const STORAGE_KEY = 'bd_preferences';

interface Preferences {
  mode: ThemeMode;
  schedule: ScheduleConfig;
  sunriseSunset: SunriseSunsetConfig;
}

const modeOptions: { value: ThemeMode; label: string; description: string }[] = [
  { value: 'dark', label: 'Manual (Always Dark)', description: 'Dark mode is always on' },
  { value: 'light', label: 'Manual (Always Light)', description: 'Dark mode is always off' },
  { value: 'system', label: 'System Theme', description: 'Follow your OS dark/light setting' },
  { value: 'schedule', label: 'Schedule', description: 'Dark mode between specific hours' },
  { value: 'sunrise-sunset', label: 'Sunrise / Sunset', description: 'Dark mode based on your location' },
];

const hours = Array.from({ length: 24 }, (_, i) => i);

function formatHour(h: number): string {
  if (h === 0) return '12:00 AM';
  if (h === 12) return '12:00 PM';
  if (h < 12) return `${h}:00 AM`;
  return `${h - 12}:00 PM`;
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
  },
  heading: {
    fontSize: 14,
    fontWeight: 600 as const,
    color: '#e0e0e0',
    margin: '0 0 4px',
  },
  subtext: {
    fontSize: 12,
    color: '#888',
    margin: '0 0 4px',
  },
  modeList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
  },
  modeOption: {
    display: 'flex',
    alignItems: 'center' as const,
    gap: 10,
    padding: '8px 10px',
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'background 0.15s',
    border: '1px solid transparent',
  },
  modeOptionSelected: {
    background: '#2a2a4a',
    borderColor: '#8ab4f8',
  },
  modeOptionHover: {
    background: '#1e1e3a',
  },
  radio: {
    width: 16,
    height: 16,
    borderRadius: '50%',
    border: '2px solid #44446a',
    display: 'flex',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flexShrink: 0,
  },
  radioSelected: {
    borderColor: '#8ab4f8',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#8ab4f8',
  },
  modeLabel: {
    fontSize: 13,
    color: '#e0e0e0',
    fontWeight: 500 as const,
  },
  modeDesc: {
    fontSize: 11,
    color: '#888',
  },
  section: {
    background: '#1e1e3a',
    borderRadius: 8,
    padding: 12,
    border: '1px solid #44446a',
  },
  sectionLabel: {
    fontSize: 13,
    color: '#e0e0e0',
    fontWeight: 500 as const,
    marginBottom: 8,
  },
  timeRow: {
    display: 'flex',
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 6,
  },
  timeLabel: {
    fontSize: 12,
    color: '#888',
  },
  select: {
    background: '#16213e',
    color: '#e0e0e0',
    border: '1px solid #44446a',
    borderRadius: 6,
    padding: '4px 8px',
    fontSize: 13,
    cursor: 'pointer',
    outline: 'none',
  },
  button: {
    background: '#16213e',
    border: '1px solid #44446a',
    borderRadius: 6,
    padding: '8px 12px',
    color: '#e0e0e0',
    fontSize: 13,
    cursor: 'pointer',
    transition: 'background 0.15s',
    width: '100%',
    textAlign: 'center' as const,
  },
  locationInfo: {
    fontSize: 11,
    color: '#888',
    marginTop: 6,
  },
  successText: {
    fontSize: 12,
    color: '#8ab4f8',
    marginTop: 6,
  },
};

export function ScheduleSettings() {
  const [mode, setMode] = useState<ThemeMode>(DEFAULT_PREFERENCES.mode);
  const [schedule, setSchedule] = useState<ScheduleConfig>(DEFAULT_PREFERENCES.schedule);
  const [sunriseSunset, setSunriseSunset] = useState<SunriseSunsetConfig>(DEFAULT_PREFERENCES.sunriseSunset);
  const [hoveredMode, setHoveredMode] = useState<ThemeMode | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      const prefs = result[STORAGE_KEY] as Partial<Preferences> | undefined;
      if (prefs) {
        if (prefs.mode) setMode(prefs.mode);
        if (prefs.schedule) setSchedule(prefs.schedule);
        if (prefs.sunriseSunset) setSunriseSunset(prefs.sunriseSunset);
      }
    });
  }, []);

  const savePrefs = (update: Partial<Preferences>) => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      const prefs = result[STORAGE_KEY] || {};
      chrome.storage.local.set({ [STORAGE_KEY]: { ...prefs, ...update } });
    });
  };

  const handleModeChange = (newMode: ThemeMode) => {
    setMode(newMode);
    savePrefs({ mode: newMode });
  };

  const handleScheduleChange = (field: keyof ScheduleConfig, value: number) => {
    const updated = { ...schedule, [field]: value };
    setSchedule(updated);
    savePrefs({ schedule: updated });
  };

  const handleGetLocation = () => {
    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const updated: SunriseSunsetConfig = {
          ...sunriseSunset,
          enabled: true,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setSunriseSunset(updated);
        savePrefs({ sunriseSunset: updated });
        setLocationStatus('success');
      },
      () => {
        setLocationStatus('error');
      }
    );
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>Auto Dark Mode</h3>
      <p style={styles.subtext}>Control when dark mode activates.</p>

      <div style={styles.modeList}>
        {modeOptions.map((opt) => {
          const isSelected = mode === opt.value;
          const isHovered = hoveredMode === opt.value;
          return (
            <div
              key={opt.value}
              style={{
                ...styles.modeOption,
                ...(isSelected ? styles.modeOptionSelected : {}),
                ...(isHovered && !isSelected ? styles.modeOptionHover : {}),
              }}
              onClick={() => handleModeChange(opt.value)}
              onMouseEnter={() => setHoveredMode(opt.value)}
              onMouseLeave={() => setHoveredMode(null)}
            >
              <div
                style={{
                  ...styles.radio,
                  ...(isSelected ? styles.radioSelected : {}),
                }}
              >
                {isSelected && <div style={styles.radioDot} />}
              </div>
              <div>
                <div style={styles.modeLabel}>{opt.label}</div>
                <div style={styles.modeDesc}>{opt.description}</div>
              </div>
            </div>
          );
        })}
      </div>

      {mode === 'schedule' && (
        <div style={styles.section}>
          <div style={styles.sectionLabel}>Schedule</div>
          <div style={styles.timeRow}>
            <span style={styles.timeLabel}>Dark mode starts</span>
            <select
              style={styles.select}
              value={schedule.startHour}
              onChange={(e) => handleScheduleChange('startHour', Number(e.target.value))}
            >
              {hours.map((h) => (
                <option key={h} value={h}>{formatHour(h)}</option>
              ))}
            </select>
          </div>
          <div style={styles.timeRow}>
            <span style={styles.timeLabel}>Dark mode ends</span>
            <select
              style={styles.select}
              value={schedule.endHour}
              onChange={(e) => handleScheduleChange('endHour', Number(e.target.value))}
            >
              {hours.map((h) => (
                <option key={h} value={h}>{formatHour(h)}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {mode === 'sunrise-sunset' && (
        <div style={styles.section}>
          <div style={styles.sectionLabel}>Location</div>
          {sunriseSunset.lat !== null && sunriseSunset.lng !== null ? (
            <>
              <div style={styles.successText}>
                Location set ({sunriseSunset.lat.toFixed(2)}, {sunriseSunset.lng.toFixed(2)})
              </div>
              <button
                style={{ ...styles.button, marginTop: 8 }}
                onClick={handleGetLocation}
              >
                Update Location
              </button>
            </>
          ) : (
            <>
              <p style={styles.locationInfo}>
                Allow location access so dark mode can follow sunrise and sunset times.
              </p>
              <button
                style={styles.button}
                onClick={handleGetLocation}
              >
                {locationStatus === 'loading' ? 'Getting location...' : 'Use My Location'}
              </button>
              {locationStatus === 'error' && (
                <div style={{ ...styles.locationInfo, color: '#f88' }}>
                  Could not get location. Please allow location access and try again.
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
