export type ThemeMode = 'light' | 'dark' | 'system' | 'schedule' | 'sunrise-sunset';

export type PresetName = 'default' | 'nord' | 'solarized' | 'monokai' | 'catppuccin' | 'rose-pine';

export interface ScheduleConfig {
  startHour: number; // 0-23
  endHour: number; // 0-23
}

export interface NightTintConfig {
  enabled: boolean;
  startHour: number;
  endHour: number;
  intensity: number; // 0-100
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
  nightTint: NightTintConfig;
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
  nightTint: {
    enabled: false,
    startHour: 22,
    endHour: 6,
    intensity: 50,
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
