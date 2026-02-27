import React from 'react';
import { SidebarProps } from '../types';

export function Sidebar({ items, fabButton, width }: SidebarProps) {
  const sidebarWidth = width || 256;

  return (
    <nav
      style={{
        width: `${sidebarWidth}px`,
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '8px 12px',
        boxSizing: 'border-box',
        flexShrink: 0,
      }}
    >
      {/* FAB / Compose Button */}
      {fabButton && (
        <div style={{ padding: '4px 0 16px 0' }}>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              height: '56px',
              padding: '0 24px',
              border: 'none',
              borderRadius: '16px',
              backgroundColor: 'var(--gmail-compose-btn-bg, var(--gw-color-primary))',
              color: 'var(--gmail-compose-btn-text, var(--gw-color-on-primary))',
              fontFamily: 'var(--gw-font-primary)',
              fontSize: '14px',
              fontWeight: 500,
              letterSpacing: '0.01em',
              cursor: 'pointer',
              boxShadow: 'var(--gw-shadow-1)',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ fontSize: '24px' }}>{fabButton.icon}</span>
            {fabButton.label}
          </button>
        </div>
      )}

      {/* Nav Items */}
      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
        }}
      >
        {items.map((item, index) => (
          <li key={index}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                height: '32px',
                padding: '0 12px 0 24px',
                borderRadius: '0 16px 16px 0',
                cursor: 'pointer',
                fontFamily: 'var(--gw-font-body)',
                fontSize: '14px',
                fontWeight: item.active ? 700 : 400,
                color: 'var(--gw-color-on-surface)',
                backgroundColor: item.active
                  ? 'var(--gmail-nav-active-bg, rgba(26, 115, 232, 0.12))'
                  : 'transparent',
              }}
            >
              <span
                style={{
                  fontSize: '20px',
                  width: '24px',
                  textAlign: 'center',
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && (
                <span
                  style={{
                    fontFamily: 'var(--gw-font-body)',
                    fontSize: '12px',
                    fontWeight: 500,
                    color: 'var(--gw-color-on-surface-variant)',
                  }}
                >
                  {item.badge}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </nav>
  );
}
