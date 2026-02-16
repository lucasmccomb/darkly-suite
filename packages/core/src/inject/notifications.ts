import type { ProductConfig } from '../config';

export type NotificationType = 'info' | 'success' | 'warning';

export interface NotificationOptions {
  type?: NotificationType;
  time?: number;
  persistent?: boolean;
}

/**
 * Shows a notification using the platform's notification mechanism.
 * Site plugins should override this with platform-specific implementations
 * (e.g., InboxSDK ButterBar for Gmail).
 *
 * This default implementation uses a simple DOM-based notification.
 */
export function showNotification(
  config: ProductConfig,
  message: string,
  options: NotificationOptions = {},
): { destroy: () => void } {
  const { type = 'info', time = 3000, persistent = false } = options;
  const p = config.prefix;

  const el = document.createElement('div');
  el.className = `${p}-notification ${p}-notification--${type}`;
  el.textContent = message;
  el.style.cssText = [
    'position: fixed',
    'top: 16px',
    'left: 50%',
    'transform: translateX(-50%)',
    'z-index: 999999',
    'padding: 8px 16px',
    'border-radius: 4px',
    'font-size: 13px',
    'font-family: sans-serif',
    'color: #fff',
    `background: ${type === 'warning' ? '#d93025' : type === 'success' ? '#1e8e3e' : '#1a73e8'}`,
    'box-shadow: 0 2px 8px rgba(0,0,0,0.2)',
    'transition: opacity 200ms ease',
  ].join(';');

  document.body.appendChild(el);

  let timer: ReturnType<typeof setTimeout> | null = null;

  function destroy(): void {
    if (timer) clearTimeout(timer);
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 200);
  }

  if (!persistent) {
    timer = setTimeout(destroy, time);
  }

  return { destroy };
}
