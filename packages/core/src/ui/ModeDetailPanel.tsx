import React from 'react';
import { Moon, Monitor, Palette } from 'lucide-react';
import type { ThemeMode, BaseUserPreferences } from '../storage/types';
import { ScheduleConfig } from './ScheduleConfig';
import { SunriseSunsetConfig } from './SunriseSunsetConfig';
import { usePrefix } from '../context';

interface ModeDetailPanelProps {
  mode: ThemeMode;
  prefs: BaseUserPreferences;
  updatePrefs: (patch: Partial<BaseUserPreferences>) => void;
}

export function ModeDetailPanel({ mode, prefs, updatePrefs }: ModeDetailPanelProps) {
  const p = usePrefix();

  if (mode === 'dark') {
    return (
      <div className={`${p}-settings-mode-icon-display`}>
        <Moon size={64} strokeWidth={1.2} />
        <span className={`${p}-settings-mode-icon-label`}>Dark</span>
      </div>
    );
  }

  if (mode === 'system') {
    return (
      <div className={`${p}-settings-mode-icon-display`}>
        <Monitor size={64} strokeWidth={1.2} />
        <span className={`${p}-settings-mode-icon-label`}>System</span>
      </div>
    );
  }

  if (mode === 'light') {
    return (
      <div className={`${p}-settings-mode-icon-display`}>
        <Palette size={64} strokeWidth={1.2} />
        <span className={`${p}-settings-mode-icon-label`}>Default</span>
      </div>
    );
  }

  if (mode === 'schedule') {
    return (
      <div className={`${p}-settings-detail-config`}>
        <ScheduleConfig
          active
          inline
          schedule={prefs.schedule}
          onScheduleChange={(schedule) => updatePrefs({ schedule })}
        />
      </div>
    );
  }

  if (mode === 'sunrise-sunset') {
    return (
      <div className={`${p}-settings-detail-config`}>
        <SunriseSunsetConfig
          active
          inline
          config={prefs.sunriseSunset}
          onChange={(sunriseSunset) => updatePrefs({ sunriseSunset })}
        />
      </div>
    );
  }

  return null;
}
