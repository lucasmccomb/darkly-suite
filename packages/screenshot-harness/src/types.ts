import { ReactNode } from 'react';

// ---- Core framework types (React mock components) ----

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

// ---- Pipeline types (Playwright capture + Sharp compositing) ----

/** Options for Playwright screenshot capture. */
export interface CaptureOptions {
  /** Path to HTML file or URL to load. */
  source: string;
  /** Viewport dimensions (default: 1280x800). */
  viewport?: { width: number; height: number };
  /** Device scale factor for retina capture (default: 2). */
  deviceScaleFactor?: number;
  /** CSS files to inject after page load. */
  injectCss?: string[];
  /** HTML data attributes to set on <html> element. */
  htmlAttributes?: Record<string, string>;
  /** Wait for fonts to load (default: true). */
  waitForFonts?: boolean;
  /** Additional wait time in ms after load. */
  waitAfterLoad?: number;
}

/** Browser chrome frame style. */
export type FrameStyle = 'macos-dark' | 'macos-light';

/** Browser chrome frame options. */
export interface FrameOptions {
  /** Show browser chrome (default: true). */
  enabled: boolean;
  /** URL text shown in address bar. */
  url?: string;
  /** Frame style (default: 'macos-dark'). */
  style?: FrameStyle;
}

/** Text overlay configuration. */
export interface TextOverlayConfig {
  title: string;
  subtitle?: string;
  position?: 'top' | 'bottom';
  color?: string;
  font?: string;
}

/** Screenshot presentation options. */
export interface ScreenshotPresentationOptions {
  /** Border radius for rounded corners (default: 12). */
  borderRadius?: number;
  /** Drop shadow (default: true). */
  shadow?: boolean;
  /** Padding around screenshot in px (default: 40). */
  padding?: number;
}

/** Options for Sharp image compositing. */
export interface CompositeOptions {
  /** Raw screenshot buffer from Playwright. */
  screenshot: Buffer;
  /** Final output dimensions. */
  outputSize: { width: number; height: number };
  /** Gradient background colors [startColor, endColor]. */
  gradient: [string, string];
  /** Gradient angle in degrees (default: 135). */
  gradientAngle?: number;
  /** Browser chrome frame options. */
  frame: FrameOptions;
  /** Text overlay. */
  text?: TextOverlayConfig;
  /** Screenshot presentation. */
  screenshotOptions?: ScreenshotPresentationOptions;
}

/** A single screenshot definition in the YAML config. */
export interface ScreenshotDefinition {
  /** Unique identifier used in the output filename. */
  id: string;
  /** Path to HTML file (relative to pages/ directory). */
  page: string;
  /** Theme mode: 'light' or 'dark'. */
  theme?: string;
  /** Preset name (e.g., 'nord', 'dracula'). */
  preset?: string;
  /** Marketing title text. */
  title: string;
  /** Marketing subtitle text. */
  subtitle?: string;
  /** Gradient colors [startColor, endColor]. */
  gradient: [string, string];
  /** Gradient angle in degrees. */
  gradientAngle?: number;
  /** URL shown in browser chrome address bar. */
  browserUrl?: string;
  /** Browser chrome frame style. */
  frameStyle?: FrameStyle;
  /** CSS files to inject (relative to the config file). */
  injectCss?: string[];
  /** HTML data attributes to set on the page. */
  htmlAttributes?: Record<string, string>;
  /** Viewport dimensions override. */
  viewport?: { width: number; height: number };
  /** Text position override. */
  textPosition?: 'top' | 'bottom';
  /** Text color override. */
  textColor?: string;
}

/** Root YAML configuration schema. */
export interface ScreenshotConfig {
  /** Extension or project name (used as output subdirectory). */
  extension: string;
  /** Default settings applied to all screenshots. */
  defaults?: {
    frameStyle?: FrameStyle;
    textPosition?: 'top' | 'bottom';
    textColor?: string;
    gradientAngle?: number;
    viewport?: { width: number; height: number };
  };
  /** List of screenshots to generate. */
  screenshots: ScreenshotDefinition[];
}
