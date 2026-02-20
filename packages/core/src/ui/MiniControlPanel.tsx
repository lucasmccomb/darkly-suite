import React, { useEffect, useState, useCallback } from 'react';
import type { BaseUserPreferences, ThemeMode, SunriseSunsetConfig } from '../storage/types';
import { DEFAULT_PREFERENCES } from '../storage/types';
import { createPreferencesManager } from '../storage/preferences';
import { ActionButton } from './shared/ActionButton';
import { Toggle } from './shared/Toggle';
import { Wordmark } from './shared/Wordmark';
import { usePrefix, useDarklyConfig } from '../context';
import { Moon, Monitor, SunMoon, Palette, Sunrise, Sunset, Settings, ChevronRight, X, type LucideIcon } from 'lucide-react';
import type { PriceInfo } from '../payment/client';

interface MiniControlPanelProps {
  isPro: boolean;
  prices?: PriceInfo;
  onAllSettings: () => void;
  onUpgrade: () => void;
  onClose: () => void;
}

const MODE_ICONS: Record<string, LucideIcon> = {
  dark: Moon,
  system: Monitor,
  'sunrise-sunset': SunMoon,
  light: Palette,
};

const QUICK_MODES: { value: ThemeMode; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'dark', label: 'Dark' },
  { value: 'sunrise-sunset', label: 'Sunrise/Sunset' },
  { value: 'light', label: 'Default' },
];


function formatTime(isoString: string | null): string {
  if (!isoString) return '--:--';
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function CompactSunriseSunset({ config, onChange }: {
  config: SunriseSunsetConfig;
  onChange: (config: SunriseSunsetConfig) => void;
}) {
  const p = usePrefix();
  const [locationStatus, setLocationStatus] = useState<'idle' | 'requesting' | 'error'>('idle');
  const hasLocation = config.lat != null && config.lng != null;

  const requestLocation = () => {
    setLocationStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        chrome.runtime.sendMessage({ type: 'getSunTimes', lat, lng }, (response) => {
          onChange({
            ...config,
            lat,
            lng,
            enabled: true,
            lastSunrise: response?.sunrise ?? null,
            lastSunset: response?.sunset ?? null,
            lastFetched: new Date().toISOString(),
          });
          setLocationStatus('idle');
        });
      },
      () => setLocationStatus('error'),
      { timeout: 10000, maximumAge: 300000 },
    );
  };

  if (!hasLocation) {
    return (
      <div className={`${p}-dropdown-section`}>
        <ActionButton
          variant="ghost"
          size="compact"
          fullWidth
          onClick={requestLocation}
          disabled={locationStatus === 'requesting'}
        >
          {locationStatus === 'requesting' ? 'Requesting...' : 'Grant Location Access'}
        </ActionButton>
        {locationStatus === 'error' && (
          <p className={`${p}-dropdown-error`}>Unable to get location.</p>
        )}
      </div>
    );
  }

  return (
    <div className={`${p}-dropdown-sun-times`}>
      <div className={`${p}-dropdown-sun-time`}>
        <Sunrise size={18} className={`${p}-dropdown-time-icon`} />
        <span className={`${p}-dropdown-sun-time-value`}>{formatTime(config.lastSunrise)}</span>
      </div>
      <div className={`${p}-dropdown-sun-time`}>
        <Sunset size={18} className={`${p}-dropdown-time-icon`} />
        <span className={`${p}-dropdown-sun-time-value`}>{formatTime(config.lastSunset)}</span>
      </div>
    </div>
  );
}

export function MiniControlPanel({ isPro, prices, onAllSettings, onUpgrade, onClose }: MiniControlPanelProps) {
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
    return <div className={`${p}-dropdown-panel ${p}-dropdown-loading`}>Loading...</div>;
  }

  // Show paywall if not paid
  if (!isPro) {
    return (
      <div className={`${p}-dropdown-panel`}>
        <div className={`${p}-dropdown-header`}>
          <span className={`${p}-dropdown-title`}><Wordmark /></span>
        </div>
        <div className={`${p}-dropdown-paywall`}>
          <p className={`${p}-dropdown-paywall-title`}>Subscribe to use <Wordmark /></p>
          <p className={`${p}-dropdown-paywall-description`}>
            Dark mode with plans from {prices?.monthly ?? '$0.99'}/mo.
          </p>
          <ActionButton size="compact" fullWidth onClick={onUpgrade}>
            Subscribe Now
          </ActionButton>
        </div>
      </div>
    );
  }

  return (
    <div className={`${p}-dropdown-panel`}>
      <div className={`${p}-dropdown-header`}>
        <div className={`${p}-dropdown-header-brand`}>
          <span className={`${p}-dropdown-title`}><Wordmark /></span>
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
          aria-label="Close panel"
        >
          <X size={21} />
        </button>
      </div>

      {prefs.enabled && (
        <div className={`${p}-dropdown-mode-list`}>
          {QUICK_MODES.map((opt) => {
            const Icon = MODE_ICONS[opt.value];
            return (
              <React.Fragment key={opt.value}>
                <button
                  type="button"
                  className={`${p}-dropdown-mode-btn ${prefs.mode === opt.value ? `${p}-dropdown-mode-btn--active` : ''}`}
                  onClick={() => updatePrefs({ mode: opt.value })}
                >
                  {Icon && <Icon size={21} className={`${p}-dropdown-mode-icon`} />}
                  {opt.label}
                </button>
                {opt.value === 'sunrise-sunset' && prefs.mode === 'sunrise-sunset' && (
                  <CompactSunriseSunset
                    config={prefs.sunriseSunset}
                    onChange={(sunriseSunset) => updatePrefs({ sunriseSunset })}
                  />
                )}
              </React.Fragment>
            );
          })}
          <hr className={`${p}-dropdown-divider`} />
          <button
            type="button"
            className={`${p}-dropdown-mode-btn`}
            onClick={onAllSettings}
          >
            <Settings size={21} className={`${p}-dropdown-mode-icon`} />
            All Settings
            <ChevronRight size={21} className={`${p}-dropdown-arrow`} />
          </button>
        </div>
      )}
    </div>
  );
}
