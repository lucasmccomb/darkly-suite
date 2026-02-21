import { useState, useId } from 'react';
import { ActionButton } from './shared/ActionButton';
import { Wordmark } from './shared/Wordmark';
import { X } from 'lucide-react';
import { usePrefix, useDarklyConfig } from '../context';
import type { PriceInfo } from '../payment/client';

type Plan = 'monthly' | 'yearly' | 'lifetime';

const INDIVIDUAL_PLANS: { id: Plan; name: string; price: string; period: string; subtitle: string }[] = [
  { id: 'monthly', name: 'Monthly', price: '$0.99', period: '/mo', subtitle: 'Cancel anytime' },
  { id: 'yearly', name: 'Yearly', price: '$9.99', period: '/yr', subtitle: 'Save 16%' },
  { id: 'lifetime', name: 'Lifetime', price: '$29.99', period: '', subtitle: 'One-time' },
];

const SUITE_PLANS: typeof INDIVIDUAL_PLANS = [
  { id: 'monthly', name: 'Monthly', price: '$2.99', period: '/mo', subtitle: 'Cancel anytime' },
  { id: 'yearly', name: 'Yearly', price: '$29.99', period: '/yr', subtitle: 'Save 16%' },
  { id: 'lifetime', name: 'Lifetime', price: '$49.99', period: '', subtitle: 'One-time' },
];

interface PaywallProps {
  onSubscribe: (plan: Plan) => void;
  onClose?: () => void;
  prices?: PriceInfo;
}

export function Paywall({ onSubscribe, onClose, prices }: PaywallProps) {
  const p = usePrefix();
  const uid = useId();
  const config = useDarklyConfig();
  const [selectedPlan, setSelectedPlan] = useState<Plan>('yearly');

  const siteBase = config.siteBase || 'https://darklysuite.com';
  const plans = config.productId === 'suite' ? SUITE_PLANS : INDIVIDUAL_PLANS;

  return (
    <div className={`${p}-settings-panel`}>
      <div className={`${p}-settings-header`}>
        <h2 className={`${p}-settings-title`}><Wordmark /> <span className={`${p}-settings-title-suffix`}>{config.productName.replace('Darkly ', '')}</span></h2>
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
        <h3 className={`${p}-paywall-title`}>Choose your <Wordmark /> plan:</h3>
        <div className={`${p}-paywall-plans`}>
          {plans.map((plan) => (
            <button
              key={plan.id}
              type="button"
              className={`${p}-paywall-plan ${selectedPlan === plan.id ? `${p}-paywall-plan--selected` : ''}`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              <span className={`${p}-paywall-plan-name`}>{plan.name}</span>
              <span className={`${p}-paywall-plan-price`}>
                {prices?.[plan.id] ?? plan.price}<span className={`${p}-paywall-plan-period`}>{plan.period}</span>
              </span>
              <span className={`${p}-paywall-plan-subtitle`}>{plan.subtitle}</span>
            </button>
          ))}
        </div>
        <ActionButton fullWidth onClick={() => onSubscribe(selectedPlan)}>
          Subscribe Now
        </ActionButton>
        <a
          href={siteBase}
          target="_blank"
          rel="noopener noreferrer"
          className={`${p}-paywall-learn-more`}
        >
          Learn more
        </a>
        <div className={`${p}-paywall-footer`}>
          <div className={`${p}-paywall-icon`}>
            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="32" height="32">
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
          <a
            href="mailto:admin@darklysuite.com"
            className={`${p}-paywall-support`}
          >
            admin@darklysuite.com
          </a>
        </div>
      </div>
    </div>
  );
}
