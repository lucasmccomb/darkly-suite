import { ReactNode } from 'react';

export interface SidebarItem {
  icon: string;
  label: string;
  badge?: string;
  active?: boolean;
}

export interface FabButton {
  label: string;
  icon: string;
}

export interface GoogleHeaderProps {
  productName: string;
  productLogo: string;
  searchPlaceholder: string;
  brandColor?: string;
}

export interface SidebarProps {
  items: SidebarItem[];
  fabButton?: FabButton;
  width?: number;
}

export interface CompanionIcon {
  icon: string;
  label: string;
}

export interface CompanionStripProps {
  icons: CompanionIcon[];
}

export interface LayoutProps {
  header: GoogleHeaderProps;
  sidebar: SidebarProps;
  companion?: boolean;
  children: ReactNode;
}

export interface InjectionSlotProps {
  type: 'inboxsdk-button' | 'toolbar-button' | 'sidebar-icon';
  extensionIcon?: string;
}

export interface SiteConfig {
  id: string;
  name: string;
  tokensPath: string;
  layout: {
    header: {
      productName: string;
      productLogo: string;
      searchPlaceholder: string;
      brandColor?: string;
    };
    sidebar: {
      fabButton?: FabButton;
      items: SidebarItem[];
    };
    companion?: boolean;
  };
  contentComponent?: () => ReactNode;
}

export type PresetName = 'default' | 'nord' | 'solarized' | 'monokai' | 'catppuccin' | 'rose-pine';
