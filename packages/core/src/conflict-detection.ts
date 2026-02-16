/**
 * Conflict detection for Darkly extensions.
 *
 * When both a standalone extension (e.g. Gmail Darkly) and the bundle are
 * installed, we use a `data-darkly-active` attribute on `<html>` to ensure
 * only one injects its theme. First extension to claim the page wins;
 * subsequent extensions log a warning and exit.
 */

const CLAIM_ATTR = 'data-darkly-active';

/**
 * Attempt to claim this page for the given extension.
 * @param extensionId - Identifier for the claiming extension (e.g. 'ds-gmail', 'gd')
 * @returns `true` if the claim succeeded, `false` if another extension already owns the page
 */
export function claimPage(extensionId: string): boolean {
  const existing = document.documentElement.getAttribute(CLAIM_ATTR);

  if (existing) {
    console.warn(
      `[Darkly] Page already claimed by "${existing}". ` +
        `"${extensionId}" will not inject its theme to avoid conflicts.`
    );
    return false;
  }

  document.documentElement.setAttribute(CLAIM_ATTR, extensionId);
  return true;
}

/**
 * Release the page claim. Useful during extension unload/disable.
 * @param extensionId - Only releases if the current claim matches
 */
export function releasePage(extensionId: string): void {
  const current = document.documentElement.getAttribute(CLAIM_ATTR);
  if (current === extensionId) {
    document.documentElement.removeAttribute(CLAIM_ATTR);
  }
}

/**
 * Check which extension currently owns the page.
 * @returns The extensionId that claimed the page, or `null` if unclaimed
 */
export function getPageOwner(): string | null {
  return document.documentElement.getAttribute(CLAIM_ATTR);
}
