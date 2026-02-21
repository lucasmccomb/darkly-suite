import React from 'react';
import { usePrefix } from '../context';

interface UpgradeBannerProps {
  onUpgrade: () => void;
}

export function UpgradeBanner({ onUpgrade }: UpgradeBannerProps) {
  const p = usePrefix();

  return (
    <div className={`${p}-settings-upgrade-banner`}>
      <div className={`${p}-settings-upgrade-content`}>
        <span className={`${p}-settings-upgrade-title`}>Unlock Darkly Pro</span>
        <p className={`${p}-settings-upgrade-description`}>
          Get access to all dark mode features with Darkly Pro.
        </p>
      </div>
      <button
        type="button"
        className={`${p}-settings-upgrade-button`}
        onClick={onUpgrade}
      >
        Upgrade
      </button>
    </div>
  );
}
