import React from 'react';
import { usePrefix } from '../../context';

interface ActionButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'default' | 'compact';
  fullWidth?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export function ActionButton({
  variant = 'primary',
  size = 'default',
  fullWidth = false,
  disabled = false,
  onClick,
  children,
}: ActionButtonProps) {
  const p = usePrefix();

  const classes = [
    `${p}-action-btn`,
    `${p}-action-btn--${variant}`,
    size === 'compact' ? `${p}-action-btn--compact` : '',
    fullWidth ? `${p}-action-btn--full` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={classes}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
