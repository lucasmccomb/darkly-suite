// Gmail-specific settings panel — single-column layout for InboxSDK sidebar.
// Matches the original gmail-darkly repo's SettingsPanel layout.

import React, { useEffect, useState, useCallback } from 'react';
import type { BaseUserPreferences, ThemeMode } from '@darkly/core';
import {
  DEFAULT_PREFERENCES,
  createPreferencesManager,
  ThemeModeSelector,
  SunriseSunsetConfigComponent as SunriseSunsetConfig,
  ScheduleConfigComponent as ScheduleConfig,
  DefaultConfig,
  Paywall,
  Toggle,
  Wordmark,
  usePrefix,
  useDarklyConfig,
} from '@darkly/core';

interface GmailSettingsPanelProps {
  isPro?: boolean;
  onUpgrade?: () => void;
  onClose: () => void;
}

export function GmailSettingsPanel({ isPro = false, onUpgrade, onClose }: GmailSettingsPanelProps) {
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
      const updated = { ...prefs, ...patch };
      setPrefs(updated);
      const prefsManager = createPreferencesManager(config);
      prefsManager.save(patch);
    },
    [prefs, config],
  );

  if (loading) {
    return (
      <div className={`${p}-settings-panel`}>
        <div className={`${p}-settings-loading`}>Loading...</div>
      </div>
    );
  }

  if (!isPro && onUpgrade) {
    return <Paywall onSubscribe={onUpgrade} onClose={onClose} />;
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
        <button
          type="button"
          className={`${p}-settings-close-btn`}
          onClick={onClose}
          aria-label="Close settings panel"
        >
          {'\u2715'}
        </button>
      </div>

      <div className={`${p}-settings-body`}>
        {prefs.enabled && (
          <>
            <ThemeModeSelector
              mode={prefs.mode}
              onChange={(mode: ThemeMode) => updatePrefs({ mode })}
            />
            <SunriseSunsetConfig
              active={prefs.mode === 'sunrise-sunset'}
              config={prefs.sunriseSunset}
              onChange={(sunriseSunset) => updatePrefs({ sunriseSunset })}
            />
            <ScheduleConfig
              active={prefs.mode === 'schedule'}
              schedule={prefs.schedule}
              onScheduleChange={(schedule) => updatePrefs({ schedule })}
            />
            <DefaultConfig active={prefs.mode === 'light'} />
          </>
        )}
      </div>

      <div className={`${p}-settings-footer`}>
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
