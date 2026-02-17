import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import type { ProductConfig } from '../config';
import { SettingsPanel } from '../ui/SettingsPanel';
import { MiniControlPanel } from '../ui/MiniControlPanel';
import { DarklyProvider } from '../context';

export interface PanelHandle {
  show(anchor?: HTMLElement): void;
  hide(): void;
  isVisible(): boolean;
  destroy(): void;
}

// ── Settings Modal (centered overlay with backdrop) ─────────────────────

export function createSettingsModal(
  config: ProductConfig,
  options: {
    isPro: boolean;
    onUpgrade: () => void;
    renderProductSection?: React.ReactNode;
  },
): PanelHandle {
  const p = config.prefix;
  let backdrop: HTMLDivElement | null = null;
  let root: Root | null = null;
  let visible = false;
  let escHandler: ((e: KeyboardEvent) => void) | null = null;

  function ensureDOM(): HTMLDivElement {
    if (backdrop) return backdrop;

    const overlay = document.createElement('div');
    overlay.className = `${p}-modal-backdrop`;

    const card = document.createElement('div');
    card.className = `${p}-modal-container ${p}-settings-container`;
    overlay.appendChild(card);

    // Close on backdrop click (not card click)
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) handle.hide();
    });

    document.body.appendChild(overlay);
    backdrop = overlay;

    root = createRoot(card);
    root.render(
      <DarklyProvider config={config}>
        <SettingsPanel
          isPro={options.isPro}
          onUpgrade={options.onUpgrade}
          onClose={() => handle.hide()}
          renderProductSection={options.renderProductSection}
        />
      </DarklyProvider>,
    );

    return overlay;
  }

  const handle: PanelHandle = {
    show() {
      const b = ensureDOM();
      b.style.display = 'flex';
      visible = true;
      escHandler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') handle.hide();
      };
      document.addEventListener('keydown', escHandler);
    },

    hide() {
      if (backdrop) backdrop.style.display = 'none';
      visible = false;
      if (escHandler) {
        document.removeEventListener('keydown', escHandler);
        escHandler = null;
      }
    },

    isVisible() {
      return visible;
    },

    destroy() {
      handle.hide();
      if (root) { root.unmount(); root = null; }
      if (backdrop) { backdrop.remove(); backdrop = null; }
    },
  };

  return handle;
}

// ── Mini Panel (toolbar dropdown, anchored to button) ───────────────────

export function createMiniPanel(
  config: ProductConfig,
  options: {
    isPro: boolean;
    onAllSettings: () => void;
    onUpgrade: () => void;
  },
): PanelHandle {
  const p = config.prefix;
  let container: HTMLDivElement | null = null;
  let root: Root | null = null;
  let visible = false;
  let outsideHandler: ((e: MouseEvent) => void) | null = null;
  let escHandler: ((e: KeyboardEvent) => void) | null = null;
  let currentAnchor: HTMLElement | null = null;

  function ensureDOM(): HTMLDivElement {
    if (container) return container;

    const div = document.createElement('div');
    div.className = `${p}-mini-panel ${p}-settings-container`;
    document.body.appendChild(div);
    container = div;

    root = createRoot(div);
    root.render(
      <DarklyProvider config={config}>
        <MiniControlPanel
          isPro={options.isPro}
          onAllSettings={options.onAllSettings}
          onUpgrade={options.onUpgrade}
          onClose={() => handle.hide()}
        />
      </DarklyProvider>,
    );

    return div;
  }

  function positionPanel(anchor: HTMLElement): void {
    if (!container) return;
    const rect = anchor.getBoundingClientRect();
    const panelWidth = 220;

    let left = rect.right - panelWidth;
    const top = rect.bottom + 4;

    if (left < 8) left = 8;
    if (left + panelWidth > window.innerWidth - 8) {
      left = window.innerWidth - panelWidth - 8;
    }

    container.style.top = `${top}px`;
    container.style.left = `${left}px`;
  }

  function removeListeners(): void {
    if (outsideHandler) {
      document.removeEventListener('click', outsideHandler, true);
      outsideHandler = null;
    }
    if (escHandler) {
      document.removeEventListener('keydown', escHandler);
      escHandler = null;
    }
  }

  const handle: PanelHandle = {
    show(anchor?: HTMLElement) {
      const div = ensureDOM();
      if (anchor) {
        currentAnchor = anchor;
        positionPanel(anchor);
      }
      div.style.display = 'block';
      visible = true;

      outsideHandler = (e: MouseEvent) => {
        if (
          container && !container.contains(e.target as Node) &&
          (!currentAnchor || !currentAnchor.contains(e.target as Node))
        ) {
          handle.hide();
        }
      };
      escHandler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') handle.hide();
      };
      setTimeout(() => {
        if (outsideHandler) document.addEventListener('click', outsideHandler, true);
        if (escHandler) document.addEventListener('keydown', escHandler);
      }, 0);
    },

    hide() {
      if (container) container.style.display = 'none';
      visible = false;
      removeListeners();
    },

    isVisible() {
      return visible;
    },

    destroy() {
      handle.hide();
      if (root) { root.unmount(); root = null; }
      if (container) { container.remove(); container = null; }
    },
  };

  return handle;
}
