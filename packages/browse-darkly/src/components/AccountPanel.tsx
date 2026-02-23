import React, { useEffect, useState } from 'react';
import { createPaymentClient } from '@darkly/core';
import type { PriceInfo } from '@darkly/core';
import { config } from '../darkly.config';

const paymentClient = createPaymentClient(config);

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
  proBadge: {
    display: 'inline-flex',
    alignItems: 'center' as const,
    gap: 6,
    background: 'linear-gradient(135deg, #8ab4f8, #c4a7e7)',
    color: '#1a1a2e',
    fontWeight: 700 as const,
    fontSize: 13,
    borderRadius: 20,
    padding: '4px 14px',
    marginBottom: 4,
  },
  statusCard: {
    background: '#1e1e3a',
    border: '1px solid #44446a',
    borderRadius: 8,
    padding: 14,
  },
  statusLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 14,
    color: '#e0e0e0',
    fontWeight: 500 as const,
  },
  manageButton: {
    background: '#16213e',
    border: '1px solid #44446a',
    borderRadius: 6,
    padding: '10px 14px',
    color: '#e0e0e0',
    fontSize: 13,
    cursor: 'pointer',
    transition: 'background 0.15s',
    width: '100%',
    textAlign: 'center' as const,
    marginTop: 8,
  },
  freeCard: {
    background: '#1e1e3a',
    border: '1px solid #44446a',
    borderRadius: 8,
    padding: 14,
  },
  featureList: {
    listStyle: 'none',
    padding: 0,
    margin: '8px 0',
  },
  featureItem: {
    fontSize: 13,
    color: '#e0e0e0',
    padding: '4px 0',
    display: 'flex',
    alignItems: 'center' as const,
    gap: 8,
  },
  featureCheck: {
    color: '#8ab4f8',
    fontSize: 14,
  },
  featureLock: {
    color: '#666',
    fontSize: 14,
  },
  upgradeSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
    marginTop: 4,
  },
  upgradeButton: {
    border: 'none',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 13,
    fontWeight: 600 as const,
    cursor: 'pointer',
    transition: 'opacity 0.15s',
    textAlign: 'center' as const,
    width: '100%',
  },
  primaryUpgrade: {
    background: 'linear-gradient(135deg, #8ab4f8, #c4a7e7)',
    color: '#1a1a2e',
  },
  secondaryUpgrade: {
    background: '#2a2a4a',
    color: '#e0e0e0',
    border: '1px solid #44446a',
  },
  priceLabel: {
    fontSize: 11,
    color: '#888',
    textAlign: 'center' as const,
    marginTop: 2,
  },
  loading: {
    color: '#888',
    fontSize: 13,
    textAlign: 'center' as const,
    padding: 20,
  },
};

const freeFeatures = [
  { text: 'Dark mode on any website', included: true },
  { text: 'Default dark theme', included: true },
  { text: 'Basic toggle', included: true },
];

const proFeatures = [
  { text: '6 premium theme presets', included: false },
  { text: 'Per-domain settings', included: false },
  { text: 'Scheduled dark mode', included: false },
  { text: 'Sunrise/sunset automation', included: false },
];

export function AccountPanel() {
  const [isPro, setIsPro] = useState<boolean | null>(null);
  const [prices, setPrices] = useState<PriceInfo | null>(null);

  useEffect(() => {
    async function loadStatus() {
      const proStatus = await paymentClient.isPro();
      setIsPro(proStatus);
      const priceInfo = await paymentClient.getPrices();
      setPrices(priceInfo);
    }
    loadStatus();

    paymentClient.onPaymentStatusChange((paid) => {
      setIsPro(paid);
    });
  }, []);

  const handleUpgrade = (plan: 'monthly' | 'yearly' | 'lifetime') => {
    paymentClient.openPaymentPage(plan);
  };

  const handleManage = () => {
    paymentClient.openManageSubscription();
  };

  if (isPro === null) {
    return <div style={styles.loading as React.CSSProperties}>Loading account status...</div>;
  }

  if (isPro) {
    return (
      <div style={styles.container}>
        <h3 style={styles.heading}>Account</h3>
        <div style={styles.proBadge}>&#9733; Pro</div>
        <div style={styles.statusCard}>
          <div style={styles.statusLabel}>Status</div>
          <div style={styles.statusValue}>All features unlocked</div>
        </div>
        <button
          style={styles.manageButton}
          onClick={handleManage}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.background = '#2a2a4a';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.background = '#16213e';
          }}
        >
          Manage Subscription
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>Account</h3>
      <div style={styles.freeCard}>
        <div style={{ ...styles.statusLabel, marginBottom: 8 }}>Free Plan</div>
        <ul style={styles.featureList}>
          {freeFeatures.map((f) => (
            <li key={f.text} style={styles.featureItem}>
              <span style={styles.featureCheck}>&#10003;</span>
              {f.text}
            </li>
          ))}
          {proFeatures.map((f) => (
            <li key={f.text} style={{ ...styles.featureItem, color: '#666' }}>
              <span style={styles.featureLock}>&#128274;</span>
              {f.text}
            </li>
          ))}
        </ul>
      </div>

      <div style={styles.upgradeSection}>
        <button
          style={{ ...styles.upgradeButton, ...styles.primaryUpgrade }}
          onClick={() => handleUpgrade('yearly')}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.opacity = '0.9';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.opacity = '1';
          }}
        >
          Upgrade to Pro — Yearly
        </button>
        {prices?.yearly && (
          <div style={styles.priceLabel as React.CSSProperties}>{prices.yearly}/year</div>
        )}

        <button
          style={{ ...styles.upgradeButton, ...styles.secondaryUpgrade }}
          onClick={() => handleUpgrade('monthly')}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.background = '#3a3a5a';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.background = '#2a2a4a';
          }}
        >
          Monthly
        </button>
        {prices?.monthly && (
          <div style={styles.priceLabel as React.CSSProperties}>{prices.monthly}/month</div>
        )}

        <button
          style={{ ...styles.upgradeButton, ...styles.secondaryUpgrade }}
          onClick={() => handleUpgrade('lifetime')}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.background = '#3a3a5a';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.background = '#2a2a4a';
          }}
        >
          Lifetime
        </button>
        {prices?.lifetime && (
          <div style={styles.priceLabel as React.CSSProperties}>{prices.lifetime} one-time</div>
        )}
      </div>
    </div>
  );
}
