import React, { useState } from 'react';
import type { SunriseSunsetConfig as SunriseSunsetConfigType } from '../storage/types';
import { ActionButton } from './shared/ActionButton';
import { usePrefix } from '../context';

interface SunriseSunsetConfigProps {
  config: SunriseSunsetConfigType;
  onChange: (config: SunriseSunsetConfigType) => void;
}

function formatTime(isoString: string | null): string {
  if (!isoString) return '--:--';
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function SunriseSunsetConfig({ config, onChange }: SunriseSunsetConfigProps) {
  const p = usePrefix();
  const [locationStatus, setLocationStatus] = useState<'idle' | 'requesting' | 'error'>('idle');

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
      () => {
        setLocationStatus('error');
      },
      { timeout: 10000, maximumAge: 300000 },
    );
  };

  const hasLocation = config.lat != null && config.lng != null;

  return (
    <div className={`${p}-settings-subsection`}>
      <h3 className={`${p}-settings-section-title`}>Sunrise / Sunset</h3>
      <p className={`${p}-settings-hint`}>
        Automatically switch themes based on local sunrise and sunset times.
      </p>

      {!hasLocation && (
        <div>
          <ActionButton
            onClick={requestLocation}
            disabled={locationStatus === 'requesting'}
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
        <div>
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
          >
            Update Location
          </ActionButton>
        </div>
      )}
    </div>
  );
}
