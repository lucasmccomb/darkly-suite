import React from 'react';
import { createRoot } from 'react-dom/client';

function SidePanel() {
  return (
    <div
      style={{
        padding: 24,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        background: '#1a1a2e',
        color: '#e0e0e0',
        minHeight: '100vh',
      }}
    >
      <h1 style={{ fontSize: 20, margin: '0 0 16px' }}>Browse Darkly</h1>
      <p style={{ color: '#888', fontSize: 14 }}>
        Side panel settings coming soon.
      </p>
      <p style={{ color: '#666', fontSize: 12, marginTop: 24 }}>
        Use the popup to toggle dark mode on the current site.
      </p>
    </div>
  );
}

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<SidePanel />);
}
