import React, { useState } from 'react';
import type { SunriseSunsetConfig as SunriseSunsetConfigType } from '../storage/types';
import { CollapsibleSection } from './shared/CollapsibleSection';
import { ActionButton } from './shared/ActionButton';
import { usePrefix } from '../context';

interface SunriseSunsetConfigProps {
  active: boolean;
  config: SunriseSunsetConfigType;
  onChange: (config: SunriseSunsetConfigType) => void;
  /** When true, render without CollapsibleSection wrapper (for ModeDetailPanel) */
  inline?: boolean;
}

function formatTime(isoString: string | null): string {
  if (!isoString) return '--:--';
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function SunriseSunsetConfig({ active, config, onChange, inline }: SunriseSunsetConfigProps) {
  const p = usePrefix();
  const [locationStatus, setLocationStatus] = useState<'idle' | 'requesting' | 'error'>('idle');

  const requestLocation = () => {
    setLocationStatus('requesting');

    // Use the web Geolocation API directly. Since the content script
    // runs on the host page, the browser shows a standard permission
    // prompt attributed to that origin.
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // Fetch sun times for this location, then save everything together
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
      () => {
        setLocationStatus('error');
      },
      { timeout: 10000, maximumAge: 300000 },
    );
  };

  const hasLocation = config.lat != null && config.lng != null;

  const content = (
    <>
      <p className={`${p}-settings-hint`}>
        Automatically switch themes based on local sunrise and sunset times.
      </p>

      {!hasLocation && (
        <div className={`${p}-settings-subsection`}>
          <ActionButton
            onClick={requestLocation}
            disabled={!active || locationStatus === 'requesting'}
          >
            {locationStatus === 'requesting' ? 'Requesting...' : 'Grant Location Access'}
          </ActionButton>
          {locationStatus === 'error' && (
            <p className={`${p}-settings-error`}>
              Unable to get location. Please enable location permissions.
            </p>
          )}
        </div>
      )}

      {hasLocation && (
        <div className={`${p}-settings-subsection`}>
          <div className={`${p}-settings-sun-times`}>
            <div className={`${p}-settings-sun-time`}>
              <span className={`${p}-settings-sun-time-label`}>Sunrise</span>
              <span className={`${p}-settings-sun-time-value`}>
                {formatTime(config.lastSunrise)}
              </span>
            </div>
            <div className={`${p}-settings-sun-time`}>
              <span className={`${p}-settings-sun-time-label`}>Sunset</span>
              <span className={`${p}-settings-sun-time-value`}>
                {formatTime(config.lastSunset)}
              </span>
            </div>
          </div>
          <ActionButton
            variant="secondary"
            onClick={requestLocation}
            disabled={!active}
          >
            Update Location
          </ActionButton>
        </div>
      )}
    </>
  );

  if (inline) return content;

  return (
    <CollapsibleSection title="Sunrise / Sunset" active={active}>
      {content}
    </CollapsibleSection>
  );
}
