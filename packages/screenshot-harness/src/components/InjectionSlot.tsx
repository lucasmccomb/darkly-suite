import React from 'react';
import { InjectionSlotProps } from '../types';

export function InjectionSlot({ type, extensionIcon }: InjectionSlotProps) {
  if (type === 'inboxsdk-button') {
    return (
      <div className="inboxsdk__appButton" style={{ position: 'relative' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            borderRadius: '50%',
          }}
        >
          {extensionIcon && (
            <span style={{ fontSize: '20px' }}>{extensionIcon}</span>
          )}
        </div>
        <div
          className="inboxsdk__tooltip"
          style={{
            display: 'none',
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '4px 8px',
            backgroundColor: 'var(--gw-color-on-surface)',
            color: 'var(--gw-color-surface)',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'var(--gw-font-body)',
            whiteSpace: 'nowrap',
            zIndex: 200,
          }}
        />
      </div>
    );
  }

  if (type === 'toolbar-button') {
    return (
      <div
        style={{
          width: '30px',
          height: '30px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          borderRadius: '4px',
          border: '1px solid var(--gw-color-outline)',
        }}
      >
        {extensionIcon && (
          <span style={{ fontSize: '16px' }}>{extensionIcon}</span>
        )}
      </div>
    );
  }

  // sidebar-icon
  return (
    <div
      style={{
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        borderRadius: '50%',
      }}
    >
      {extensionIcon && (
        <span style={{ fontSize: '20px' }}>{extensionIcon}</span>
      )}
    </div>
  );
}
