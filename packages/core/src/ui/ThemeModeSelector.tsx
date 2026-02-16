import React from 'react';
import type { ThemeMode } from '../storage/types';
import { usePrefix } from '../context';

interface ThemeModeSelectorProps {
  mode: ThemeMode;
  onChange: (mode: ThemeMode) => void;
}

const MODE_OPTIONS: { value: ThemeMode; label: string; description: string }[] = [
  { value: 'system', label: 'System', description: 'Follow OS preference' },
  { value: 'dark', label: 'Dark', description: 'Always use dark theme' },
  { value: 'sunrise-sunset', label: 'Sunrise/Sunset', description: 'Follow the sun' },
  { value: 'schedule', label: 'Schedule', description: 'Dark mode on a timer' },
  { value: 'light', label: 'Default', description: 'Theme selected in app settings' },
];

export function ThemeModeSelector({ mode, onChange }: ThemeModeSelectorProps) {
  const p = usePrefix();

  return (
    <div className={`${p}-settings-section`}>
      <h3 className={`${p}-settings-section-title`}>Theme Mode</h3>
      <div className={`${p}-settings-mode-group`}>
        {MODE_OPTIONS.map((option) => (
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
            <div className={`${p}-settings-mode-content`}>
              <span className={`${p}-settings-mode-label`}>{option.label}</span>
              <span className={`${p}-settings-mode-description`}>{option.description}</span>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
