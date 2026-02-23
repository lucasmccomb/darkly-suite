import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { PresetGallery } from './components/PresetGallery';
import { DomainSettings } from './components/DomainSettings';
import { ScheduleSettings } from './components/ScheduleSettings';
import { AccountPanel } from './components/AccountPanel';

type TabId = 'presets' | 'domain' | 'schedule' | 'account';

interface Tab {
  id: TabId;
  label: string;
}

const tabs: Tab[] = [
  { id: 'presets', label: 'Presets' },
  { id: 'domain', label: 'Domain' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'account', label: 'Account' },
];

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
    padding: '16px 16px 0',
  },
  title: {
    fontSize: 18,
    fontWeight: 700 as const,
    margin: '0 0 4px',
    color: '#e0e0e0',
  },
  domain: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'monospace',
    margin: '0 0 12px',
  },
  tabBar: {
    display: 'flex',
    borderBottom: '1px solid #44446a',
    padding: '0 16px',
    gap: 0,
  },
  tab: {
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    padding: '8px 12px',
    fontSize: 13,
    color: '#888',
    cursor: 'pointer',
    transition: 'color 0.15s, border-color 0.15s',
    fontFamily: 'inherit',
  },
  tabActive: {
    color: '#8ab4f8',
    borderBottomColor: '#8ab4f8',
  },
  tabHover: {
    color: '#e0e0e0',
  },
  content: {
    flex: 1,
    padding: 16,
    overflowY: 'auto' as const,
  },
};

function SidePanel() {
  const [activeTab, setActiveTab] = useState<TabId>('presets');
  const [currentDomain, setCurrentDomain] = useState<string>('');
  const [hoveredTab, setHoveredTab] = useState<TabId | null>(null);

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab?.url) {
        try {
          const url = new URL(tab.url);
          setCurrentDomain(url.hostname);
        } catch {
          setCurrentDomain('');
        }
      }
    });
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'presets':
        return <PresetGallery currentDomain={currentDomain} />;
      case 'domain':
        return <DomainSettings currentDomain={currentDomain} />;
      case 'schedule':
        return <ScheduleSettings />;
      case 'account':
        return <AccountPanel />;
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Browse Darkly</h1>
        {currentDomain && (
          <p style={styles.domain}>{currentDomain}</p>
        )}
      </div>

      <div style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isHovered = hoveredTab === tab.id;
          return (
            <button
              key={tab.id}
              style={{
                ...styles.tab,
                ...(isActive ? styles.tabActive : {}),
                ...(isHovered && !isActive ? styles.tabHover : {}),
              }}
              onClick={() => setActiveTab(tab.id)}
              onMouseEnter={() => setHoveredTab(tab.id)}
              onMouseLeave={() => setHoveredTab(null)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div style={styles.content}>
        {renderContent()}
      </div>
    </div>
  );
}

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<SidePanel />);
}
