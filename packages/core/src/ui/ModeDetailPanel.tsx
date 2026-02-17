import React from 'react';
import type { ThemeMode, BaseUserPreferences, ScheduleConfig as ScheduleConfigType, SunriseSunsetConfig as SunriseSunsetConfigType } from '../storage/types';
import { ScheduleConfig } from './ScheduleConfig';
import { SunriseSunsetConfig } from './SunriseSunsetConfig';
import { usePrefix } from '../context';
import { Moon, Monitor, Palette, type LucideIcon } from 'lucide-react';

const MODE_ICONS: Record<string, { icon: LucideIcon; label: string }> = {
  dark: { icon: Moon, label: 'Dark' },
  system: { icon: Monitor, label: 'System' },
  light: { icon: Palette, label: 'Default' },
};

interface ModeDetailPanelProps {
  mode: ThemeMode;
  prefs: BaseUserPreferences;
  updatePrefs: (patch: Partial<BaseUserPreferences>) => void;
}

export function ModeDetailPanel({ mode, prefs, updatePrefs }: ModeDetailPanelProps) {
  const p = usePrefix();

  if (mode === 'schedule') {
    return (
      <div className={`${p}-settings-detail-config`}>
        <ScheduleConfig
          schedule={prefs.schedule}
          onScheduleChange={(schedule: ScheduleConfigType) => updatePrefs({ schedule })}
        />
      </div>
    );
  }

  if (mode === 'sunrise-sunset') {
    return (
      <div className={`${p}-settings-detail-config`}>
        <SunriseSunsetConfig
          config={prefs.sunriseSunset}
          onChange={(sunriseSunset: SunriseSunsetConfigType) => updatePrefs({ sunriseSunset })}
        />
      </div>
    );
  }

  const entry = MODE_ICONS[mode] ?? MODE_ICONS.system;
  const Icon = entry.icon;

  return (
    <div className={`${p}-settings-mode-icon-display`}>
      <Icon size={64} strokeWidth={1.2} />
      <span className={`${p}-settings-mode-icon-label`}>{entry.label}</span>
    </div>
  );
}
