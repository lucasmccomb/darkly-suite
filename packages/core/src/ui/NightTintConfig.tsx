import React from 'react';
import type { NightTintConfig as NightTintConfigType } from '../storage/types';
import { Toggle } from './shared/Toggle';
import { TimeRangePicker } from './shared/TimeRangePicker';
import { Slider } from './shared/Slider';
import { usePrefix } from '../context';

interface NightTintConfigProps {
  config: NightTintConfigType;
  onChange: (config: NightTintConfigType) => void;
}

export function NightTintConfig({ config, onChange }: NightTintConfigProps) {
  const p = usePrefix();

  return (
    <div className={`${p}-settings-section`}>
      <h3 className={`${p}-settings-section-title`}>Night Tint</h3>
      <p className={`${p}-settings-hint`}>
        Apply a warm tint to reduce blue light at night.
      </p>
      <Toggle
        label="Enable night tint"
        checked={config.enabled}
        onChange={(enabled) => onChange({ ...config, enabled })}
      />
      {config.enabled && (
        <div className={`${p}-settings-subsection`}>
          <TimeRangePicker
            startHour={config.startHour}
            endHour={config.endHour}
            onStartChange={(startHour) => onChange({ ...config, startHour })}
            onEndChange={(endHour) => onChange({ ...config, endHour })}
          />
          <Slider
            label="Intensity"
            min={0}
            max={100}
            value={config.intensity}
            onChange={(intensity) => onChange({ ...config, intensity })}
            unit="%"
          />
        </div>
      )}
    </div>
  );
}
