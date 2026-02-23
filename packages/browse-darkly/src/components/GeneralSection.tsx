import React, { useEffect, useState } from 'react';
import type { ThemeMode, ScheduleConfig, SunriseSunsetConfig } from '@darkly/core';
import { DEFAULT_PREFERENCES } from '@darkly/core';

const STORAGE_KEY = 'bd_preferences';

interface Preferences {
  mode: ThemeMode;
  schedule: ScheduleConfig;
  sunriseSunset: SunriseSunsetConfig;
}

interface GeneralSectionProps {
  currentDomain: string;
  darkEnabled: boolean;
  onDarkEnabledChange: (enabled: boolean) => void;
}

const modeOptions: { value: ThemeMode; label: string; description: string }[] = [
  { value: 'dark', label: 'Always Dark', description: 'Dark mode is always on' },
  { value: 'light', label: 'Always Light', description: 'Dark mode is always off' },
  { value: 'system', label: 'System Theme', description: 'Follow your OS setting' },
  { value: 'schedule', label: 'Schedule', description: 'Dark mode between specific hours' },
  { value: 'sunrise-sunset', label: 'Sunrise / Sunset', description: 'Based on your location' },
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
  toggleRow: {
    display: 'flex',
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: '4px 0',
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: 500 as const,
    color: '#e0e0e0',
  },
  toggle: {
    position: 'relative' as const,
    width: 40,
    height: 22,
    borderRadius: 11,
    cursor: 'pointer',
    transition: 'background 0.2s',
    borderWidth: 0,
    borderStyle: 'none' as const,
    borderColor: 'transparent',
    padding: 0,
    flexShrink: 0,
  },
  toggleKnob: {
    position: 'absolute' as const,
    top: 2,
    width: 18,
    height: 18,
    borderRadius: '50%',
    background: '#fff',
    transition: 'left 0.2s',
  },
  divider: {
    borderTopWidth: 1,
    borderTopStyle: 'solid' as const,
    borderTopColor: '#44446a',
    margin: '4px 0',
  },
  sectionLabel: {
    fontSize: 12,
    color: '#888',
    fontWeight: 500 as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  modeList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
  },
  modeOption: {
    display: 'flex',
    alignItems: 'center' as const,
    gap: 10,
    padding: '6px 8px',
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'background 0.15s',
    borderWidth: 1,
    borderStyle: 'solid' as const,
    borderColor: 'transparent',
  },
  modeOptionSelected: {
    background: '#2a2a4a',
    borderColor: '#8ab4f8',
  },
  modeOptionHover: {
    background: '#1e1e3a',
  },
  radio: {
    width: 14,
    height: 14,
    borderRadius: '50%',
    borderWidth: 2,
    borderStyle: 'solid' as const,
    borderColor: '#44446a',
    display: 'flex',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flexShrink: 0,
  },
  radioSelected: {
    borderColor: '#8ab4f8',
  },
  radioDot: {
    width: 6,
    height: 6,
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
  inlineSection: {
    background: '#1e1e3a',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderStyle: 'solid' as const,
    borderColor: '#44446a',
  },
  inlineLabel: {
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
    borderWidth: 1,
    borderStyle: 'solid' as const,
    borderColor: '#44446a',
    borderRadius: 6,
    padding: '4px 8px',
    fontSize: 13,
    cursor: 'pointer',
    outline: 'none',
  },
  button: {
    background: '#16213e',
    borderWidth: 1,
    borderStyle: 'solid' as const,
    borderColor: '#44446a',
    borderRadius: 6,
    padding: '8px 12px',
    color: '#e0e0e0',
    fontSize: 13,
    cursor: 'pointer',
    transition: 'background 0.15s',
    width: '100%',
    textAlign: 'center' as const,
    fontFamily: 'inherit',
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

export function GeneralSection({ currentDomain: _currentDomain, darkEnabled, onDarkEnabledChange }: GeneralSectionProps) {
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

  const handleToggle = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, { type: 'bd:toggle' }, (response) => {
          if (chrome.runtime.lastError) return;
          if (response) onDarkEnabledChange(response.enabled);
        });
      }
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
      {/* Dark mode toggle */}
      <div style={styles.toggleRow}>
        <span style={styles.toggleLabel}>Dark mode</span>
        <button
          style={{
            ...styles.toggle,
            background: darkEnabled ? '#8ab4f8' : '#44446a',
          }}
          onClick={handleToggle}
          aria-label="Toggle dark mode"
        >
          <div
            style={{
              ...styles.toggleKnob,
              left: darkEnabled ? 20 : 2,
            }}
          />
        </button>
      </div>

      <div style={styles.divider} />

      {/* Mode selector */}
      <div style={styles.sectionLabel}>Mode</div>
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

      {/* Schedule settings */}
      {mode === 'schedule' && (
        <div style={styles.inlineSection}>
          <div style={styles.inlineLabel}>Schedule</div>
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

      {/* Sunrise/Sunset settings */}
      {mode === 'sunrise-sunset' && (
        <div style={styles.inlineSection}>
          <div style={styles.inlineLabel}>Location</div>
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
