import type { PresetName } from '../storage/types';

export interface ThemePreset {
  name: PresetName;
  label: string;
  variables: Record<string, string>;
}

// Canonical --darkly-* variable names. The webpack CSS prefix loader
// transforms these to --gd-*, --sd-*, --dd-*, or --ds-* per extension.
export const DEFAULT_DARK_VARIABLES = {
  '--darkly-bg-primary': '#1a1a2e',
  '--darkly-bg-secondary': '#16213e',
  '--darkly-bg-surface': '#1e1e3a',
  '--darkly-bg-hover': '#2a2a4a',
  '--darkly-text-primary': '#e8eaed',
  '--darkly-text-secondary': '#b0b3b8',
  '--darkly-text-link': '#8ab4f8',
  '--darkly-border': '#44446a',
  '--darkly-accent': '#8ab4f8',
  '--darkly-shadow': 'rgba(0, 0, 0, 0.4)',
  '--darkly-unread-bg': '#1e1e3a',
  '--darkly-read-bg': '#16213e',
  '--darkly-selected-bg': '#2a3a5a',
  '--darkly-compose-bg': '#1e1e3a',
} as const;

const presetVariables = {
  nord: {
    '--darkly-bg-primary': '#2e3440',
    '--darkly-bg-secondary': '#3b4252',
    '--darkly-bg-surface': '#434c5e',
    '--darkly-bg-hover': '#4c566a',
    '--darkly-text-primary': '#eceff4',
    '--darkly-text-secondary': '#d8dee9',
    '--darkly-text-link': '#8ec5d4',
    '--darkly-border': '#4c566a',
    '--darkly-accent': '#8ec5d4',
    '--darkly-shadow': 'rgba(0, 0, 0, 0.3)',
    '--darkly-unread-bg': '#434c5e',
    '--darkly-read-bg': '#3b4252',
    '--darkly-selected-bg': '#4c566a',
    '--darkly-compose-bg': '#3b4252',
  },
  solarized: {
    '--darkly-bg-primary': '#002b36',
    '--darkly-bg-secondary': '#073642',
    '--darkly-bg-surface': '#073642',
    '--darkly-bg-hover': '#0a4050',
    '--darkly-text-primary': '#fdf6e3',
    '--darkly-text-secondary': '#93a1a1',
    '--darkly-text-link': '#5aafda',
    '--darkly-border': '#586e75',
    '--darkly-accent': '#5aafda',
    '--darkly-shadow': 'rgba(0, 0, 0, 0.35)',
    '--darkly-unread-bg': '#073642',
    '--darkly-read-bg': '#002b36',
    '--darkly-selected-bg': '#0a4050',
    '--darkly-compose-bg': '#073642',
  },
  monokai: {
    '--darkly-bg-primary': '#272822',
    '--darkly-bg-secondary': '#1e1f1c',
    '--darkly-bg-surface': '#3e3d32',
    '--darkly-bg-hover': '#49483e',
    '--darkly-text-primary': '#f8f8f2',
    '--darkly-text-secondary': '#b8b8a8',
    '--darkly-text-link': '#66d9ef',
    '--darkly-border': '#49483e',
    '--darkly-accent': '#a6e22e',
    '--darkly-shadow': 'rgba(0, 0, 0, 0.35)',
    '--darkly-unread-bg': '#3e3d32',
    '--darkly-read-bg': '#1e1f1c',
    '--darkly-selected-bg': '#49483e',
    '--darkly-compose-bg': '#272822',
  },
  catppuccin: {
    '--darkly-bg-primary': '#1e1e2e',
    '--darkly-bg-secondary': '#181825',
    '--darkly-bg-surface': '#313244',
    '--darkly-bg-hover': '#45475a',
    '--darkly-text-primary': '#cdd6f4',
    '--darkly-text-secondary': '#a6adc8',
    '--darkly-text-link': '#89b4fa',
    '--darkly-border': '#45475a',
    '--darkly-accent': '#cba6f7',
    '--darkly-shadow': 'rgba(0, 0, 0, 0.35)',
    '--darkly-unread-bg': '#313244',
    '--darkly-read-bg': '#181825',
    '--darkly-selected-bg': '#45475a',
    '--darkly-compose-bg': '#1e1e2e',
  },
  'rose-pine': {
    '--darkly-bg-primary': '#191724',
    '--darkly-bg-secondary': '#1f1d2e',
    '--darkly-bg-surface': '#26233a',
    '--darkly-bg-hover': '#2a283e',
    '--darkly-text-primary': '#e0def4',
    '--darkly-text-secondary': '#908caa',
    '--darkly-text-link': '#9ccfd8',
    '--darkly-border': '#3a374b',
    '--darkly-accent': '#c4a7e7',
    '--darkly-shadow': 'rgba(0, 0, 0, 0.35)',
    '--darkly-unread-bg': '#26233a',
    '--darkly-read-bg': '#1f1d2e',
    '--darkly-selected-bg': '#2a283e',
    '--darkly-compose-bg': '#1f1d2e',
  },
} as const;

export const PRESETS: Record<Exclude<PresetName, 'default'>, ThemePreset> = {
  nord: { name: 'nord', label: 'Nord', variables: presetVariables.nord },
  solarized: { name: 'solarized', label: 'Solarized Dark', variables: presetVariables.solarized },
  monokai: { name: 'monokai', label: 'Monokai', variables: presetVariables.monokai },
  catppuccin: { name: 'catppuccin', label: 'Catppuccin Mocha', variables: presetVariables.catppuccin },
  'rose-pine': { name: 'rose-pine', label: 'Rose Pine', variables: presetVariables['rose-pine'] },
};

export function getPreset(name: PresetName): ThemePreset | null {
  if (name === 'default') return null;
  return PRESETS[name] ?? null;
}
