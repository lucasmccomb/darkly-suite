/**
 * CSS custom properties inherit through Shadow DOM boundaries naturally.
 * We use this to theme shadow DOM content by setting properties on :root.
 *
 * This module provides utilities to:
 * 1. Detect shadow roots that consume CSS custom properties
 * 2. Set custom properties on :root that cascade into shadow trees
 */

/** Set CSS custom properties on :root for shadow DOM inheritance. */
export function setRootCustomProperties(
  vars: Record<string, string>,
): () => void {
  const root = document.documentElement;
  const original: Record<string, string> = {};

  for (const [prop, value] of Object.entries(vars)) {
    original[prop] = root.style.getPropertyValue(prop);
    root.style.setProperty(prop, value, 'important');
  }

  // Return cleanup
  return () => {
    for (const [prop, value] of Object.entries(original)) {
      if (value) {
        root.style.setProperty(prop, value);
      } else {
        root.style.removeProperty(prop);
      }
    }
  };
}
