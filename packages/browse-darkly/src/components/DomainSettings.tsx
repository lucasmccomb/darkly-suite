import React, { useEffect, useState } from 'react';
import type { PresetName } from '@darkly/core';
import { PRESETS } from '@darkly/core';

const DOMAIN_KEY = 'bd_domain_overrides';
const BLOCKLIST_KEY = 'bd_blocklist';

interface DomainOverride {
  enabled: boolean;
  preset?: string;
}

const presetOptions: { value: PresetName; label: string }[] = [
  { value: 'default', label: 'Default Dark' },
  ...Object.values(PRESETS).map((p) => ({ value: p.name, label: p.label })),
];

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
  },
  heading: {
    fontSize: 14,
    fontWeight: 600 as const,
    color: '#e0e0e0',
    margin: '0 0 4px',
  },
  domainBadge: {
    display: 'inline-block',
    background: '#16213e',
    border: '1px solid #44446a',
    borderRadius: 6,
    padding: '4px 10px',
    fontSize: 13,
    color: '#8ab4f8',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: '8px 0',
  },
  label: {
    fontSize: 13,
    color: '#e0e0e0',
  },
  sublabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  toggle: {
    position: 'relative' as const,
    width: 40,
    height: 22,
    borderRadius: 11,
    cursor: 'pointer',
    transition: 'background 0.2s',
    border: 'none',
    padding: 0,
    flexShrink: 0,
  },
  toggleKnob: {
    position: 'absolute' as const,
    top: 2,
    width: 18,
    height: 18,
    borderRadius: '50%',
    background: '#fff',
    transition: 'left 0.2s',
  },
  select: {
    background: '#16213e',
    color: '#e0e0e0',
    border: '1px solid #44446a',
    borderRadius: 6,
    padding: '6px 10px',
    fontSize: 13,
    cursor: 'pointer',
    outline: 'none',
  },
  button: {
    background: 'transparent',
    border: '1px solid #44446a',
    borderRadius: 6,
    padding: '8px 12px',
    color: '#e0e0e0',
    fontSize: 13,
    cursor: 'pointer',
    transition: 'background 0.15s, border-color 0.15s',
    width: '100%',
    textAlign: 'center' as const,
  },
  dangerButton: {
    borderColor: '#e55',
    color: '#f88',
  },
  blocklisted: {
    background: '#2a1a1a',
    border: '1px solid #663333',
    borderRadius: 6,
    padding: '8px 12px',
    color: '#f88',
    fontSize: 13,
    textAlign: 'center' as const,
  },
  divider: {
    borderTop: '1px solid #44446a',
    margin: '4px 0',
  },
};

interface DomainSettingsProps {
  currentDomain: string;
}

export function DomainSettings({ currentDomain }: DomainSettingsProps) {
  const [domainConfig, setDomainConfig] = useState<DomainOverride | null>(null);
  const [isBlocklisted, setIsBlocklisted] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<PresetName>('default');

  useEffect(() => {
    chrome.storage.local.get([DOMAIN_KEY, BLOCKLIST_KEY], (result) => {
      const overrides: Record<string, DomainOverride> = result[DOMAIN_KEY] || {};
      const blocklist: string[] = result[BLOCKLIST_KEY] || [];

      if (overrides[currentDomain]) {
        setDomainConfig(overrides[currentDomain]);
        if (overrides[currentDomain].preset) {
          setSelectedPreset(overrides[currentDomain].preset as PresetName);
        }
      }
      setIsBlocklisted(blocklist.includes(currentDomain));
    });
  }, [currentDomain]);

  const updateDomainOverride = (update: Partial<DomainOverride>) => {
    chrome.storage.local.get([DOMAIN_KEY], (result) => {
      const overrides: Record<string, DomainOverride> = result[DOMAIN_KEY] || {};
      const current = overrides[currentDomain] || { enabled: false };
      const updated = { ...current, ...update };
      overrides[currentDomain] = updated;
      chrome.storage.local.set({ [DOMAIN_KEY]: overrides });
      setDomainConfig(updated);
    });
  };

  const handleToggleEnabled = () => {
    const newEnabled = !(domainConfig?.enabled ?? false);
    updateDomainOverride({ enabled: newEnabled });

    // Send toggle to active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, { type: 'bd:toggle' });
      }
    });
  };

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const preset = e.target.value as PresetName;
    setSelectedPreset(preset);
    updateDomainOverride({ preset });

    // Apply preset to active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, { type: 'bd:setPreset', preset });
      }
    });
  };

  const handleToggleBlocklist = () => {
    chrome.storage.local.get([BLOCKLIST_KEY], (result) => {
      const blocklist: string[] = result[BLOCKLIST_KEY] || [];
      let updated: string[];
      if (isBlocklisted) {
        updated = blocklist.filter((d) => d !== currentDomain);
      } else {
        updated = [...blocklist, currentDomain];
      }
      chrome.storage.local.set({ [BLOCKLIST_KEY]: updated });
      setIsBlocklisted(!isBlocklisted);
    });
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>Domain Settings</h3>
      <div style={styles.domainBadge}>{currentDomain}</div>

      {isBlocklisted ? (
        <>
          <div style={styles.blocklisted}>
            This domain is blocklisted. Dark mode will never apply here.
          </div>
          <button
            style={{ ...styles.button }}
            onClick={handleToggleBlocklist}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.background = '#2a2a4a';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.background = 'transparent';
            }}
          >
            Remove from Blocklist
          </button>
        </>
      ) : (
        <>
          <div style={styles.row}>
            <div>
              <div style={styles.label}>Enable dark mode</div>
              <div style={styles.sublabel}>Override global setting for this domain</div>
            </div>
            <button
              style={{
                ...styles.toggle,
                background: domainConfig?.enabled ? '#8ab4f8' : '#44446a',
              }}
              onClick={handleToggleEnabled}
              aria-label="Toggle dark mode for this domain"
            >
              <div
                style={{
                  ...styles.toggleKnob,
                  left: domainConfig?.enabled ? 20 : 2,
                }}
              />
            </button>
          </div>

          <div style={styles.row}>
            <div style={styles.label}>Preset for this domain</div>
            <select
              style={styles.select}
              value={selectedPreset}
              onChange={handlePresetChange}
            >
              {presetOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.divider} />

          <button
            style={{ ...styles.button, ...styles.dangerButton }}
            onClick={handleToggleBlocklist}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.background = '#2a1a1a';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.background = 'transparent';
            }}
          >
            Add to Blocklist
          </button>
        </>
      )}
    </div>
  );
}
