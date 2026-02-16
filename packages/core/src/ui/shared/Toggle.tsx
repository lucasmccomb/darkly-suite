import React from 'react';
import { usePrefix } from '../../context';

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function Toggle({ label, checked, onChange, disabled = false }: ToggleProps) {
  const p = usePrefix();
  const id = `${p}-toggle-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={`${p}-settings-toggle`}>
      <label className={`${p}-settings-toggle-label`} htmlFor={id}>
        {label}
      </label>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        className={`${p}-settings-toggle-switch ${checked ? `${p}-settings-toggle-switch--on` : ''}`}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        type="button"
      >
        <span className={`${p}-settings-toggle-knob`} />
      </button>
    </div>
  );
}
