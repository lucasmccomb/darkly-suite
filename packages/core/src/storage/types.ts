export type ThemeMode = 'light' | 'dark' | 'system' | 'schedule' | 'sunrise-sunset';

export type PresetName = 'default' | 'nord' | 'solarized' | 'monokai' | 'catppuccin' | 'rose-pine';

export interface ScheduleConfig {
  startHour: number; // 0-23
  endHour: number; // 0-23
}

export interface SunriseSunsetConfig {
  enabled: boolean;
  lat: number | null;
  lng: number | null;
  lastSunrise: string | null;
  lastSunset: string | null;
  lastFetched: string | null;
}

export interface BaseUserPreferences {
  mode: ThemeMode;
  preset: PresetName;
  schedule: ScheduleConfig;
  sunriseSunset: SunriseSunsetConfig;
  enabled: boolean;
}

export const DEFAULT_PREFERENCES: BaseUserPreferences = {
  mode: 'system',
  preset: 'default',
  schedule: {
    startHour: 20,
    endHour: 7,
  },
  sunriseSunset: {
    enabled: false,
    lat: null,
    lng: null,
    lastSunrise: null,
    lastSunset: null,
    lastFetched: null,
  },
  enabled: true,
};
