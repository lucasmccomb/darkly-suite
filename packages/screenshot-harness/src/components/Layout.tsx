import React, { PropsWithChildren } from 'react';
import { GoogleHeader } from './GoogleHeader';
import { Sidebar } from './Sidebar';
import { CompanionStrip } from './CompanionStrip';
import { GoogleHeaderProps, SidebarProps } from '../types';

interface LayoutOwnProps {
  header: GoogleHeaderProps;
  sidebar: SidebarProps;
  companion?: boolean;
}

type LayoutProps = PropsWithChildren<LayoutOwnProps>;

export function Layout({ header, sidebar, companion = true, children }: LayoutProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        fontFamily: 'var(--gw-font-body)',
      }}
    >
      <GoogleHeader {...header} />

      <div
        style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
        }}
      >
        <Sidebar {...sidebar} />

        <main
          style={{
            flex: 1,
            overflow: 'auto',
            backgroundColor: 'var(--gw-color-surface)',
          }}
        >
          {children}
        </main>

        {companion && <CompanionStrip icons={[]} />}
      </div>
    </div>
  );
}
