import React, { useId } from 'react';
import { ActionButton } from './shared/ActionButton';
import { Wordmark } from './shared/Wordmark';
import { X } from 'lucide-react';
import { usePrefix } from '../context';
import type { PriceInfo } from '../payment/client';

interface PaywallProps {
  onSubscribe: () => void;
  onClose?: () => void;
  prices?: PriceInfo;
}

export function Paywall({ onSubscribe, onClose, prices }: PaywallProps) {
  const p = usePrefix();
  const uid = useId();

  return (
    <div className={`${p}-settings-panel`}>
      <div className={`${p}-settings-header`}>
        <h2 className={`${p}-settings-title`}><Wordmark /></h2>
        {onClose && (
          <div className={`${p}-settings-header-actions`}>
            <button
              type="button"
              className={`${p}-settings-close-btn`}
              onClick={onClose}
              aria-label="Close settings panel"
            >
              <X size={22} />
            </button>
          </div>
        )}
      </div>
      <div className={`${p}-paywall`}>
        <div className={`${p}-paywall-icon`}>
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="48" height="48">
            <defs>
              <linearGradient id={`${uid}-g`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f5c842" />
                <stop offset="100%" stopColor="#d4941c" />
              </linearGradient>
              <mask id={`${uid}-m`}>
                <rect width="32" height="32" fill="white" />
                <circle cx="12" cy="20" r="5" fill="black" />
                <circle cx="14.5" cy="19" r="4.5" fill="white" />
                <path d="M15.5,16.0L15.9,18.6L18.5,19.0L15.9,19.4L15.5,22.0L15.1,19.4L12.5,19.0L15.1,18.6Z" fill="black" />
              </mask>
              <filter id={`${uid}-glow`} x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="0.5" stdDeviation="2.5" floodColor="white" floodOpacity="0.4" />
              </filter>
            </defs>
            <g filter={`url(#${uid}-glow)`}>
              <path d="M5.0,5.5L5.9,9.1L9.5,10.0L5.9,10.9L5.0,14.5L4.1,10.9L0.5,10.0L4.1,9.1Z" fill={`url(#${uid}-g)`} />
              <rect x="19" y="4" width="3.8" height="24" rx="1.9" fill={`url(#${uid}-g)`} />
              <circle cx="13.5" cy="20" r="8" fill={`url(#${uid}-g)`} mask={`url(#${uid}-m)`} />
            </g>
          </svg>
        </div>
        <h3 className={`${p}-paywall-title`}>Subscribe to use <Wordmark /></h3>
        <p className={`${p}-paywall-description`}>
          Dark mode with theme presets, sunrise/sunset scheduling, and night vision.
          Choose a plan to get started.
        </p>
        <div className={`${p}-paywall-plans`}>
          <div className={`${p}-paywall-plan`}>{prices?.monthly ?? '$0.99'}/mo</div>
          <div className={`${p}-paywall-plan ${p}-paywall-plan--highlight`}>{prices?.yearly ?? '$9.99'}/yr</div>
          <div className={`${p}-paywall-plan`}>{prices?.lifetime ?? '$29.99'} lifetime</div>
        </div>
        <ActionButton fullWidth onClick={onSubscribe}>
          Subscribe Now
        </ActionButton>
      </div>
    </div>
  );
}
