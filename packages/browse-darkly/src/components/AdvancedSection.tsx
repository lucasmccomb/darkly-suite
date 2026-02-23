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
  row: {
    display: 'flex',
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
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
  domainBadge: {
    display: 'inline-block',
    background: '#16213e',
    borderWidth: 1,
    borderStyle: 'solid' as const,
    borderColor: '#44446a',
    borderRadius: 6,
    padding: '3px 8px',
    fontSize: 12,
    color: '#8ab4f8',
    fontFamily: 'monospace',
  },
  select: {
    background: '#16213e',
    color: '#e0e0e0',
    borderWidth: 1,
    borderStyle: 'solid' as const,
    borderColor: '#44446a',
    borderRadius: 6,
    padding: '6px 10px',
    fontSize: 13,
    cursor: 'pointer',
    outline: 'none',
  },
  divider: {
    borderTopWidth: 1,
    borderTopStyle: 'solid' as const,
    borderTopColor: '#44446a',
    margin: '4px 0',
  },
  button: {
    background: 'transparent',
    borderWidth: 1,
    borderStyle: 'solid' as const,
    borderColor: '#44446a',
    borderRadius: 6,
    padding: '8px 12px',
    color: '#e0e0e0',
    fontSize: 13,
    cursor: 'pointer',
    transition: 'background 0.15s, border-color 0.15s',
    width: '100%',
    textAlign: 'center' as const,
    fontFamily: 'inherit',
  },
  dangerButton: {
    borderColor: '#e55',
    color: '#f88',
  },
  blocklisted: {
    background: '#2a1a1a',
    borderWidth: 1,
    borderStyle: 'solid' as const,
    borderColor: '#663333',
    borderRadius: 6,
    padding: '8px 12px',
    color: '#f88',
    fontSize: 13,
    textAlign: 'center' as const,
  },
};

interface AdvancedSectionProps {
  currentDomain: string;
}

export function AdvancedSection({ currentDomain }: AdvancedSectionProps) {
  const [selectedPreset, setSelectedPreset] = useState<PresetName>('default');
  const [isBlocklisted, setIsBlocklisted] = useState(false);

  useEffect(() => {
    chrome.storage.local.get([DOMAIN_KEY, BLOCKLIST_KEY], (result) => {
      const overrides: Record<string, DomainOverride> = result[DOMAIN_KEY] || {};
      const blocklist: string[] = result[BLOCKLIST_KEY] || [];

      if (overrides[currentDomain]?.preset) {
        setSelectedPreset(overrides[currentDomain].preset as PresetName);
      }
      setIsBlocklisted(blocklist.includes(currentDomain));
    });
  }, [currentDomain]);

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const preset = e.target.value as PresetName;
    setSelectedPreset(preset);

    chrome.storage.local.get([DOMAIN_KEY], (result) => {
      const overrides: Record<string, DomainOverride> = result[DOMAIN_KEY] || {};
      const current = overrides[currentDomain] || { enabled: false };
      overrides[currentDomain] = { ...current, preset };
      chrome.storage.local.set({ [DOMAIN_KEY]: overrides });
    });

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

  if (!currentDomain) {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.label, color: '#888' }}>
          Navigate to a website to configure domain-specific settings.
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.domainBadge}>{currentDomain}</div>

      {isBlocklisted ? (
        <>
          <div style={styles.blocklisted}>
            This domain is blocklisted. Dark mode will never apply here.
          </div>
          <button
            style={styles.button}
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
