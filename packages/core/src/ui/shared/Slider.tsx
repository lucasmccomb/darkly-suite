import React from 'react';
import { usePrefix } from '../../context';

interface SliderProps {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  unit?: string;
  disabled?: boolean;
}

export function Slider({
  label,
  min,
  max,
  value,
  onChange,
  unit = '',
  disabled = false,
}: SliderProps) {
  const p = usePrefix();
  const id = `${p}-slider-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={`${p}-settings-slider`}>
      <div className={`${p}-settings-slider-header`}>
        <label className={`${p}-settings-slider-label`} htmlFor={id}>
          {label}
        </label>
        <span className={`${p}-settings-slider-value`}>
          {value}{unit}
        </span>
      </div>
      <input
        id={id}
        type="range"
        className={`${p}-settings-slider-input`}
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
      />
    </div>
  );
}
