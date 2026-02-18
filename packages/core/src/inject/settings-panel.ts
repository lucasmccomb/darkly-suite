import type { ProductConfig } from '../config';

/**
 * Manages the dual panel system (mini dropdown + full sidebar).
 *
 * The mini control panel lives inside a toolbar dropdown and provides
 * quick access to mode switching and toggle. The full settings panel
 * is mounted in a sidebar and provides comprehensive configuration.
 *
 * This module provides state management for the panel system.
 * Actual rendering is handled by the React components via
 * toolbar-button.tsx and sidebar-icon.tsx inject modules.
 */

export interface PanelState {
  miniOpen: boolean;
  sidebarOpen: boolean;
}

export interface PanelManager {
  getState(): PanelState;
  openMini(): void;
  closeMini(): void;
  openSidebar(): void;
  closeSidebar(): void;
  onStateChange(cb: (state: PanelState) => void): () => void;
}

export function createPanelManager(_config: ProductConfig): PanelManager {
  const state: PanelState = { miniOpen: false, sidebarOpen: false };
  const listeners = new Set<(state: PanelState) => void>();

  function notify(): void {
    const snapshot = { ...state };
    listeners.forEach((cb) => cb(snapshot));
  }

  return {
    getState: () => ({ ...state }),

    openMini() {
      state.miniOpen = true;
      // Close sidebar when mini opens to avoid both panels showing
      state.sidebarOpen = false;
      notify();
    },

    closeMini() {
      state.miniOpen = false;
      notify();
    },

    openSidebar() {
      state.sidebarOpen = true;
      // Close mini when sidebar opens
      state.miniOpen = false;
      notify();
    },

    closeSidebar() {
      state.sidebarOpen = false;
      notify();
    },

    onStateChange(cb: (state: PanelState) => void): () => void {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
  };
}

/**
 * Injects a settings container div into the DOM with the correct prefix classes.
 * Returns the container element.
 */
export function createSettingsContainer(config: ProductConfig, variant: 'dropdown' | 'sidebar'): HTMLElement {
  const container = document.createElement('div');
  container.className = `${config.prefix}-settings-container`;
  if (variant === 'sidebar') {
    container.classList.add(`${config.prefix}-sidebar`);
  }
  return container;
}
