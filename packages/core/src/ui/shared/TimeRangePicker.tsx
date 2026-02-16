import React from 'react';
import { usePrefix } from '../../context';

interface TimeRangePickerProps {
  startHour: number;
  endHour: number;
  onStartChange: (hour: number) => void;
  onEndChange: (hour: number) => void;
  disabled?: boolean;
}

function formatHour(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const h = hour % 12 || 12;
  return `${h}:00 ${period}`;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function TimeRangePicker({
  startHour,
  endHour,
  onStartChange,
  onEndChange,
  disabled = false,
}: TimeRangePickerProps) {
  const p = usePrefix();

  return (
    <div className={`${p}-settings-time-range`}>
      <div className={`${p}-settings-time-range-field`}>
        <label className={`${p}-settings-time-range-label`}>Start</label>
        <select
          className={`${p}-settings-time-range-select`}
          value={startHour}
          onChange={(e) => onStartChange(Number(e.target.value))}
          disabled={disabled}
        >
          {HOURS.map((h) => (
            <option key={h} value={h}>
              {formatHour(h)}
            </option>
          ))}
        </select>
      </div>
      <div className={`${p}-settings-time-range-field`}>
        <label className={`${p}-settings-time-range-label`}>End</label>
        <select
          className={`${p}-settings-time-range-select`}
          value={endHour}
          onChange={(e) => onEndChange(Number(e.target.value))}
          disabled={disabled}
        >
          {HOURS.map((h) => (
            <option key={h} value={h}>
              {formatHour(h)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
