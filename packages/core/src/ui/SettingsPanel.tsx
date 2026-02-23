import React, { useEffect, useState, useCallback } from 'react';
import type { BaseUserPreferences, ThemeMode } from '../storage/types';
import { DEFAULT_PREFERENCES } from '../storage/types';
import { createPreferencesManager } from '../storage/preferences';
import { ThemeModeSelector } from './ThemeModeSelector';
import { ModeDetailPanel } from './ModeDetailPanel';
import { Paywall } from './Paywall';
import { Toggle } from './shared/Toggle';
import { Wordmark } from './shared/Wordmark';
import { usePrefix, useDarklyConfig } from '../context';
import { X } from 'lucide-react';
import type { PriceInfo } from '../payment/client';

interface SettingsPanelProps {
  isPro?: boolean;
  prices?: PriceInfo;
  onUpgrade?: (plan?: 'monthly' | 'yearly' | 'lifetime') => void;
  onManageSubscription?: () => void;
  onClose?: () => void;
  /** Render prop for product-specific settings sections */
  renderProductSection?: React.ReactNode;
}

export function SettingsPanel({ isPro = false, prices, onUpgrade, onManageSubscription, onClose, renderProductSection }: SettingsPanelProps) {
  const p = usePrefix();
  const config = useDarklyConfig();
  const [prefs, setPrefs] = useState<BaseUserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const prefsManager = createPreferencesManager(config);
    prefsManager.load().then((loaded) => {
      setPrefs(loaded);
      setLoading(false);
    });

    const unsubscribe = prefsManager.onChange((newPrefs) => {
      setPrefs(newPrefs);
    });

    return unsubscribe;
  }, [config]);

  const updatePrefs = useCallback(
    (patch: Partial<BaseUserPreferences>) => {
      setPrefs((prev) => ({ ...prev, ...patch }));
      const prefsManager = createPreferencesManager(config);
      prefsManager.save(patch);
    },
    [config],
  );

  if (loading) {
    return (
      <div className={`${p}-settings-panel`}>
        <div className={`${p}-settings-loading`}>Loading...</div>
      </div>
    );
  }

  // Show paywall if not paid
  if (!isPro && onUpgrade) {
    return <Paywall onSubscribe={onUpgrade} onClose={onClose} prices={prices} />;
  }

  return (
    <div className={`${p}-settings-panel`}>
      <div className={`${p}-settings-header`}>
        <div className={`${p}-settings-header-brand`}>
          <h2 className={`${p}-settings-title`}><Wordmark /></h2>
          <Toggle
            label={prefs.enabled ? 'On' : 'Off'}
            checked={prefs.enabled}
            onChange={(enabled) => updatePrefs({ enabled })}
          />
        </div>
        {onClose && (
          <button
            type="button"
            className={`${p}-settings-close-btn`}
            onClick={onClose}
            aria-label="Close settings panel"
          >
            <X size={22} />
          </button>
        )}
      </div>

      <div className={`${p}-settings-body`}>
        {prefs.enabled && (
          <>
            <div className={`${p}-settings-left`}>
              <ThemeModeSelector
                mode={prefs.mode}
                onChange={(mode: ThemeMode) => updatePrefs({ mode })}
              />
              {renderProductSection}
            </div>
            <div className={`${p}-settings-right`}>
              <ModeDetailPanel
                mode={prefs.mode}
                prefs={prefs}
                updatePrefs={updatePrefs}
              />
            </div>
          </>
        )}
      </div>

      <div className={`${p}-settings-footer`}>
        {onManageSubscription && (
          <>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); onManageSubscription(); }}
              className={`${p}-settings-footer-link`}
            >
              Manage Subscription
            </a>
            {' · '}
          </>
        )}
        Need help?{' '}
        <a
          href="https://darklysuite.com/support"
          target="_blank"
          rel="noopener noreferrer"
          className={`${p}-settings-footer-link`}
        >
          darklysuite.com/support
        </a>
      </div>
    </div>
  );
}
