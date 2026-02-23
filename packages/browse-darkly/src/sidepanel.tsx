import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createPaymentClient } from '@darkly/core';
import { config } from './darkly.config';
import { CollapsibleSection } from './components/CollapsibleSection';
import { GeneralSection } from './components/GeneralSection';
import { ThemesSection } from './components/ThemesSection';
import { AdvancedSection } from './components/AdvancedSection';
import { AccountSection } from './components/AccountSection';

function domainFromUrl(url: string | undefined): string {
  if (!url) return '';
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

const styles = {
  container: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    background: '#1a1a2e',
    color: '#e0e0e0',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  header: {
    padding: '16px 16px 12px',
    borderBottom: '1px solid #44446a',
  },
  title: {
    fontSize: 18,
    fontWeight: 700 as const,
    margin: '0 0 8px',
    color: '#e0e0e0',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 8,
  },
  domain: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'monospace',
  },
  proBadge: {
    background: 'linear-gradient(135deg, #8ab4f8, #c4a7e7)',
    color: '#1a1a2e',
    fontWeight: 700 as const,
    fontSize: 11,
    borderRadius: 12,
    padding: '2px 10px',
  },
  freeBadge: {
    background: '#44446a',
    color: '#aaa',
    fontSize: 11,
    fontWeight: 500 as const,
    borderRadius: 12,
    padding: '2px 10px',
  },
  manageButton: {
    background: 'transparent',
    borderWidth: 1,
    borderStyle: 'solid' as const,
    borderColor: '#44446a',
    borderRadius: 6,
    padding: '6px 12px',
    color: '#8ab4f8',
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background 0.15s',
  },
  sectionsContainer: {
    flex: 1,
    overflowY: 'auto' as const,
  },
  footer: {
    padding: '12px 16px',
    borderTop: '1px solid #44446a',
    textAlign: 'center' as const,
    flexShrink: 0,
  },
  supportLink: {
    color: '#888',
    fontSize: 12,
    textDecoration: 'none' as const,
    cursor: 'pointer',
  },
};

function SidePanel() {
  const [currentDomain, setCurrentDomain] = useState('');
  const [darkEnabled, setDarkEnabled] = useState(false);
  const [isPro, setIsPro] = useState<boolean | null>(null);

  const paymentClient = useMemo(() => createPaymentClient(config), []);

  const queryDarkStatus = useCallback(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab?.id) return;
      chrome.tabs.sendMessage(tab.id, { type: 'bd:getStatus' }, (response) => {
        if (chrome.runtime.lastError) return;
        if (response) setDarkEnabled(response.enabled);
      });
    });
  }, []);

  const updateDomain = useCallback(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      setCurrentDomain(domainFromUrl(tabs[0]?.url));
    });
  }, []);

  useEffect(() => {
    updateDomain();
    queryDarkStatus();

    const onActivated = () => {
      updateDomain();
      queryDarkStatus();
    };
    const onUpdated = (_tabId: number, info: chrome.tabs.TabChangeInfo) => {
      if (info.url) {
        updateDomain();
        queryDarkStatus();
      }
    };

    chrome.tabs.onActivated.addListener(onActivated);
    chrome.tabs.onUpdated.addListener(onUpdated);
    return () => {
      chrome.tabs.onActivated.removeListener(onActivated);
      chrome.tabs.onUpdated.removeListener(onUpdated);
    };
  }, [updateDomain, queryDarkStatus]);

  useEffect(() => {
    paymentClient.isPro().then(setIsPro);
    paymentClient.onPaymentStatusChange(setIsPro);
  }, [paymentClient]);

  const handleManage = () => {
    paymentClient.openManageSubscription();
  };

  const handleSupportClick = (e: React.MouseEvent) => {
    e.preventDefault();
    chrome.runtime.sendMessage({ type: 'openTab', url: 'https://darklysuite.com/support' });
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Browse Darkly</h1>
        <div style={styles.headerRow}>
          {currentDomain && <span style={styles.domain}>{currentDomain}</span>}
          {isPro !== null && (
            <span style={isPro ? styles.proBadge : styles.freeBadge}>
              {isPro ? 'Pro' : 'Free'}
            </span>
          )}
        </div>
        {isPro && (
          <button
            style={styles.manageButton}
            onClick={handleManage}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.background = '#1e1e3a';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.background = 'transparent';
            }}
          >
            Manage Subscription
          </button>
        )}
      </div>

      {/* Collapsible Sections */}
      <div style={styles.sectionsContainer}>
        <CollapsibleSection title="General" defaultOpen>
          <GeneralSection
            currentDomain={currentDomain}
            darkEnabled={darkEnabled}
            onDarkEnabledChange={setDarkEnabled}
          />
        </CollapsibleSection>

        <CollapsibleSection title="Themes">
          <ThemesSection currentDomain={currentDomain} />
        </CollapsibleSection>

        <CollapsibleSection title="Advanced">
          <AdvancedSection key={currentDomain} currentDomain={currentDomain} />
        </CollapsibleSection>

        <CollapsibleSection title="Account">
          <AccountSection />
        </CollapsibleSection>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <a
          href="https://darklysuite.com/support"
          style={styles.supportLink}
          onClick={handleSupportClick}
        >
          Support
        </a>
      </div>
    </div>
  );
}

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<SidePanel />);
}
