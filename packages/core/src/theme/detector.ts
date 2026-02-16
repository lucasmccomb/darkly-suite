export class SystemThemeDetector {
  private mediaQuery: MediaQueryList;
  private listeners: Array<(theme: 'light' | 'dark') => void> = [];
  private boundHandler: (e: MediaQueryListEvent) => void;

  constructor() {
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.boundHandler = (e: MediaQueryListEvent) => {
      const theme = e.matches ? 'dark' : 'light';
      this.listeners.forEach((cb) => cb(theme));
    };
    this.mediaQuery.addEventListener('change', this.boundHandler);
  }

  getCurrentTheme(): 'light' | 'dark' {
    return this.mediaQuery.matches ? 'dark' : 'light';
  }

  onChange(callback: (theme: 'light' | 'dark') => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  destroy(): void {
    this.mediaQuery.removeEventListener('change', this.boundHandler);
    this.listeners = [];
  }
}
