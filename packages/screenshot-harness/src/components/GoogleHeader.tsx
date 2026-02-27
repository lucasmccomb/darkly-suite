import React from 'react';
import { GoogleHeaderProps } from '../types';

export function GoogleHeader({
  productName,
  productLogo,
  searchPlaceholder,
  brandColor,
}: GoogleHeaderProps) {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        height: 'var(--gw-header-height)',
        padding: '0 8px',
        backgroundColor: 'var(--gw-color-surface)',
        borderBottom: '1px solid var(--gw-color-outline)',
        boxSizing: 'border-box',
        position: 'relative',
        zIndex: 100,
      }}
    >
      {/* Hamburger + Logo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          minWidth: '238px',
          paddingLeft: '8px',
        }}
      >
        <button
          style={{
            width: '48px',
            height: '48px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            color: 'var(--gw-color-on-surface-variant)',
          }}
          aria-label="Main menu"
        >
          &#9776;
        </button>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '24px' }}>{productLogo}</span>
          <span
            style={{
              fontFamily: 'var(--gw-font-primary)',
              fontSize: '22px',
              fontWeight: 400,
              color: brandColor || 'var(--gw-color-on-surface-variant)',
              letterSpacing: '0',
              userSelect: 'none',
            }}
          >
            {productName}
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div
        style={{
          flex: 1,
          maxWidth: '720px',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            height: 'var(--gw-search-height)',
            backgroundColor: 'var(--gw-color-surface-container)',
            borderRadius: 'var(--gw-search-radius)',
            padding: '0 16px',
            gap: '16px',
          }}
        >
          <span
            style={{
              fontSize: '20px',
              color: 'var(--gw-color-on-surface-variant)',
            }}
          >
            &#128269;
          </span>
          <span
            style={{
              fontFamily: 'var(--gw-font-body)',
              fontSize: '16px',
              color: 'var(--gw-color-on-surface-variant)',
              flex: 1,
            }}
          >
            {searchPlaceholder}
          </span>
          <span
            style={{
              fontSize: '18px',
              color: 'var(--gw-color-on-surface-variant)',
            }}
          >
            &#9776;
          </span>
        </div>
      </div>

      {/* Right Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          paddingRight: '8px',
        }}
      >
        <HeaderIconButton label="Support" icon="?" />
        <HeaderIconButton label="Settings" icon="&#9881;" />
        <HeaderIconButton label="Apps" icon="&#8942;&#8942;&#8942;" />
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'var(--gw-color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--gw-color-on-primary)',
            fontFamily: 'var(--gw-font-body)',
            fontSize: '14px',
            fontWeight: 500,
            marginLeft: '8px',
            cursor: 'pointer',
          }}
        >
          J
        </div>
      </div>
    </header>
  );
}

function HeaderIconButton({ label, icon }: { label: string; icon: string }) {
  return (
    <button
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
      }}
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  );
}
