import type { FixDirective } from './fix-parser';

/**
 * Apply parsed fix directives to the current page.
 * Returns a cleanup function that removes all applied fixes.
 */
export function applyFixDirectives(directives: FixDirective[]): () => void {
  const styleElements: HTMLStyleElement[] = [];

  for (const directive of directives) {
    switch (directive.type) {
      case 'css': {
        const style = document.createElement('style');
        style.dataset.darklyFix = 'true';
        style.textContent = `${directive.selector} { ${directive.css} }`;
        document.documentElement.appendChild(style);
        styleElements.push(style);
        break;
      }
      case 'hide': {
        const style = document.createElement('style');
        style.dataset.darklyFix = 'true';
        style.textContent = `${directive.selector} { display: none !important; }`;
        document.documentElement.appendChild(style);
        styleElements.push(style);
        break;
      }
      case 'invert': {
        const style = document.createElement('style');
        style.dataset.darklyFix = 'true';
        style.textContent = `${directive.selector} { filter: invert(1) hue-rotate(180deg) !important; }`;
        document.documentElement.appendChild(style);
        styleElements.push(style);
        break;
      }
      case 'var': {
        const style = document.createElement('style');
        style.dataset.darklyFix = 'true';
        style.textContent = `:root { ${directive.property}: ${directive.value} !important; }`;
        document.documentElement.appendChild(style);
        styleElements.push(style);
        break;
      }
      case 'skip':
        // No DOM changes — the caller should check for 'skip' before calling this
        break;
    }
  }

  // Return cleanup function
  return () => {
    for (const el of styleElements) {
      el.remove();
    }
    styleElements.length = 0;
  };
}
