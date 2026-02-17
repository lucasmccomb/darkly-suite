import React from 'react';
import { Moon, Monitor, Palette, Clock, SunMoon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ThemeMode } from '../storage/types';
import { usePrefix } from '../context';

interface ThemeModeSelectorProps {
  mode: ThemeMode;
  onChange: (mode: ThemeMode) => void;
}

const MODE_OPTIONS: { value: ThemeMode; label: string; icon: LucideIcon }[] = [
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'light', label: 'Default', icon: Palette },
  { value: 'schedule', label: 'Schedule', icon: Clock },
  { value: 'sunrise-sunset', label: 'Sunrise/Sunset', icon: SunMoon },
];

export function ThemeModeSelector({ mode, onChange }: ThemeModeSelectorProps) {
  const p = usePrefix();

  return (
    <div className={`${p}-settings-section`}>
      <h3 className={`${p}-settings-section-title`}>Theme Mode</h3>
      <div className={`${p}-settings-mode-group`}>
        {MODE_OPTIONS.map((option) => {
          const Icon = option.icon;
          return (
            <label
              key={option.value}
              className={`${p}-settings-mode-option ${mode === option.value ? `${p}-settings-mode-option--selected` : ''}`}
            >
              <input
                type="radio"
                name={`${p}-theme-mode`}
                value={option.value}
                checked={mode === option.value}
                onChange={() => onChange(option.value)}
                className={`${p}-settings-mode-radio`}
              />
              <span className={`${p}-settings-mode-option-icon`}>
                <Icon size={16} />
              </span>
              <span className={`${p}-settings-mode-label`}>{option.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
