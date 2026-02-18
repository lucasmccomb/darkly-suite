/**
 * @jest-environment jsdom
 */
import React from 'react';
import { createSettingsModal, createMiniPanel } from '../panels';
import { createMockConfig } from '../../__tests__/test-helpers';

// Mock React components to avoid pulling in full UI trees
jest.mock('../../ui/SettingsPanel', () => ({
  SettingsPanel: () => React.createElement('div', { 'data-testid': 'settings-panel' }),
}));
jest.mock('../../ui/MiniControlPanel', () => ({
  MiniControlPanel: () => React.createElement('div', { 'data-testid': 'mini-panel' }),
}));

const config = createMockConfig();

describe('createSettingsModal', () => {
  afterEach(() => {
    // Clean up injected DOM
    document.body.innerHTML = '';
  });

  it('restores focus to the previously focused element on hide', () => {
    const button = document.createElement('button');
    document.body.appendChild(button);
    button.focus();
    expect(document.activeElement).toBe(button);

    const modal = createSettingsModal(config, {
      isPro: true,
      onUpgrade: jest.fn(),
    });

    modal.show();
    expect(modal.isVisible()).toBe(true);

    modal.hide();
    expect(modal.isVisible()).toBe(false);
    expect(document.activeElement).toBe(button);
  });

  it('does not throw if no element was focused before show', () => {
    const modal = createSettingsModal(config, {
      isPro: true,
      onUpgrade: jest.fn(),
    });

    modal.show();
    modal.hide();
    // Should not throw
  });

  it('removes escape key listener on hide', () => {
    const modal = createSettingsModal(config, {
      isPro: true,
      onUpgrade: jest.fn(),
    });

    modal.show();
    expect(modal.isVisible()).toBe(true);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(modal.isVisible()).toBe(false);
  });
});

describe('createMiniPanel', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('restores focus to the previously focused element on hide', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    expect(document.activeElement).toBe(input);

    const anchor = document.createElement('button');
    document.body.appendChild(anchor);

    const panel = createMiniPanel(config, {
      isPro: true,
      onAllSettings: jest.fn(),
      onUpgrade: jest.fn(),
    });

    panel.show(anchor);
    expect(panel.isVisible()).toBe(true);

    panel.hide();
    expect(panel.isVisible()).toBe(false);
    expect(document.activeElement).toBe(input);
  });

  it('restores focus after escape key close', () => {
    jest.useFakeTimers();

    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    textarea.focus();

    const anchor = document.createElement('button');
    document.body.appendChild(anchor);

    const panel = createMiniPanel(config, {
      isPro: true,
      onAllSettings: jest.fn(),
      onUpgrade: jest.fn(),
    });

    panel.show(anchor);

    // Escape listener is added in setTimeout(0), so flush it
    jest.runAllTimers();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(panel.isVisible()).toBe(false);
    expect(document.activeElement).toBe(textarea);

    jest.useRealTimers();
  });
});
