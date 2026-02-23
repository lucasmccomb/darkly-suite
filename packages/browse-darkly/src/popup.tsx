import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

interface TabStatus {
  enabled: boolean;
  domain: string;
}

function Popup() {
  const [status, setStatus] = useState<TabStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Query the active tab for current status
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab?.id) {
        setLoading(false);
        return;
      }
      chrome.tabs.sendMessage(
        tab.id,
        { type: 'bd:getStatus' },
        (response) => {
          if (chrome.runtime.lastError) {
            // Content script not loaded (e.g., chrome:// pages)
            setLoading(false);
            return;
          }
          setStatus(response);
          setLoading(false);
        }
      );
    });
  }, []);

  const handleToggle = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab?.id) return;
      chrome.tabs.sendMessage(tab.id, { type: 'bd:toggle' }, (response) => {
        if (response) {
          setStatus((prev) =>
            prev ? { ...prev, enabled: response.enabled } : null
          );
        }
      });
    });
  };

  const handleOpenSettings = async () => {
    const win = await chrome.windows.getLastFocused();
    if (win.id) {
      await chrome.sidePanel.open({ windowId: win.id });
    }
    window.close();
  };

  if (loading) {
    return (
      <div className="popup">
        <div className="popup-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="popup">
      <div className="popup-header">
        <h1>Browse Darkly</h1>
      </div>
      {status ? (
        <>
          <div className="popup-domain">{status.domain}</div>
          <button
            className={`popup-toggle ${status.enabled ? 'active' : ''}`}
            onClick={handleToggle}
          >
            {status.enabled ? 'Light Mode' : 'Dark Mode'}
          </button>
        </>
      ) : (
        <div className="popup-unavailable">
          Dark mode is not available on this page.
        </div>
      )}
      <button className="popup-settings" onClick={handleOpenSettings}>
        Open Settings
      </button>
    </div>
  );
}

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<Popup />);
}
