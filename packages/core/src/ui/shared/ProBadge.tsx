import React from 'react';
import { usePrefix } from '../../context';

export function ProBadge() {
  const p = usePrefix();
  return (
    <span className={`${p}-settings-pro-badge`}>PRO</span>
  );
}
