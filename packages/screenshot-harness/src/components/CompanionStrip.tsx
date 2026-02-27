import React from 'react';
import { CompanionStripProps } from '../types';

const defaultIcons = [
  { icon: '\uD83D\uDCC5', label: 'Calendar' },
  { icon: '\uD83D\uDCDD', label: 'Keep' },
  { icon: '\u2611', label: 'Tasks' },
  { icon: '\uD83D\uDC64', label: 'Contacts' },
];

export function CompanionStrip({ icons }: CompanionStripProps) {
  const displayIcons = icons.length > 0 ? icons : defaultIcons;

  return (
    <aside
      style={{
        width: 'var(--gw-companion-width)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '8px 0',
        borderLeft: '1px solid var(--gw-color-outline)',
        backgroundColor: 'var(--gw-color-surface)',
        boxSizing: 'border-box',
        flexShrink: 0,
      }}
    >
      {displayIcons.map((item, index) => (
        <button
          key={index}
          style={{
            width: '40px',
            height: '40px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            color: 'var(--gw-color-on-surface-variant)',
            marginBottom: '4px',
          }}
          aria-label={item.label}
          title={item.label}
        >
          {item.icon}
        </button>
      ))}
    </aside>
  );
}
