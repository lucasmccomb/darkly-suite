import React, { useEffect, useState } from 'react';
import type { PresetName } from '@darkly/core';
import { PRESETS, DEFAULT_DARK_VARIABLES } from '@darkly/core';

const STORAGE_KEY = 'bd_preferences';
const DOMAIN_KEY = 'bd_domain_overrides';

interface DomainOverride {
  enabled: boolean;
  preset?: string;
}

const allPresets: { name: PresetName; label: string; variables: Record<string, string> }[] = [
  {
    name: 'default',
    label: 'Default Dark',
    variables: DEFAULT_DARK_VARIABLES as unknown as Record<string, string>,
  },
  ...Object.values(PRESETS),
];

const swatchKeys = [
  '--darkly-bg-primary',
  '--darkly-bg-secondary',
  '--darkly-accent',
  '--darkly-text-primary',
];

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 10,
  },
  subtext: {
    fontSize: 12,
    color: '#888',
    margin: '0 0 4px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
  },
  card: {
    background: '#1e1e3a',
    borderWidth: 2,
    borderStyle: 'solid' as const,
    borderColor: '#44446a',
    borderRadius: 8,
    padding: 10,
    cursor: 'pointer',
    transition: 'border-color 0.15s, background 0.15s',
  },
  cardSelected: {
    borderColor: '#8ab4f8',
    background: '#2a2a4a',
  },
  cardHover: {
    background: '#2a2a4a',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: 500 as const,
    color: '#e0e0e0',
  },
  checkmark: {
    fontSize: 14,
    color: '#8ab4f8',
  },
  swatches: {
    display: 'flex',
    gap: 4,
  },
  swatch: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderStyle: 'solid' as const,
    borderColor: 'rgba(255,255,255,0.1)',
  },
};

interface ThemesSectionProps {
  currentDomain: string;
}

export function ThemesSection({ currentDomain }: ThemesSectionProps) {
  const [selected, setSelected] = useState<PresetName>('default');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  useEffect(() => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      const prefs = result[STORAGE_KEY];
      if (prefs?.preset) {
        setSelected(prefs.preset);
      }
    });
  }, []);

  const handleSelect = (presetName: PresetName) => {
    setSelected(presetName);

    chrome.storage.local.get([STORAGE_KEY], (result) => {
      const prefs = result[STORAGE_KEY] || {};
      chrome.storage.local.set({
        [STORAGE_KEY]: { ...prefs, preset: presetName },
      });
    });

    chrome.storage.local.get([DOMAIN_KEY], (result) => {
      const overrides: Record<string, DomainOverride> = result[DOMAIN_KEY] || {};
      if (overrides[currentDomain]) {
        overrides[currentDomain] = { ...overrides[currentDomain], preset: presetName };
        chrome.storage.local.set({ [DOMAIN_KEY]: overrides });
      }
    });

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, { type: 'bd:setPreset', preset: presetName });
      }
    });
  };

  return (
    <div style={styles.container}>
      <p style={styles.subtext}>Choose a color theme for dark mode.</p>
      <div style={styles.grid}>
        {allPresets.map((preset, idx) => {
          const isSelected = selected === preset.name;
          const isHovered = hoveredIdx === idx;
          return (
            <div
              key={preset.name}
              style={{
                ...styles.card,
                ...(isSelected ? styles.cardSelected : {}),
                ...(isHovered && !isSelected ? styles.cardHover : {}),
              }}
              onClick={() => handleSelect(preset.name)}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <div style={styles.cardHeader}>
                <span style={styles.cardLabel}>{preset.label}</span>
                {isSelected && <span style={styles.checkmark}>&#10003;</span>}
              </div>
              <div style={styles.swatches}>
                {swatchKeys.map((key) => (
                  <div
                    key={key}
                    style={{
                      ...styles.swatch,
                      backgroundColor: preset.variables[key] || '#333',
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
